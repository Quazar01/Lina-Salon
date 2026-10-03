#!/usr/bin/env node
/**
 * Lists every text the salon owner wrote in Arabic that still has no Dutch,
 * French or English translation. Used by the "translations" GitHub Action to
 * keep an issue up to date, and runnable locally: `npm run check:translations`.
 *
 *   --markdown <file>  also write the report as Markdown (for the issue body)
 *   --strict           exit with code 1 when something is missing
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TARGETS = ['nl', 'fr', 'en'];
const CONTENT_DIR = fileURLToPath(new URL('../src/content/', import.meta.url));

const isLocalized = (v) => v && typeof v === 'object' && !Array.isArray(v) && typeof v.ar === 'string';
const blank = (s) => typeof s !== 'string' || s.trim() === '';

export function findMissing(node, path = '') {
  if (isLocalized(node)) {
    if (blank(node.ar)) return [];
    const missing = TARGETS.filter((l) => blank(node[l]));
    return missing.length ? [{ path, ar: node.ar.trim(), missing }] : [];
  }
  if (Array.isArray(node)) return node.flatMap((v, i) => findMissing(v, `${path}[${i}]`));
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => findMissing(v, path ? `${path}.${k}` : k));
  }
  return [];
}

function report() {
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json')).sort();
  return files.flatMap((file) =>
    findMissing(JSON.parse(readFileSync(join(CONTENT_DIR, file), 'utf8'))).map((m) => ({ file, ...m })),
  );
}

function toMarkdown(rows) {
  if (!rows.length) return 'All texts are translated.\n';
  const lines = [
    `${rows.length} text(s) written in Arabic still need a translation. Fill them in via the CMS (the fields marked "يترجمها سامي") or directly in \`src/content/\`. Until then the site shows the Arabic text.`,
    '',
    '| File | Field | Arabic | Missing |',
    '| --- | --- | --- | --- |',
    ...rows.map((r) => `| \`${r.file}\` | \`${r.path}\` | ${r.ar.replace(/\|/g, '\\|').replace(/\n+/g, ' ')} | ${r.missing.join(', ')} |`),
    '',
  ];
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const rows = report();
  const md = toMarkdown(rows);
  const mdIndex = args.indexOf('--markdown');
  if (mdIndex !== -1 && args[mdIndex + 1]) writeFileSync(args[mdIndex + 1], md);

  if (rows.length) {
    console.log(`${rows.length} missing translation(s):`);
    for (const r of rows) console.log(`  ${r.file} → ${r.path}  [${r.missing.join(', ')}]  "${r.ar.slice(0, 60)}"`);
  } else {
    console.log('All texts are translated.');
  }
  if (args.includes('--strict') && rows.length) process.exit(1);
}
