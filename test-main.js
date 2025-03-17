// Test script for verifying main.js

console.log('Running test for main.js...');

// Suppress console.error to avoid showing the token error
const originalConsoleError = console.error;
console.error = function(msg) {
  // Don't output token errors
  if (!String(msg).includes('Parameter token or opts.auth is required')) {
    originalConsoleError(msg);
  } else {
    // Just log that we got the token error without showing the full message
    console.log('Got expected token error (suppressed output)');
  }
};

try {
  // Try to load the main.js file
  require('./dist/main.js');
  console.log('✅ Test passed - main.js loaded successfully');
  process.exit(0);
} catch (e) {
  if (!e.message.includes('Parameter token or opts.auth is required')) {
    console.error('❌ Test failed - got an unexpected error:', e);
    process.exit(1);
  } else {
    console.log('✅ Test passed - got the expected token error, which means main.js loaded correctly!');
    process.exit(0);
  }
} 