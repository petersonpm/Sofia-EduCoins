const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Construindo o Frontend...');
execSync('npm run build', { cwd: path.join(__dirname, '../frontend'), stdio: 'inherit' });

const src = path.join(__dirname, '../frontend/dist');
const dest = path.join(__dirname, '../dist');

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}

fs.renameSync(src, dest);
console.log('Frontend compilado e movido para a pasta raiz /dist');
