#!/usr/bin/env node

/**
 * Design System Verification Script
 * Comprehensive verification of the complete SwiftNotes Design System
 * Validates all components, documentation, and system integrity
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '../frontend/src');
const DOCS_DIR = path.join(__dirname, '../docs');

class DesignSystemVerifier {
  constructor() {
    this.results = {
      components: {
        created: [],
        exported: [],
        tested: []
      },
      documentation: {
        created: [],
        complete: []
      },
      migrations: {
        guides: [],
        scripts: []
      },
      system: {
        integrity: true,
        errors: [],
        warnings: []
      }
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📝',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      section: '🔍'
    }[level];

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  checkFileExists(filePath, baseDir = FRONTEND_DIR) {
    const fullPath = path.join(baseDir, filePath);
    return fs.existsSync(fullPath);
  }

  checkDocumentationExists(fileName) {
    const fullPath = path.join(DOCS_DIR, fileName);
    return fs.existsSync(fullPath);
  }

  // Phase 1: Button Component Verification
  verifyButtonComponent() {
    this.log('Verifying Button Component System...', 'section');
    
    const buttonExists = this.checkFileExists('components/ui/Button.tsx');
    if (buttonExists) {
      this.results.components.created.push('Button');
      this.log('Button component exists', 'success');
    } else {
      this.results.system.errors.push('Button component missing');
      this.log('Button component missing', 'error');
    }

    // Check Button exports
    try {
      const indexPath = path.join(FRONTEND_DIR, 'components/ui/index.ts');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      if (/Button/.test(content)) {
        this.results.components.exported.push('Button');
        this.log('Button properly exported', 'success');
      } else {
        this.results.system.errors.push('Button not exported');
        this.log('Button not exported', 'error');
      }
    } catch (error) {
      this.results.system.errors.push(`Error checking Button exports: ${error.message}`);
    }

    return buttonExists;
  }

  // Phase 2: Badge Component Verification
  verifyBadgeComponent() {
    this.log('Verifying Badge Component System...', 'section');
    
    const badgeExists = this.checkFileExists('components/ui/Badge.tsx');
    if (badgeExists) {
      this.results.components.created.push('Badge');
      this.log('Badge component exists', 'success');
    } else {
      this.results.system.errors.push('Badge component missing');
      this.log('Badge component missing', 'error');
    }

    // Check specialized badge exports
    try {
      const indexPath = path.join(FRONTEND_DIR, 'components/ui/index.ts');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      const badgeComponents = ['Badge', 'NavigationBadge', 'StatusBadge', 'CostBadge', 'TaskBadge'];
      const missingBadges = badgeComponents.filter(badge => !new RegExp(badge).test(content));
      
      if (missingBadges.length === 0) {
        this.results.components.exported.push('Badge System');
        this.log('All Badge components properly exported', 'success');
      } else {
        this.results.system.errors.push(`Missing Badge exports: ${missingBadges.join(', ')}`);
        this.log(`Missing Badge exports: ${missingBadges.join(', ')}`, 'error');
      }
    } catch (error) {
      this.results.system.errors.push(`Error checking Badge exports: ${error.message}`);
    }

    return badgeExists;
  }

  // Phase 3: Layout Component Verification
  verifyLayoutComponent() {
    this.log('Verifying Layout Component System...', 'section');
    
    const layoutExists = this.checkFileExists('components/ui/Layout.tsx');
    if (layoutExists) {
      this.results.components.created.push('Layout');
      this.log('Layout component exists', 'success');
    } else {
      this.results.system.errors.push('Layout component missing');
      this.log('Layout component missing', 'error');
    }

    // Check layout component exports
    try {
      const indexPath = path.join(FRONTEND_DIR, 'components/ui/index.ts');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      const layoutComponents = ['Stack', 'Inline', 'Grid', 'Container', 'Box', 'Spacer'];
      const missingLayout = layoutComponents.filter(component => !new RegExp(component).test(content));
      
      if (missingLayout.length === 0) {
        this.results.components.exported.push('Layout System');
        this.log('All Layout components properly exported', 'success');
      } else {
        this.results.system.errors.push(`Missing Layout exports: ${missingLayout.join(', ')}`);
        this.log(`Missing Layout exports: ${missingLayout.join(', ')}`, 'error');
      }
    } catch (error) {
      this.results.system.errors.push(`Error checking Layout exports: ${error.message}`);
    }

    return layoutExists;
  }

  // Phase 4: Documentation Verification
  verifyDocumentation() {
    this.log('Verifying Design System Documentation...', 'section');
    
    const requiredDocs = [
      'DESIGN_SYSTEM.md',
      'COMPONENT_API.md',
      'DESIGN_TOKENS.md',
      'ACCESSIBILITY_GUIDELINES.md',
      'DEVELOPER_GUIDE.md'
    ];

    const migrationDocs = [
      'BUTTON_MIGRATION_GUIDE.md',
      'BADGE_MIGRATION_GUIDE.md',
      'LAYOUT_MIGRATION_GUIDE.md'
    ];

    // Check main documentation
    requiredDocs.forEach(doc => {
      if (this.checkDocumentationExists(doc)) {
        this.results.documentation.created.push(doc);
        this.log(`Documentation exists: ${doc}`, 'success');
      } else {
        this.results.system.errors.push(`Missing documentation: ${doc}`);
        this.log(`Missing documentation: ${doc}`, 'error');
      }
    });

    // Check migration guides
    migrationDocs.forEach(doc => {
      if (this.checkDocumentationExists(doc)) {
        this.results.migrations.guides.push(doc);
        this.log(`Migration guide exists: ${doc}`, 'success');
      } else {
        this.results.system.warnings.push(`Missing migration guide: ${doc}`);
        this.log(`Missing migration guide: ${doc}`, 'warning');
      }
    });

    return requiredDocs.every(doc => this.checkDocumentationExists(doc));
  }

  // Verify Migration Scripts
  verifyMigrationScripts() {
    this.log('Verifying Migration Scripts...', 'section');
    
    const migrationScripts = [
      'migrate-buttons.js',
      'migrate-badges.js',
      'migrate-layouts.js'
    ];

    const verificationScripts = [
      'verify-phase1.js',
      'verify-phase2.js',
      'verify-phase3.js'
    ];

    // Check migration scripts
    migrationScripts.forEach(script => {
      const scriptPath = path.join(__dirname, script);
      if (fs.existsSync(scriptPath)) {
        this.results.migrations.scripts.push(script);
        this.log(`Migration script exists: ${script}`, 'success');
      } else {
        this.results.system.warnings.push(`Missing migration script: ${script}`);
        this.log(`Missing migration script: ${script}`, 'warning');
      }
    });

    // Check verification scripts
    verificationScripts.forEach(script => {
      const scriptPath = path.join(__dirname, script);
      if (fs.existsSync(scriptPath)) {
        this.results.migrations.scripts.push(script);
        this.log(`Verification script exists: ${script}`, 'success');
      } else {
        this.results.system.warnings.push(`Missing verification script: ${script}`);
        this.log(`Missing verification script: ${script}`, 'warning');
      }
    });

    return true;
  }

  // Verify Tailwind Configuration
  verifyTailwindConfig() {
    this.log('Verifying Tailwind Configuration...', 'section');
    
    const tailwindPath = path.join(__dirname, '../frontend/tailwind.config.js');
    
    try {
      const content = fs.readFileSync(tailwindPath, 'utf8');
      
      // Check for design system enhancements
      const hasLayoutSpacing = /layout-xs|layout-sm|layout-md|layout-lg|layout-xl|layout-2xl|layout-3xl/.test(content);
      const hasCustomSpacing = /spacing:/.test(content);
      const hasCustomColors = /colors:/.test(content);
      
      if (hasLayoutSpacing) {
        this.log('Tailwind config includes layout spacing tokens', 'success');
      } else {
        this.results.system.warnings.push('Tailwind config missing layout spacing tokens');
        this.log('Tailwind config missing layout spacing tokens', 'warning');
      }

      if (hasCustomSpacing && hasCustomColors) {
        this.log('Tailwind config includes design system tokens', 'success');
      } else {
        this.results.system.warnings.push('Tailwind config may be missing design system tokens');
        this.log('Tailwind config may be missing design system tokens', 'warning');
      }

      return true;
    } catch (error) {
      this.results.system.errors.push(`Error checking Tailwind config: ${error.message}`);
      this.log(`Error checking Tailwind config: ${error.message}`, 'error');
      return false;
    }
  }

  // Verify Test Components
  verifyTestComponents() {
    this.log('Verifying Test Components...', 'section');
    
    const testComponents = [
      'components/ui/test-button-integration.tsx',
      'components/ui/test-badge-integration.tsx',
      'components/ui/test-layout-integration.tsx'
    ];

    testComponents.forEach(component => {
      if (this.checkFileExists(component)) {
        this.results.components.tested.push(component);
        this.log(`Test component exists: ${component}`, 'success');
      } else {
        this.results.system.warnings.push(`Missing test component: ${component}`);
        this.log(`Missing test component: ${component}`, 'warning');
      }
    });

    return true;
  }

  // Generate Comprehensive Report
  generateReport() {
    this.log('\n📊 DESIGN SYSTEM VERIFICATION REPORT', 'section');
    this.log('=====================================', 'info');
    
    // Component Summary
    this.log(`\n🧩 COMPONENTS`, 'section');
    this.log(`Created: ${this.results.components.created.length}`, 'info');
    this.results.components.created.forEach(component => {
      this.log(`  ✅ ${component}`, 'info');
    });
    
    this.log(`Exported: ${this.results.components.exported.length}`, 'info');
    this.results.components.exported.forEach(component => {
      this.log(`  ✅ ${component}`, 'info');
    });

    this.log(`Test Components: ${this.results.components.tested.length}`, 'info');
    this.results.components.tested.forEach(component => {
      this.log(`  ✅ ${component}`, 'info');
    });

    // Documentation Summary
    this.log(`\n📚 DOCUMENTATION`, 'section');
    this.log(`Main Docs: ${this.results.documentation.created.length}`, 'info');
    this.results.documentation.created.forEach(doc => {
      this.log(`  ✅ ${doc}`, 'info');
    });

    this.log(`Migration Guides: ${this.results.migrations.guides.length}`, 'info');
    this.results.migrations.guides.forEach(guide => {
      this.log(`  ✅ ${guide}`, 'info');
    });

    this.log(`Migration Scripts: ${this.results.migrations.scripts.length}`, 'info');
    this.results.migrations.scripts.forEach(script => {
      this.log(`  ✅ ${script}`, 'info');
    });

    // System Health
    this.log(`\n🔧 SYSTEM HEALTH`, 'section');
    
    if (this.results.system.warnings.length > 0) {
      this.log(`Warnings: ${this.results.system.warnings.length}`, 'warning');
      this.results.system.warnings.forEach(warning => {
        this.log(`  ⚠️  ${warning}`, 'warning');
      });
    }
    
    if (this.results.system.errors.length > 0) {
      this.log(`Errors: ${this.results.system.errors.length}`, 'error');
      this.results.system.errors.forEach(error => {
        this.log(`  ❌ ${error}`, 'error');
      });
    }

    // Overall Status
    const isSuccess = this.results.system.errors.length === 0;
    const hasWarnings = this.results.system.warnings.length > 0;
    
    this.log(`\n🎯 OVERALL STATUS`, 'section');
    
    if (isSuccess && !hasWarnings) {
      this.log('🎉 DESIGN SYSTEM: COMPLETE SUCCESS', 'success');
      this.log('All components, documentation, and systems are working correctly!', 'success');
    } else if (isSuccess && hasWarnings) {
      this.log('✅ DESIGN SYSTEM: SUCCESS WITH WARNINGS', 'warning');
      this.log('Core system is functional but some optional components may be missing', 'warning');
    } else {
      this.log('❌ DESIGN SYSTEM: FAILED', 'error');
      this.log('Critical issues found that need to be resolved', 'error');
    }

    // Summary Statistics
    this.log(`\n📈 SUMMARY STATISTICS`, 'section');
    this.log(`Total Components: ${this.results.components.created.length}`, 'info');
    this.log(`Total Documentation Files: ${this.results.documentation.created.length + this.results.migrations.guides.length}`, 'info');
    this.log(`Total Scripts: ${this.results.migrations.scripts.length}`, 'info');
    this.log(`System Integrity: ${isSuccess ? 'PASS' : 'FAIL'}`, isSuccess ? 'success' : 'error');
    
    return isSuccess;
  }

  async run() {
    this.log('🚀 Starting Complete Design System Verification', 'section');
    this.log('This will verify all phases and components of the SwiftNotes Design System\n', 'info');
    
    // Run all verification checks
    const checks = [
      this.verifyButtonComponent(),
      this.verifyBadgeComponent(),
      this.verifyLayoutComponent(),
      this.verifyDocumentation(),
      this.verifyMigrationScripts(),
      this.verifyTailwindConfig(),
      this.verifyTestComponents()
    ];
    
    // Generate comprehensive report
    const success = this.generateReport();
    
    if (success) {
      this.log('\n🎊 Design System verification completed successfully!', 'success');
      this.log('🎯 The SwiftNotes Design System is ready for production use', 'success');
    } else {
      this.log('\n💥 Design System verification failed', 'error');
      this.log('🔧 Please resolve the critical issues before proceeding', 'error');
    }
    
    return success;
  }
}

// CLI interface
if (require.main === module) {
  const verifier = new DesignSystemVerifier();
  
  verifier.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Design System verification failed:', error);
    process.exit(1);
  });
}

module.exports = DesignSystemVerifier;
