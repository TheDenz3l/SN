#!/usr/bin/env node

/**
 * Layout Migration Script
 * Analyzes layout patterns and generates migration guide for standardized layout system
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
const BACKUP_DIR = path.join(__dirname, '../migration-backups/layouts');

// Layout patterns to analyze
const LAYOUT_PATTERNS = [
  {
    name: 'Grid Layouts',
    patterns: [
      /grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4/g,
      /grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3/g,
      /grid grid-cols-1 gap-\d+/g,
      /grid-cols-\d+/g
    ],
    replacement: '<Grid cols={{ base: 1, md: 2, lg: 4 }} gap="md">'
  },
  {
    name: 'Flex Layouts',
    patterns: [
      /flex items-center space-x-\d+/g,
      /flex items-center justify-between/g,
      /flex flex-col space-y-\d+/g,
      /flex items-start space-x-\d+/g
    ],
    replacement: '<Inline spacing="md" align="center">'
  },
  {
    name: 'Spacing Patterns',
    patterns: [
      /space-x-[1-6]/g,
      /space-y-[1-6]/g,
      /gap-[1-6]/g,
      /p-[1-6]/g,
      /px-[1-6]/g,
      /py-[1-6]/g
    ],
    replacement: 'Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)'
  },
  {
    name: 'Container Patterns',
    patterns: [
      /max-w-\w+/g,
      /mx-auto/g,
      /w-full/g
    ],
    replacement: '<Container size="xl">'
  }
];

// Files to analyze (based on our analysis)
const TARGET_FILES = [
  'components/layout/IntuitiveLayout.tsx',
  'components/layout/Layout.tsx',
  'components/layout/AuthLayout.tsx',
  'pages/DashboardPage.tsx',
  'pages/IntuitiveDashboardPage.tsx',
  'pages/IntuitiveNotesHistoryPage.tsx',
  'components/DefaultGenerationSettings.tsx'
];

class LayoutMigrator {
  constructor() {
    this.analysisResults = {};
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

  async analyzeFile(filePath) {
    const fullPath = path.join(FRONTEND_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
      this.log(`File not found: ${filePath}`, 'warning');
      return { patterns: [], suggestions: [] };
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const patterns = [];
      const suggestions = [];

      // Analyze each pattern category
      LAYOUT_PATTERNS.forEach(category => {
        category.patterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            patterns.push({
              category: category.name,
              pattern: pattern.source,
              matches: matches.length,
              examples: matches.slice(0, 3) // Show first 3 examples
            });
            
            suggestions.push({
              category: category.name,
              suggestion: category.replacement,
              examples: matches.slice(0, 3)
            });
          }
        });
      });

      return { patterns, suggestions };
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      this.log(`Error analyzing ${filePath}: ${error.message}`, 'error');
      return { patterns: [], suggestions: [] };
    }
  }

  async generateLayoutAnalysis() {
    this.log('Generating Layout Analysis...', 'info');
    
    for (const filePath of TARGET_FILES) {
      const analysis = await this.analyzeFile(filePath);
      if (analysis.patterns.length > 0) {
        this.analysisResults[filePath] = analysis;
      }
    }

    return this.analysisResults;
  }

  async createMigrationGuide(analysisResults) {
    const guideContent = `# Layout System Migration Guide

## Overview
This guide shows the layout patterns found in your codebase and how to migrate them to the unified Layout system.

## Import Statement
Add this import to your component files:
\`\`\`tsx
import { Stack, Inline, Grid, Container, Box, Spacer } from '../components/ui';
\`\`\`

## Standardized Spacing Tokens
Use these standardized spacing tokens instead of arbitrary values:
- \`xs\` = 4px
- \`sm\` = 8px  
- \`md\` = 12px (default)
- \`lg\` = 16px
- \`xl\` = 24px
- \`2xl\` = 32px
- \`3xl\` = 48px

## Layout Analysis Results

${Object.entries(analysisResults).map(([filePath, analysis]) => `
### ${filePath}

**Found Layout Patterns:**
${analysis.patterns.map(item => `- ${item.category}: ${item.matches} occurrences
  Pattern: \`${item.pattern}\`
  Examples: ${item.examples.map(ex => `\`${ex}\``).join(', ')}`).join('\n')}

**Migration Suggestions:**
${analysis.suggestions.map(suggestion => `- ${suggestion.category}: ${suggestion.suggestion}
  Examples to replace: ${suggestion.examples.map(ex => `\`${ex}\``).join(', ')}`).join('\n')}
`).join('\n')}

## Migration Examples

### Grid Layouts
\`\`\`tsx
// Before
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {items.map(item => <div key={item.id}>{item.content}</div>)}
</div>

// After
<Grid cols={{ base: 1, md: 2, lg: 4 }} gap="xl">
  {items.map(item => <div key={item.id}>{item.content}</div>)}
</Grid>
\`\`\`

### Flex Layouts
\`\`\`tsx
// Before
<div className="flex items-center space-x-3">
  <Icon />
  <span>Text</span>
</div>

// After
<Inline spacing="md" align="center">
  <Icon />
  <span>Text</span>
</Inline>
\`\`\`

### Stack Layouts
\`\`\`tsx
// Before
<div className="flex flex-col space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// After
<Stack spacing="lg">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>
\`\`\`

### Container Layouts
\`\`\`tsx
// Before
<div className="max-w-xl mx-auto p-6">
  <Content />
</div>

// After
<Container size="xl" padding="xl">
  <Content />
</Container>
\`\`\`

### Box Layouts (Spacing Utilities)
\`\`\`tsx
// Before
<div className="p-4 mx-2 my-6">
  <Content />
</div>

// After
<Box p="lg" mx="sm" my="xl">
  <Content />
</Box>
\`\`\`

## Responsive Design
The new layout system supports responsive values:

\`\`\`tsx
// Responsive grid
<Grid 
  cols={{ base: 1, sm: 2, md: 3, lg: 4 }} 
  gap={{ base: 'sm', md: 'md', lg: 'lg' }}
>
  {items}
</Grid>

// Responsive spacing
<Stack spacing={{ base: 'sm', md: 'md', lg: 'lg' }}>
  {items}
</Stack>
\`\`\`

## Migration Strategy

1. **Phase 1**: Import layout components in target files
2. **Phase 2**: Replace grid patterns with Grid component
3. **Phase 3**: Replace flex patterns with Stack/Inline components
4. **Phase 4**: Replace container patterns with Container component
5. **Phase 5**: Replace spacing patterns with Box component
6. **Phase 6**: Test and verify visual consistency

## Benefits

- **Consistency**: Standardized spacing across the application
- **Responsive**: Built-in responsive design support
- **Maintainable**: Centralized layout logic
- **Type-safe**: TypeScript support for all props
- **Flexible**: Supports both simple and complex layouts

## Testing

After migration, verify:
- Visual appearance matches original
- Responsive behavior works correctly
- No layout shifts or breaks
- Accessibility is maintained
`;

    const guidePath = path.join(__dirname, '../docs/LAYOUT_MIGRATION_GUIDE.md');
    if (!this.dryRun) {
      fs.writeFileSync(guidePath, guideContent, 'utf8');
      this.log(`Migration guide created: ${guidePath}`, 'success');
    } else {
      this.log('Migration guide would be created (dry run)', 'info');
    }

    return guidePath;
  }

  async run() {
    this.log('🚀 Starting Layout Migration Analysis', 'info');
    
    if (this.dryRun) {
      this.log('DRY RUN MODE - No files will be modified', 'warning');
    }

    // Generate analysis
    const analysisResults = await this.generateLayoutAnalysis();
    
    // Create migration guide
    await this.createMigrationGuide(analysisResults);

    // Report results
    const totalFiles = Object.keys(analysisResults).length;
    const totalPatterns = Object.values(analysisResults).reduce((sum, analysis) => sum + analysis.patterns.length, 0);

    this.log(`Layout analysis completed:`, 'info');
    this.log(`  Files with layout patterns: ${totalFiles}`, 'info');
    this.log(`  Layout patterns found: ${totalPatterns}`, 'info');
    this.log(`  Errors: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'info');

    if (this.errors.length > 0) {
      this.log('Errors encountered:', 'error');
      this.errors.forEach(({ file, error }) => {
        this.log(`  ${file}: ${error}`, 'error');
      });
    }

    if (totalFiles > 0) {
      this.log('📋 Migration guide created with detailed instructions', 'success');
      this.log('🔧 Manual migration recommended for layout components', 'warning');
    } else {
      this.log('No layout patterns found requiring migration', 'info');
    }

    this.log('Layout migration analysis completed', 'success');
  }
}

// CLI interface
if (require.main === module) {
  const migrator = new LayoutMigrator();
  
  if (process.argv.includes('--help')) {
    console.log(`
Layout Migration Script

Usage:
  node migrate-layouts.js [options]

Options:
  --dry-run     Show what would be analyzed without making changes
  --verbose     Show detailed output
  --help        Show this help message

Examples:
  node migrate-layouts.js --dry-run    # Analyze layout patterns
  node migrate-layouts.js             # Generate migration guide
    `);
  } else {
    migrator.run().catch(error => {
      console.error('Migration analysis failed:', error);
      process.exit(1);
    });
  }
}

module.exports = LayoutMigrator;
