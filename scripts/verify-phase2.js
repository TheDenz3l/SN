#!/usr/bin/env node

/**
 * Phase 2 Verification Script
 * Verifies that the Badge component consolidation is working correctly
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '../frontend/src');

class Phase2Verifier {
  constructor() {
    this.results = {
      filesCreated: [],
      exportsWorking: [],
      migrationGuideCreated: false,
      errors: [],
      warnings: []
    };
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

  checkFileExists(filePath) {
    const fullPath = path.join(FRONTEND_DIR, filePath);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      this.results.filesCreated.push(filePath);
      this.log(`File exists: ${filePath}`, 'success');
    } else {
      this.results.errors.push(`Missing file: ${filePath}`);
      this.log(`File missing: ${filePath}`, 'error');
    }
    
    return exists;
  }

  checkExports(filePath) {
    const fullPath = path.join(FRONTEND_DIR, filePath);
    
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for proper exports
      const hasDefaultExport = /export\s+default/.test(content);
      const hasNamedExports = /export\s+{/.test(content);
      const hasTypeExports = /export\s+type/.test(content);
      
      if (hasDefaultExport || hasNamedExports || hasTypeExports) {
        this.results.exportsWorking.push(filePath);
        this.log(`Exports working: ${filePath}`, 'success');
        return true;
      } else {
        this.results.warnings.push(`No exports found in: ${filePath}`);
        this.log(`No exports found: ${filePath}`, 'warning');
        return false;
      }
    } catch (error) {
      this.results.errors.push(`Error reading ${filePath}: ${error.message}`);
      this.log(`Error reading ${filePath}: ${error.message}`, 'error');
      return false;
    }
  }

  checkBadgeComponent() {
    this.log('Checking Badge component structure...', 'info');
    
    const requiredFiles = [
      'components/ui/Badge.tsx'
    ];

    let allFilesExist = true;
    for (const file of requiredFiles) {
      if (!this.checkFileExists(file)) {
        allFilesExist = false;
      }
    }

    return allFilesExist;
  }

  checkBadgeExports() {
    this.log('Checking Badge export structure...', 'info');
    
    const indexPath = path.join(FRONTEND_DIR, 'components/ui/index.ts');
    
    try {
      const content = fs.readFileSync(indexPath, 'utf8');
      
      const hasBadge = /Badge/.test(content);
      const hasNavigationBadge = /NavigationBadge/.test(content);
      const hasStatusBadge = /StatusBadge/.test(content);
      const hasCostBadge = /CostBadge/.test(content);
      const hasTaskBadge = /TaskBadge/.test(content);
      
      if (hasBadge && hasNavigationBadge && hasStatusBadge && hasCostBadge && hasTaskBadge) {
        this.log('All Badge exports found', 'success');
        return true;
      } else {
        this.results.errors.push('Missing Badge exports in index.ts');
        this.log('Missing Badge exports in index.ts', 'error');
        return false;
      }
    } catch (error) {
      this.results.errors.push(`Error checking Badge exports: ${error.message}`);
      this.log(`Error checking Badge exports: ${error.message}`, 'error');
      return false;
    }
  }

  checkBadgeVariants() {
    this.log('Checking Badge component variants...', 'info');
    
    const badgePath = path.join(FRONTEND_DIR, 'components/ui/Badge.tsx');
    
    try {
      const content = fs.readFileSync(badgePath, 'utf8');
      
      // Check for required variants
      const hasVariants = /variant\?\s*:\s*'primary'\s*\|\s*'secondary'\s*\|\s*'success'\s*\|\s*'warning'\s*\|\s*'error'\s*\|\s*'info'\s*\|\s*'neutral'/.test(content);
      const hasStyles = /style\?\s*:\s*'filled'\s*\|\s*'outline'\s*\|\s*'subtle'\s*\|\s*'gradient'/.test(content);
      const hasSizes = /size\?\s*:\s*'sm'\s*\|\s*'md'\s*\|\s*'lg'/.test(content);
      const hasSpecializedComponents = /NavigationBadge/.test(content) && /StatusBadge/.test(content) && /CostBadge/.test(content) && /TaskBadge/.test(content);
      
      if (hasVariants && hasStyles && hasSizes && hasSpecializedComponents) {
        this.log('Badge component has all required variants and specialized components', 'success');
        return true;
      } else {
        this.results.warnings.push('Badge component may be missing some variants or specialized components');
        this.log('Badge component may be missing some variants or specialized components', 'warning');
        return false;
      }
    } catch (error) {
      this.results.errors.push(`Error checking Badge variants: ${error.message}`);
      this.log(`Error checking Badge variants: ${error.message}`, 'error');
      return false;
    }
  }

  checkMigrationGuide() {
    this.log('Checking migration guide...', 'info');
    
    const guidePath = path.join(__dirname, '../docs/BADGE_MIGRATION_GUIDE.md');
    
    if (fs.existsSync(guidePath)) {
      this.results.migrationGuideCreated = true;
      this.log('Migration guide exists', 'success');
      
      try {
        const content = fs.readFileSync(guidePath, 'utf8');
        
        // Check for key sections
        const hasOverview = /## Overview/.test(content);
        const hasImportStatement = /## Import Statement/.test(content);
        const hasMigrationPlan = /## Migration Plan/.test(content);
        const hasExamples = /## Example Migrations/.test(content);
        
        if (hasOverview && hasImportStatement && hasMigrationPlan && hasExamples) {
          this.log('Migration guide has all required sections', 'success');
          return true;
        } else {
          this.results.warnings.push('Migration guide may be missing some sections');
          this.log('Migration guide may be missing some sections', 'warning');
          return false;
        }
      } catch (error) {
        this.results.errors.push(`Error reading migration guide: ${error.message}`);
        this.log(`Error reading migration guide: ${error.message}`, 'error');
        return false;
      }
    } else {
      this.results.errors.push('Migration guide not found');
      this.log('Migration guide not found', 'error');
      return false;
    }
  }

  generateReport() {
    this.log('\n📊 PHASE 2 VERIFICATION REPORT', 'info');
    this.log('================================', 'info');
    
    this.log(`Files Created: ${this.results.filesCreated.length}`, 'info');
    this.results.filesCreated.forEach(file => {
      this.log(`  ✅ ${file}`, 'info');
    });
    
    this.log(`Exports Working: ${this.results.exportsWorking.length}`, 'info');
    this.results.exportsWorking.forEach(file => {
      this.log(`  ✅ ${file}`, 'info');
    });
    
    this.log(`Migration Guide: ${this.results.migrationGuideCreated ? 'Created' : 'Missing'}`, 
             this.results.migrationGuideCreated ? 'success' : 'error');
    
    if (this.results.warnings.length > 0) {
      this.log(`Warnings: ${this.results.warnings.length}`, 'warning');
      this.results.warnings.forEach(warning => {
        this.log(`  ⚠️  ${warning}`, 'warning');
      });
    }
    
    if (this.results.errors.length > 0) {
      this.log(`Errors: ${this.results.errors.length}`, 'error');
      this.results.errors.forEach(error => {
        this.log(`  ❌ ${error}`, 'error');
      });
    }
    
    const isSuccess = this.results.errors.length === 0;
    this.log(`\n🎯 PHASE 2 STATUS: ${isSuccess ? 'SUCCESS' : 'FAILED'}`, isSuccess ? 'success' : 'error');
    
    return isSuccess;
  }

  async run() {
    this.log('🚀 Starting Phase 2 Verification', 'info');
    
    const checks = [
      this.checkBadgeComponent(),
      this.checkBadgeExports(),
      this.checkBadgeVariants(),
      this.checkMigrationGuide()
    ];
    
    const allPassed = checks.every(check => check);
    
    const success = this.generateReport();
    
    if (success) {
      this.log('✅ Phase 2 verification completed successfully!', 'success');
      this.log('🎯 Badge component system is ready for use', 'success');
      this.log('📋 Migration guide available for manual badge migration', 'info');
    } else {
      this.log('❌ Phase 2 verification failed', 'error');
      this.log('🔧 Please fix the issues before proceeding', 'error');
    }
    
    return success;
  }
}

// CLI interface
if (require.main === module) {
  const verifier = new Phase2Verifier();
  
  verifier.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

module.exports = Phase2Verifier;
