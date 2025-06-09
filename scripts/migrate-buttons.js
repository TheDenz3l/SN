#!/usr/bin/env node

/**
 * Button Migration Script
 * Automates the migration from old button components to the unified Button component
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
const BACKUP_DIR = path.join(__dirname, '../migration-backups/buttons');

// Migration patterns
const MIGRATION_PATTERNS = [
  {
    name: 'IntuitiveButton Import',
    pattern: /import\s+IntuitiveButton\s+from\s+['"]\.\.\/components\/intuitive\/IntuitiveButton['"];?/g,
    replacement: "import { IntuitiveButton } from '../components/ui';"
  },
  {
    name: 'ModernButton Import',
    pattern: /import\s+ModernButton\s+from\s+['"]\.\.\/components\/modern\/ModernButton['"];?/g,
    replacement: "import { ModernButton } from '../components/ui';"
  },
  {
    name: 'TouchButton Import',
    pattern: /import\s+{\s*TouchButton\s*}\s+from\s+['"]\.\.\/components\/advanced\/MobileOptimization['"];?/g,
    replacement: "import { TouchButton } from '../components/ui';"
  }
];

// Files to migrate (based on our analysis)
const TARGET_FILES = [
  'components/layout/IntuitiveLayout.tsx',
  'pages/IntuitiveDashboardPage.tsx',
  'pages/IntuitiveSetupPage.tsx',
  'pages/IntuitiveNotesHistoryPage.tsx',
  'components/navigation/ModernHeader.tsx',
  'components/navigation/MobileNavigation.tsx',
  'pages/ModernDashboardPage.tsx',
  'components/advanced/MobileOptimization.tsx'
];

class ButtonMigrator {
  constructor() {
    this.migratedFiles = [];
    this.errors = [];
    this.dryRun = process.argv.includes('--dry-run');
    this.verbose = process.argv.includes('--verbose');
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

  async migrateFile(filePath) {
    const fullPath = path.join(FRONTEND_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
      this.log(`File not found: ${filePath}`, 'warning');
      return false;
    }

    try {
      // Create backup
      await this.createBackup(filePath);

      // Read file content
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Apply migration patterns
      for (const pattern of MIGRATION_PATTERNS) {
        if (pattern.pattern.test(content)) {
          content = content.replace(pattern.pattern, pattern.replacement);
          modified = true;
          this.log(`Applied ${pattern.name} to ${filePath}`, 'success');
        }
      }

      if (modified) {
        if (!this.dryRun) {
          fs.writeFileSync(fullPath, content, 'utf8');
        }
        this.migratedFiles.push(filePath);
        this.log(`Migrated: ${filePath}`, 'success');
      } else {
        this.log(`No changes needed: ${filePath}`, 'info');
      }

      return true;
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      this.log(`Error migrating ${filePath}: ${error.message}`, 'error');
      return false;
    }
  }

  async validateMigration() {
    this.log('Validating migration...', 'info');
    
    for (const filePath of this.migratedFiles) {
      const fullPath = path.join(FRONTEND_DIR, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for old import patterns
      const oldPatterns = [
        /import\s+IntuitiveButton\s+from\s+['"]\.\.\/components\/intuitive\/IntuitiveButton['"];?/,
        /import\s+ModernButton\s+from\s+['"]\.\.\/components\/modern\/ModernButton['"];?/,
        /import\s+{\s*TouchButton\s*}\s+from\s+['"]\.\.\/components\/advanced\/MobileOptimization['"];?/
      ];

      for (const pattern of oldPatterns) {
        if (pattern.test(content)) {
          this.log(`Validation failed: ${filePath} still contains old imports`, 'error');
          return false;
        }
      }
    }

    this.log('Migration validation passed', 'success');
    return true;
  }

  async rollback() {
    this.log('Rolling back migration...', 'warning');
    
    for (const filePath of this.migratedFiles) {
      const backupPath = path.join(BACKUP_DIR, filePath);
      const originalPath = path.join(FRONTEND_DIR, filePath);
      
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, originalPath);
        this.log(`Restored: ${filePath}`, 'success');
      }
    }
  }

  async run() {
    this.log('Starting Button Component Migration', 'info');
    
    if (this.dryRun) {
      this.log('DRY RUN MODE - No files will be modified', 'warning');
    }

    // Migrate each target file
    for (const filePath of TARGET_FILES) {
      await this.migrateFile(filePath);
    }

    // Report results
    this.log(`Migration completed:`, 'info');
    this.log(`  Files migrated: ${this.migratedFiles.length}`, 'info');
    this.log(`  Errors: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'info');

    if (this.errors.length > 0) {
      this.log('Errors encountered:', 'error');
      this.errors.forEach(({ file, error }) => {
        this.log(`  ${file}: ${error}`, 'error');
      });
    }

    // Validate migration if not dry run
    if (!this.dryRun && this.migratedFiles.length > 0) {
      const isValid = await this.validateMigration();
      if (!isValid) {
        this.log('Migration validation failed. Consider rolling back.', 'error');
        process.exit(1);
      }
    }

    this.log('Migration script completed', 'success');
  }
}

// CLI interface
if (require.main === module) {
  const migrator = new ButtonMigrator();
  
  if (process.argv.includes('--rollback')) {
    migrator.rollback();
  } else if (process.argv.includes('--help')) {
    console.log(`
Button Migration Script

Usage:
  node migrate-buttons.js [options]

Options:
  --dry-run     Show what would be changed without making changes
  --verbose     Show detailed output
  --rollback    Restore files from backup
  --help        Show this help message

Examples:
  node migrate-buttons.js --dry-run    # Preview changes
  node migrate-buttons.js             # Run migration
  node migrate-buttons.js --rollback  # Undo migration
    `);
  } else {
    migrator.run().catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
  }
}

module.exports = ButtonMigrator;
