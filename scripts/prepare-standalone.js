const fs = require('fs');
const path = require('path');

function copyDirIfExists(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true, force: true });
}

const root = process.cwd();
const standaloneRoot = path.join(root, '.next', 'standalone');

if (!fs.existsSync(standaloneRoot)) {
  console.log('prepare-standalone: .next/standalone not found, skipping');
  process.exit(0);
}

copyDirIfExists(path.join(root, 'public'), path.join(standaloneRoot, 'public'));
copyDirIfExists(path.join(root, '.next', 'static'), path.join(standaloneRoot, '.next', 'static'));

console.log('prepare-standalone: copied public and .next/static into standalone output');
