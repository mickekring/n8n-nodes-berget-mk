#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const NODES_SRC = path.join(__dirname, '..', 'nodes');
const NODES_DIST = path.join(__dirname, '..', 'dist', 'nodes');

for (const nodeDir of fs.readdirSync(NODES_SRC)) {
  const srcDir = path.join(NODES_SRC, nodeDir);
  if (!fs.statSync(srcDir).isDirectory()) continue;

  for (const file of fs.readdirSync(srcDir)) {
    if (!file.endsWith('.svg') && !file.endsWith('.png')) continue;
    const distDir = path.join(NODES_DIST, nodeDir);
    fs.mkdirSync(distDir, { recursive: true });
    fs.copyFileSync(path.join(srcDir, file), path.join(distDir, file));
    console.log(`copied ${nodeDir}/${file}`);
  }
}
