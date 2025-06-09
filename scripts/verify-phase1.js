#!/usr/bin/env node

/**
 * Phase 1 Verification Script
 * Verifies that the Button component consolidation is working correctly
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '../frontend/src');

class Phase1Verifier {
  constructor() {
    this.results = {
      filesCreated: [],
      exportsWorking: [],
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

  checkComponentStructure() {
    this.log('Checking component structure...', 'info');
    
    const requiredFiles = [
      'components/ui/Button.tsx',
      'components/ui/ButtonCompat.tsx',
      'components/ui/index.ts'
    ];

    let allFilesExist = true;
    for (const file of requiredFiles) {
      if (!this.checkFileExists(file)) {
        allFilesExist = false;
      }
    }

    return allFilesExist;
  }

  checkExportStructure() {
    this.log('Checking export structure...', 'info');
    
    const filesToCheck = [
      'components/ui/Button.tsx',
      'components/ui/ButtonCompat.tsx',
      'components/ui/index.ts'
    ];

    let allExportsWorking = true;
    for (const file of filesToCheck) {
      if (!this.checkExports(file)) {
        allExportsWorking = false;
      }
    }

    return allExportsWorking;
  }

  checkBackwardCompatibility() {
    this.log('Checking backward compatibility...', 'info');
    
    const indexPath = path.join(FRONTEND_DIR, 'components/ui/index.ts');
    
    try {
      const content = fs.readFileSync(indexPath, 'utf8');
      
      const hasIntuitiveButton = /IntuitiveButton/.test(content);
      const hasModernButton = /ModernButton/.test(content);
      const hasTouchButton = /TouchButton/.test(content);
      const hasUnifiedButton = /Button/.test(content);
      
      if (hasIntuitiveButton && hasModernButton && hasTouchButton && hasUnifiedButton) {
        this.log('Backward compatibility exports found', 'success');
        return true;
      } else {
        this.results.errors.push('Missing backward compatibility exports');
        this.log('Missing backward compatibility exports', 'error');
        return false;
      }
    } catch (error) {
      this.results.errors.push(`Error checking compatibility: ${error.message}`);
      this.log(`Error checking compatibility: ${error.message}`, 'error');
      return false;
    }
  }

  checkOriginalIntuitiveButton() {
    this.log('Checking original IntuitiveButton modification...', 'info');
    
    const buttonPath = path.join(FRONTEND_DIR, 'components/intuitive/IntuitiveButton.tsx');
    
    try {
      const content = fs.readFileSync(buttonPath, 'utf8');
      
      // Check if children prop is optional
      const hasOptionalChildren = /children\?\s*:\s*React\.ReactNode/.test(content);
      
      if (hasOptionalChildren) {
        this.log('IntuitiveButton children prop is optional', 'success');
        return true;
      } else {
        this.results.warnings.push('IntuitiveButton children prop may not be optional');
        this.log('IntuitiveButton children prop may not be optional', 'warning');
        return false;
      }
    } catch (error) {
      this.results.errors.push(`Error checking IntuitiveButton: ${error.message}`);
      this.log(`Error checking IntuitiveButton: ${error.message}`, 'error');
      return false;
    }
  }

  generateReport() {
    this.log('\n📊 PHASE 1 VERIFICATION REPORT', 'info');
    this.log('================================', 'info');
    
    this.log(`Files Created: ${this.results.filesCreated.length}`, 'info');
    this.results.filesCreated.forEach(file => {
      this.log(`  ✅ ${file}`, 'info');
    });
    
    this.log(`Exports Working: ${this.results.exportsWorking.length}`, 'info');
    this.results.exportsWorking.forEach(file => {
      this.log(`  ✅ ${file}`, 'info');
    });
    
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
    this.log(`\n🎯 PHASE 1 STATUS: ${isSuccess ? 'SUCCESS' : 'FAILED'}`, isSuccess ? 'success' : 'error');
    
    return isSuccess;
  }

  async run() {
    this.log('🚀 Starting Phase 1 Verification', 'info');
    
    const checks = [
      this.checkComponentStructure(),
      this.checkExportStructure(),
      this.checkBackwardCompatibility(),
      this.checkOriginalIntuitiveButton()
    ];
    
    const allPassed = checks.every(check => check);
    
    const success = this.generateReport();
    
    if (success) {
      this.log('✅ Phase 1 verification completed successfully!', 'success');
      this.log('🎯 Ready to proceed to Phase 2', 'success');
    } else {
      this.log('❌ Phase 1 verification failed', 'error');
      this.log('🔧 Please fix the issues before proceeding', 'error');
    }
    
    return success;
  }
}

// CLI interface
if (require.main === module) {
  const verifier = new Phase1Verifier();
  
  verifier.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

module.exports = Phase1Verifier;
