#!/usr/bin/env node
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyBuiltDocs } from './lib/verify-built-docs.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(process.argv[2] ?? resolve(root, 'out'));

try {
  verifyBuiltDocs(outDir);
  console.log('built docs: MDX components rendered');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`built docs: ${message}`);
  process.exit(1);
}
