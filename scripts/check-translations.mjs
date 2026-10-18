#!/usr/bin/env node
/**
 * Lists every text the salon owner wrote in Arabic whose Dutch, French or English
 * translation is
 *   - missing: still empty, or
 *   - outdated: the Arabic was edited (in a later commit) after that translation.
 * "Outdated" is worked out from the git history of src/content/, so translating in
 * the CMS or in code both count; nothing has to be "accepted" by hand.
 *
 * Used by the "translations" GitHub Action to keep an issue up to date, and runnable
 * locally: `npm run check:translations`.
 *
 *   --markdown <file>  also write the report as Markdown (for the issue body)
 *   --strict           exit with code 1 when something needs translating
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TARGETS = ['nl', 'fr', 'en'];
const CONTENT_DIR = fileURLToPath(new URL('../src/content/', import.meta.url));

const isLocalized = (v) => v && typeof v === 'object' && !Array.isArray(v) && typeof v.ar === 'string';
const blank = (s) => typeof s !== 'string' || s.trim() === '';

/** path -> localized object, for every {ar, nl, fr, en} field in a content tree. */
function localizedFields(node, path = '', out = new Map()) {
  if (isLocalized(node)) out.set(path, node);
  else if (Array.isArray(node)) node.forEach((v, i) => localizedFields(v, `${path}[${i}]`, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) localizedFields(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

export function findMissing(node) {
  const rows = [];
  for (const [path, f] of localizedFields(node)) {
    if (blank(f.ar)) continue;
    const missing = TARGETS.filter((l) => blank(f[l]));
    if (missing.length) rows.push({ path, ar: f.ar.trim(), missing });
  }
  return rows;
}

/**
 * `versions`: the same content file over time, oldest first (last = current).
 * For each field, remembers in which version the Arabic and each translation last
 * changed; a translation older than the latest Arabic edit is outdated.
 * Fields are matched by path, so reordering a list counts as everything changing at
 * once, which reads as "up to date" rather than flagging false alarms.
 */
export function findOutdated(versions) {
  const lastChange = new Map(); // path -> { ar: index, nl: index, ... }
  let previous = new Map();
  versions.forEach((tree, i) => {
    const fields = localizedFields(tree);
    for (const [path, f] of fields) {
      const before = previous.get(path);
      const stamps = lastChange.get(path) ?? {};
      for (const lang of ['ar', ...TARGETS]) {
        if (!before || (before[lang] ?? '') !== (f[lang] ?? '')) stamps[lang] = i;
      }
      lastChange.set(path, stamps);
    }
    previous = fields;
  });

  const rows = [];
  for (const [path, f] of previous) {
    if (blank(f.ar)) continue;
    const stamps = lastChange.get(path);
    const outdated = TARGETS.filter((l) => !blank(f[l]) && stamps[l] < stamps.ar);
    if (outdated.length) rows.push({ path, ar: f.ar.trim(), outdated });
  }
  return rows;
}

/** Every committed version of a content file (oldest first) plus the working copy if it differs. */
function history(file) {
  const rel = `src/content/${file}`;
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const versions = [];
  for (const sha of git('log', '--format=%H', '--reverse', '--', rel).split('\n').filter(Boolean)) {
    try {
      versions.push(JSON.parse(git('show', `${sha}:${rel}`)));
    } catch {
      // file deleted or invalid JSON in that commit: skip it
    }
  }
  const current = JSON.parse(readFileSync(join(CONTENT_DIR, file), 'utf8'));
  if (JSON.stringify(versions.at(-1)) !== JSON.stringify(current)) versions.push(current);
  return versions;
}

function report() {
  const rows = [];
  let historyAvailable = true;
  for (const file of readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json')).sort()) {
    const current = JSON.parse(readFileSync(join(CONTENT_DIR, file), 'utf8'));
    for (const r of findMissing(current)) rows.push({ file, path: r.path, ar: r.ar, problem: 'missing', langs: r.missing });
    let versions;
    try {
      versions = history(file);
    } catch {
      historyAvailable = false;
      continue;
    }
    for (const r of findOutdated(versions)) rows.push({ file, path: r.path, ar: r.ar, problem: 'outdated', langs: r.outdated });
  }
  return { rows, historyAvailable };
}

const LABEL = { missing: 'Missing', outdated: 'Outdated (Arabic changed since)' };

function toMarkdown(rows) {
  if (!rows.length) return 'All texts are translated and up to date.\n';
  const lines = [
    `${rows.length} text(s) need translating. Missing ones show the Arabic text on the site; outdated ones still show the old translation. Fix them via the CMS (the fields marked "يترجمها سامي") or directly in \`src/content/\`.`,
    '',
    '| File | Field | Problem | Languages | Arabic (current) |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map(
      (r) =>
        `| \`${r.file}\` | \`${r.path}\` | ${LABEL[r.problem]} | ${r.langs.join(', ')} | ${r.ar.replace(/\|/g, '\\|').replace(/\n+/g, ' ')} |`,
    ),
    '',
  ];
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const { rows, historyAvailable } = report();
  const mdIndex = args.indexOf('--markdown');
  if (mdIndex !== -1 && args[mdIndex + 1]) writeFileSync(args[mdIndex + 1], toMarkdown(rows));

  if (!historyAvailable) console.warn('Warning: no git history available, so outdated translations were not checked.');
  if (rows.length) {
    console.log(`${rows.length} text(s) need translating:`);
    for (const r of rows) console.log(`  [${r.problem}] ${r.file} → ${r.path}  [${r.langs.join(', ')}]  "${r.ar.slice(0, 60)}"`);
  } else {
    console.log('All texts are translated and up to date.');
  }
  if (args.includes('--strict') && rows.length) process.exit(1);
}
