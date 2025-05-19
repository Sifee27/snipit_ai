const { spawn } = require('child_process');
const path = require('path');

// Force TypeScript to skip type checking
process.env.NEXT_SKIP_TYPESCRIPT_CHECK = 'true';
process.env.NODE_ENV = 'production';

console.log('Building with type checking disabled...');

// Run Next.js build with type checking and linting disabled
const buildProcess = spawn('npx', [
  'next',
  'build',
  '--no-lint'
], {
  stdio: 'inherit',
  shell: true
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Build completed successfully!');
    console.log('\nYou can now run the application with:');
    console.log('  npm run start\n');
  } else {
    console.error(`\n❌ Build failed with code ${code}`);
  }
});
