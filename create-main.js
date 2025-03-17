// Script to create the main.js entry point
const fs = require('fs');

const content = `// Custom entry point that handles the missing sourcemap-register.js file
try {
  // Try to load sourcemap-register.js, but don't fail if it's not found
  try {
    require('./sourcemap-register.js');
  } catch (error) {
    // Ignore error if sourcemap-register.js is not found
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
    console.log('Note: sourcemap-register.js not found. Continuing without sourcemaps.');
  }
  
  // Now load the main module
  require('./index.js');
} catch (error) {
  console.error('Error loading application:', error);
  process.exit(1);}`;

fs.writeFileSync('./dist/main.js', content);
console.log('Created main.js entry point'); 