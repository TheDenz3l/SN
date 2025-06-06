#!/usr/bin/env node

/**
 * Test Icon Consistency
 * Checks that all ISP task displays use consistent icons
 */

const fs = require('fs');
const path = require('path');

// Files to check for ISP task displays
const filesToCheck = [
  'frontend/src/pages/ProfilePage.tsx',
  'frontend/src/pages/SetupPage.tsx',
  'frontend/src/components/OCRResults.tsx',
  'frontend/src/components/EnhancedNoteSection.tsx',
  'frontend/src/pages/NoteGenerationPage.tsx',
  'frontend/src/pages/DashboardPage.tsx'
];

// Expected patterns for consistent icon usage
const expectedPatterns = {
  // ISP task list items should use DocumentTextIcon
  taskListIcon: /DocumentTextIcon.*className.*h-[45].*w-[45].*text-primary-600/,

  // Should NOT use numbered circles for task lists
  avoidNumberedCircles: /w-6.*h-6.*bg-primary-100.*text-primary-600.*rounded-full.*text-xs.*font-medium/,

  // DocumentTextIcon import should be present
  documentIconImport: /import.*{[^}]*DocumentTextIcon[^}]*}.*from.*@heroicons\/react\/24\/outline/
};

function checkFileForPatterns(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = {
      file: filePath,
      hasDocumentIconImport: expectedPatterns.documentIconImport.test(content),
      hasTaskListIcon: expectedPatterns.taskListIcon.test(content),
      hasNumberedCircles: expectedPatterns.avoidNumberedCircles.test(content),
      issues: []
    };
    
    // Check for ISP task related content
    const hasISPTaskContent = /isp.*task|task.*isp|ISP.*Task/i.test(content);
    
    if (hasISPTaskContent) {
      console.log(`\n📋 Checking ${path.basename(filePath)} for ISP task displays...`);
      
      // Check if file has DocumentTextIcon import
      if (!results.hasDocumentIconImport) {
        // Check if it actually displays task lists (not just mentions tasks)
        const hasTaskListDisplay = /ispTasks\.map|tasks\.map.*task.*description|task.*list.*item/i.test(content);
        if (hasTaskListDisplay) {
          results.issues.push('Missing DocumentTextIcon import but displays task lists');
        }
      } else {
        console.log('  ✅ Has DocumentTextIcon import');
      }
      
      // Check for numbered circles (should be avoided for task lists)
      if (results.hasNumberedCircles) {
        results.issues.push('Uses numbered circles instead of consistent icons');
        console.log('  ⚠️  Found numbered circles - should use DocumentTextIcon');
      } else {
        console.log('  ✅ No numbered circles found');
      }
      
      // Check for consistent icon usage
      if (results.hasTaskListIcon) {
        console.log('  ✅ Uses consistent DocumentTextIcon for tasks');
      } else {
        // Check if it's the EnhancedNoteSection which uses badges instead
        if (filePath.includes('EnhancedNoteSection')) {
          console.log('  ✅ Uses ISP TASK badge (appropriate for this component)');
        } else {
          // Only flag as issue if it actually renders task lists
          const hasTaskListDisplay = /ispTasks\.map|tasks\.map.*task.*description/i.test(content);
          if (hasTaskListDisplay) {
            results.issues.push('Missing consistent DocumentTextIcon usage for task lists');
            console.log('  ⚠️  Missing consistent DocumentTextIcon usage');
          } else {
            console.log('  ✅ No task list rendering found');
          }
        }
      }
      
      // Look for specific icon patterns
      const iconMatches = content.match(/className.*h-[45].*w-[45].*text-\w+-\d+/g);
      if (iconMatches) {
        console.log(`  📊 Found ${iconMatches.length} icon usage patterns`);
      }
      
    } else {
      console.log(`\n📄 ${path.basename(filePath)} - No ISP task content found`);
    }
    
    return results;
    
  } catch (error) {
    console.error(`❌ Error checking ${filePath}:`, error.message);
    return {
      file: filePath,
      error: error.message,
      issues: [`Failed to read file: ${error.message}`]
    };
  }
}

function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ICON CONSISTENCY REPORT');
  console.log('='.repeat(60));
  
  const filesWithIssues = results.filter(r => r.issues && r.issues.length > 0);
  const filesWithoutIssues = results.filter(r => !r.issues || r.issues.length === 0);
  
  console.log(`\n✅ Files with consistent icons: ${filesWithoutIssues.length}`);
  console.log(`⚠️  Files with issues: ${filesWithIssues.length}`);
  
  if (filesWithIssues.length > 0) {
    console.log('\n🔧 ISSUES TO FIX:');
    filesWithIssues.forEach(result => {
      console.log(`\n📁 ${path.basename(result.file)}:`);
      result.issues.forEach(issue => {
        console.log(`  ❌ ${issue}`);
      });
    });
  }
  
  if (filesWithoutIssues.length > 0) {
    console.log('\n✅ CONSISTENT FILES:');
    filesWithoutIssues.forEach(result => {
      console.log(`  📁 ${path.basename(result.file)}`);
    });
  }
  
  // Overall status
  console.log('\n' + '='.repeat(60));
  if (filesWithIssues.length === 0) {
    console.log('🎉 ALL FILES HAVE CONSISTENT ICON USAGE!');
  } else {
    console.log(`⚠️  ${filesWithIssues.length} file(s) need icon consistency fixes`);
  }
  console.log('='.repeat(60));
}

function main() {
  console.log('🔍 Checking ISP task icon consistency across components...');
  
  const results = [];
  
  for (const filePath of filesToCheck) {
    if (fs.existsSync(filePath)) {
      const result = checkFileForPatterns(filePath);
      results.push(result);
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
      results.push({
        file: filePath,
        issues: ['File not found']
      });
    }
  }
  
  generateReport(results);
  
  // Return exit code based on results
  const hasIssues = results.some(r => r.issues && r.issues.length > 0);
  process.exit(hasIssues ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { checkFileForPatterns, generateReport };
