// Simple script to verify the build

const fs = require('fs');
let allFilesExist = true;

const requiredFiles = [
  './dist/index.js',
  './dist/main.js',
  './dist/licenses.txt',
  './action.yml',
  './create-main.js'
];

console.log('Verifying build files:');

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} does NOT exist`);
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log('\n✅ All required files exist - build is valid!');
  process.exit(0);
} else {
  console.log('\n❌ Some required files are missing - build is invalid!');
  process.exit(1);
} 