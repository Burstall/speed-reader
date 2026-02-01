#!/usr/bin/env node
// Build the Chrome extension ZIP for Web Store upload.
// Includes only the files needed by Chrome — excludes screenshots,
// promo images, dev tools, and docs.
//
// Usage: node extension/package.js
// Works on Windows (PowerShell), macOS, and Linux — no npm dependencies.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const extDir = path.resolve(__dirname);
const outPath = path.resolve(extDir, '..', 'speed-reader-extension.zip');

// Remove old zip if present
if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

const files = ['manifest.json', 'popup.html', 'popup.js', 'icons'];

if (process.platform === 'win32') {
  // Windows: use PowerShell Compress-Archive
  const paths = files.map(f => `'${path.join(extDir, f)}'`).join(', ');
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path ${paths} -DestinationPath '${outPath}'"`,
    { stdio: 'inherit' }
  );
} else {
  // macOS / Linux: use zip
  execSync(
    `zip -r '${outPath}' ${files.join(' ')}`,
    { cwd: extDir, stdio: 'inherit' }
  );
}

const size = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`\nCreated ${outPath} (${size} KB)`);
