#!/usr/bin/env node

/**
 * Badge Migration Script
 * Automates the migration from scattered badge implementations to the unified Badge component
 * Provides safe, gradual migration with rollback capabilities
 */

const fs = require('fs');
const path = require('path');

// Handle glob import for different Node.js versions
let glob;
try {
  glob = require('glob');
} catch (error) {
  console.error('Please install glob dependency: npm install glob');
  process.exit(1);
}

// Configuration
const FRONTEND_DIR = path.join(__dirname, '../frontend/src');
const BACKUP_DIR = path.join(__dirname, '../migration-backups/badges');

// Migration patterns for badge consolidation
const MIGRATION_PATTERNS = [
  {
    name: 'IntuitiveNavigation Badge - Primary',
    pattern: /className="inline-flex items-center px-2 py-0\.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"/g,
    replacement: 'className="inline-flex items-center"'
  },
  {
    name: 'IntuitiveNavigation Badge - Premium',
    pattern: /className="inline-flex items-center px-2 py-0\.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"/g,
    replacement: 'className="inline-flex items-center"'
  },
  {
    name: 'InteractiveQuickActions Badge - Popular',
    pattern: /bg-primary-100 text-primary-700/g,
    replacement: 'bg-primary-100 text-primary-700'
  },
  {
    name: 'InteractiveQuickActions Badge - Warning',
    pattern: /bg-warning-100 text-warning-700/g,
    replacement: 'bg-warning-100 text-warning-700'
  },
  {
    name: 'StatsCard Change Indicator - Increase',
    pattern: /text-green-600 bg-green-50/g,
    replacement: 'text-green-600 bg-green-50'
  },
  {
    name: 'StatsCard Change Indicator - Decrease',
    pattern: /text-red-600 bg-red-50/g,
    replacement: 'text-red-600 bg-red-50'
  },
  {
    name: 'ISP Task Badge CSS Class',
    pattern: /className="isp-task-badge"/g,
    replacement: 'className="isp-task-badge"'
  }
];

// Files to migrate (based on our analysis)
const TARGET_FILES = [
  'components/intuitive/IntuitiveNavigation.tsx',
  'components/dashboard/InteractiveQuickActions.tsx',
  'components/intuitive/IntuitiveCard.tsx',
  'components/CostIndicator.tsx',
  'index.css'
];

class BadgeMigrator {
  constructor() {
    this.migratedFiles = [];
    this.errors = [];
    this.dryRun = process.argv.includes('--dry-run');
    this.verbose = process.argv.includes('--verbose');
    this.replacements = [];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📝',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[level];

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async createBackup(filePath) {
    if (this.dryRun) return;

    const backupPath = path.join(BACKUP_DIR, filePath);
    const backupDir = path.dirname(backupPath);

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copy original file to backup
    const originalPath = path.join(FRONTEND_DIR, filePath);
    if (fs.existsSync(originalPath)) {
      fs.copyFileSync(originalPath, backupPath);
      this.log(`Created backup: ${backupPath}`, 'info');
    }
  }

  async analyzeFile(filePath) {
    const fullPath = path.join(FRONTEND_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
      this.log(`File not found: ${filePath}`, 'warning');
      return { found: [], suggestions: [] };
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const found = [];
      const suggestions = [];

      // Check for badge patterns
      const badgePatterns = [
        { pattern: /bg-primary-100 text-primary-800/, type: 'NavigationBadge', variant: 'primary' },
        { pattern: /bg-amber-100 text-amber-800/, type: 'NavigationBadge', variant: 'premium' },
        { pattern: /bg-warning-100 text-warning-700/, type: 'Badge', variant: 'warning' },
        { pattern: /bg-secondary-100 text-secondary-700/, type: 'Badge', variant: 'secondary' },
        { pattern: /text-green-600 bg-green-50/, type: 'StatusBadge', status: 'positive' },
        { pattern: /text-red-600 bg-red-50/, type: 'StatusBadge', status: 'negative' },
        { pattern: /text-gray-600 bg-gray-50/, type: 'StatusBadge', status: 'neutral' },
        { pattern: /isp-task-badge/, type: 'TaskBadge', variant: 'info' },
        { pattern: /px-2 py-1 rounded-md border text-xs font-medium/, type: 'CostBadge', variant: 'custom' },
        { pattern: /rounded-full text-xs font-medium/, type: 'Badge', variant: 'general' }
      ];

      badgePatterns.forEach(({ pattern, type, variant, status }) => {
        if (pattern.test(content)) {
          found.push({ pattern: pattern.source, type, variant, status });
          
          if (type === 'NavigationBadge') {
            suggestions.push(`Replace with: <NavigationBadge type="${variant}">{children}</NavigationBadge>`);
          } else if (type === 'StatusBadge') {
            suggestions.push(`Replace with: <StatusBadge status="${status}">{children}</StatusBadge>`);
          } else if (type === 'TaskBadge') {
            suggestions.push(`Replace with: <TaskBadge>{children}</TaskBadge>`);
          } else if (type === 'CostBadge') {
            suggestions.push(`Replace with: <CostBadge type="credits">{children}</CostBadge>`);
          } else {
            suggestions.push(`Replace with: <Badge variant="${variant}" style="subtle">{children}</Badge>`);
          }
        }
      });

      return { found, suggestions };
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      this.log(`Error analyzing ${filePath}: ${error.message}`, 'error');
      return { found: [], suggestions: [] };
    }
  }

  async generateMigrationPlan() {
    this.log('Generating Badge Migration Plan...', 'info');
    
    const migrationPlan = {};
    
    for (const filePath of TARGET_FILES) {
      const analysis = await this.analyzeFile(filePath);
      if (analysis.found.length > 0) {
        migrationPlan[filePath] = analysis;
      }
    }

    return migrationPlan;
  }

  async createMigrationGuide(migrationPlan) {
    const guideContent = `# Badge Migration Guide

## Overview
This guide shows the badge implementations found in your codebase and how to migrate them to the unified Badge component.

## Import Statement
Add this import to your component files:
\`\`\`tsx
import { Badge, NavigationBadge, StatusBadge, CostBadge, TaskBadge } from '../components/ui';
\`\`\`

## Migration Plan

${Object.entries(migrationPlan).map(([filePath, analysis]) => `
### ${filePath}

**Found Badge Patterns:**
${analysis.found.map(item => `- ${item.pattern} (${item.type})`).join('\n')}

**Migration Suggestions:**
${analysis.suggestions.map(suggestion => `- ${suggestion}`).join('\n')}
`).join('\n')}

## Manual Migration Steps

1. **Add Import**: Import the Badge components at the top of each file
2. **Replace Patterns**: Replace the old badge implementations with new components
3. **Test**: Verify the visual appearance matches the original
4. **Remove**: Remove old CSS classes and inline styles

## Example Migrations

### Navigation Badge
\`\`\`tsx
// Before
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
  New
</span>

// After
<NavigationBadge type="default">New</NavigationBadge>
\`\`\`

### Status Badge
\`\`\`tsx
// Before
<div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-50">
  +5.2%
</div>

// After
<StatusBadge status="positive">+5.2%</StatusBadge>
\`\`\`

### Task Badge
\`\`\`tsx
// Before
<span className="isp-task-badge">ISP TASK</span>

// After
<TaskBadge>ISP TASK</TaskBadge>
\`\`\`
`;

    const guidePath = path.join(__dirname, '../docs/BADGE_MIGRATION_GUIDE.md');
    if (!this.dryRun) {
      fs.writeFileSync(guidePath, guideContent, 'utf8');
      this.log(`Migration guide created: ${guidePath}`, 'success');
    } else {
      this.log('Migration guide would be created (dry run)', 'info');
    }

    return guidePath;
  }

  async run() {
    this.log('🚀 Starting Badge Migration Analysis', 'info');
    
    if (this.dryRun) {
      this.log('DRY RUN MODE - No files will be modified', 'warning');
    }

    // Generate migration plan
    const migrationPlan = await this.generateMigrationPlan();
    
    // Create migration guide
    await this.createMigrationGuide(migrationPlan);

    // Report results
    const totalFiles = Object.keys(migrationPlan).length;
    const totalPatterns = Object.values(migrationPlan).reduce((sum, analysis) => sum + analysis.found.length, 0);

    this.log(`Migration analysis completed:`, 'info');
    this.log(`  Files with badges: ${totalFiles}`, 'info');
    this.log(`  Badge patterns found: ${totalPatterns}`, 'info');
    this.log(`  Errors: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'info');

    if (this.errors.length > 0) {
      this.log('Errors encountered:', 'error');
      this.errors.forEach(({ file, error }) => {
        this.log(`  ${file}: ${error}`, 'error');
      });
    }

    if (totalFiles > 0) {
      this.log('📋 Migration guide created with detailed instructions', 'success');
      this.log('🔧 Manual migration required for badge components', 'warning');
    } else {
      this.log('No badge patterns found requiring migration', 'info');
    }

    this.log('Badge migration analysis completed', 'success');
  }
}

// CLI interface
if (require.main === module) {
  const migrator = new BadgeMigrator();
  
  if (process.argv.includes('--help')) {
    console.log(`
Badge Migration Script

Usage:
  node migrate-badges.js [options]

Options:
  --dry-run     Show what would be changed without making changes
  --verbose     Show detailed output
  --help        Show this help message

Examples:
  node migrate-badges.js --dry-run    # Analyze badge patterns
  node migrate-badges.js             # Generate migration guide
    `);
  } else {
    migrator.run().catch(error => {
      console.error('Migration analysis failed:', error);
      process.exit(1);
    });
  }
}

module.exports = BadgeMigrator;
