#!/usr/bin/env node

/**
 * Multi-language test runner script
 * Runs specific multi-language tests and reports results
 */

const { spawn } = require('child_process');
const path = require('path');

const testFiles = [
  'tests/multi-language.spec.ts'
];

const runTests = async () => {
  console.log('🌐 Running Multi-language Feature Tests...\n');

  const testCommand = 'npx';
  const testArgs = [
    'playwright',
    'test',
    ...testFiles,
    '--reporter=html,list',
    '--workers=1', // Run sequentially for better debugging
    '--retries=1'
  ];

  console.log(`Running: ${testCommand} ${testArgs.join(' ')}\n`);

  const testProcess = spawn(testCommand, testArgs, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  });

  return new Promise((resolve, reject) => {
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ All multi-language tests passed!');
        resolve(code);
      } else {
        console.log('\n❌ Some multi-language tests failed.');
        console.log('Check the test report for details.');
        resolve(code);
      }
    });

    testProcess.on('error', (error) => {
      console.error('❌ Failed to start test process:', error);
      reject(error);
    });
  });
};

// Check if dev server is running
const checkDevServer = async () => {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch (error) {
    return false;
  }
};

const main = async () => {
  console.log('🔍 Checking if development server is running...');

  const isServerRunning = await checkDevServer();

  if (!isServerRunning) {
    console.log('⚠️  Development server is not running on port 3000');
    console.log('Please start the dev server first with: pnpm dev');
    process.exit(1);
  }

  console.log('✅ Development server is running\n');

  try {
    const exitCode = await runTests();
    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { runTests };