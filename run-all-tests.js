#!/usr/bin/env node

/**
 * Master Test Execution Script
 * Runs all comprehensive tests and provides final analysis using systematic methodology
 */

const { spawn } = require('child_process');
const path = require('path');

class MasterTestRunner {
  constructor() {
    this.testResults = {
      comprehensive: { status: 'pending', output: '', errors: '' },
      dataFlow: { status: 'pending', output: '', errors: '' },
      performance: { status: 'pending', output: '', errors: '' }
    };
  }

  async runTest(testName, scriptPath) {
    console.log(`🚀 Running ${testName}...`);
    console.log('='.repeat(50));

    return new Promise((resolve, reject) => {
      const child = spawn('node', [scriptPath], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output);
      });

      child.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        process.stderr.write(error);
      });

      child.on('close', (code) => {
        this.testResults[testName] = {
          status: code === 0 ? 'passed' : 'failed',
          output: stdout,
          errors: stderr,
          exitCode: code
        };

        console.log(`\n${testName} completed with exit code: ${code}\n`);
        resolve(code === 0);
      });

      child.on('error', (error) => {
        this.testResults[testName] = {
          status: 'error',
          output: stdout,
          errors: error.message,
          exitCode: -1
        };
        reject(error);
      });
    });
  }

  analyzeResults() {
    console.log('🧠 COMPREHENSIVE TEST ANALYSIS');
    console.log('==============================\n');

    // Requirements Analysis
    console.log('📋 REQUIREMENTS ANALYSIS:');
    console.log('- Feature 1 (Generate Notes Alignment) requires identical parameter passing and output consistency');
    console.log('- Feature 2 (Tone Slider Transitions) requires smooth progression without discrete jumps');
    console.log('- System must maintain performance and not break existing functionality\n');

    // Test Results Analysis
    console.log('🔍 TEST RESULTS ANALYSIS:');
    const passedTests = Object.values(this.testResults).filter(r => r.status === 'passed').length;
    const totalTests = Object.keys(this.testResults).length;

    console.log(`- Test Success Rate: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);

    Object.entries(this.testResults).forEach(([testName, result]) => {
      console.log(`- ${testName}: ${result.status.toUpperCase()} (exit code: ${result.exitCode})`);

      if (result.status === 'failed' || result.status === 'error') {
        console.log(`  ⚠️  Issues detected in ${testName}`);
      }
    });

    // Feature Verification
    console.log('\n💡 FEATURE VERIFICATION:');

    const comprehensiveSuccess = this.testResults.comprehensive.status === 'passed';
    const dataFlowSuccess = this.testResults.dataFlow.status === 'passed';
    const performanceSuccess = this.testResults.performance.status === 'passed';

    console.log(`- Generate Notes alignment works correctly: ${comprehensiveSuccess ? '✅ VERIFIED' : '❌ FAILED'}`);
    console.log(`- Tone slider provides smooth transitions: ${comprehensiveSuccess ? '✅ VERIFIED' : '❌ FAILED'}`);
    console.log(`- Data flow maintains parameter integrity: ${dataFlowSuccess ? '✅ VERIFIED' : '❌ FAILED'}`);
    console.log(`- Performance remains optimal: ${performanceSuccess ? '✅ VERIFIED' : '❌ FAILED'}`);

    // Detailed Verification
    console.log('\n🔬 DETAILED VERIFICATION:');

    if (comprehensiveSuccess) {
      console.log('✅ Feature functionality tests passed - Core requirements met');
    } else {
      console.log('❌ Feature functionality tests failed - Core requirements not met');
    }

    if (dataFlowSuccess) {
      console.log('✅ Data flow validation passed - Parameter propagation working');
    } else {
      console.log('❌ Data flow validation failed - Parameter propagation issues detected');
    }

    if (performanceSuccess) {
      console.log('✅ Performance regression tests passed - No degradation detected');
    } else {
      console.log('❌ Performance regression detected - Optimization required');
    }

    // Final Assessment
    console.log('\n🎯 FINAL ASSESSMENT:');

    const allTestsPassed = passedTests === totalTests;
    const criticalTestsPassed = comprehensiveSuccess && dataFlowSuccess;

    if (allTestsPassed) {
      console.log('🎉 IMPLEMENTATION COMPLETE AND VERIFIED');
      console.log('- All test suites passed successfully');
      console.log('- Both features meet all success criteria');
      console.log('- No regressions detected');
      console.log('- Ready for production deployment');
    } else if (criticalTestsPassed) {
      console.log('⚠️  IMPLEMENTATION MOSTLY SUCCESSFUL');
      console.log('- Core functionality tests passed');
      console.log('- Features work as intended');
      console.log('- Minor issues may need attention');
      console.log('- Consider addressing performance concerns');
    } else {
      console.log('❌ IMPLEMENTATION REQUIRES ATTENTION');
      console.log('- Critical functionality issues detected');
      console.log('- Features may not meet requirements');
      console.log('- Review and fixes needed before deployment');
    }

    return allTestsPassed;
  }

  generateDetailedReport() {
    console.log('\n📊 DETAILED TEST REPORT');
    console.log('=======================\n');

    Object.entries(this.testResults).forEach(([testName, result]) => {
      console.log(`${testName.toUpperCase()} TEST:`);
      console.log(`Status: ${result.status}`);
      console.log(`Exit Code: ${result.exitCode}`);
      
      if (result.errors) {
        console.log(`Errors: ${result.errors.substring(0, 200)}...`);
      }
      
      console.log('---\n');
    });
  }

  async runAllTests() {
    console.log('🧪 COMPREHENSIVE TESTING SUITE EXECUTION');
    console.log('=========================================\n');

    const tests = [
      { name: 'comprehensive', script: './test-comprehensive-features.js' },
      { name: 'dataFlow', script: './test-data-flow-validation.js' },
      { name: 'performance', script: './test-performance-regression.js' }
    ];

    let allPassed = true;

    for (const test of tests) {
      try {
        const passed = await this.runTest(test.name, test.script);
        if (!passed) allPassed = false;
      } catch (error) {
        console.error(`❌ ${test.name} test failed to execute:`, error.message);
        allPassed = false;
      }
      
      // Delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Perform comprehensive analysis
    const analysisResult = this.analyzeResults();
    
    // Generate detailed report
    this.generateDetailedReport();

    return analysisResult;
  }
}

// Execute master test runner
const runner = new MasterTestRunner();
runner.runAllTests()
  .then(success => {
    console.log(`\n🏁 Master test execution completed: ${success ? 'SUCCESS' : 'ISSUES DETECTED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Master test execution failed:', error);
    process.exit(1);
  });
