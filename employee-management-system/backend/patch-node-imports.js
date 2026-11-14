/**
 * patch-node-imports.js
 * Removes "node:" prefix from all require() calls in node_modules
 * so that Jest 25 (which doesn't understand the node: protocol) can run tests.
 * Run once: node patch-node-imports.js
 */
const fs = require('fs');
const path = require('path');

const targets = [
  'formidable/dist',
  'formidable/src',
  'superagent/lib',
  'superagent/src',
  'express-rate-limit/dist',
  'express-rate-limit/src',
  'helmet/dist',
  'helmet/src',
  'bcryptjs',
  'morgan',
];

let totalPatched = 0;

function patchDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      patchDir(full);
    } else if (full.endsWith('.js') || full.endsWith('.cjs') || full.endsWith('.mjs')) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes("require('node:") || content.includes('require("node:')) {
        content = content.replace(/require\('node:/g, "require('");
        content = content.replace(/require\("node:/g, 'require("');
        fs.writeFileSync(full, content, 'utf8');
        console.log(`  Patched: ${full}`);
        totalPatched++;
      }
    }
  }
}

const nmDir = path.join(__dirname, 'node_modules');
for (const t of targets) {
  console.log(`Scanning: ${t}`);
  patchDir(path.join(nmDir, t));
}

console.log(`\nDone. ${totalPatched} files patched.`);
