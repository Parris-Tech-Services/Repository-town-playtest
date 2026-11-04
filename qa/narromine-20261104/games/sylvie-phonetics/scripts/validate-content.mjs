#!/usr/bin/env node
/**
 * Validates content/bundle.json shape for Sylvie Phonics.
 * Usage: node scripts/validate-content.mjs [path/to/bundle.json]
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const file = resolve(process.argv[2] || 'content/bundle.json');
if (!existsSync(file)) {
  console.error('Missing file:', file);
  process.exit(1);
}
const raw = readFileSync(file, 'utf8');
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error('Invalid JSON:', e.message);
  process.exit(2);
}

if (!data || typeof data !== 'object' || !Array.isArray(data.phonicWords)) {
  console.error('Root must include phonicWords array');
  process.exit(3);
}

let ok = true;
for (let i = 0; i < data.phonicWords.length; i++) {
  const w = data.phonicWords[i];
  if (!w || typeof w.word !== 'string') {
    console.error(`phonicWords[${i}]: missing word string`);
    ok = false;
  }
  if (!Array.isArray(w.letters) || !w.letters.length) {
    console.error(`phonicWords[${i}]: letters[] required`);
    ok = false;
  }
}

if (!ok) process.exit(4);
console.log(`OK (${data.phonicWords.length} rows)`);
