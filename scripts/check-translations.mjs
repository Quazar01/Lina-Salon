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

/**
 * Reviews record "these translations were checked against this exact Arabic text and
 * are still fine". They only hide *outdated* languages, and only while the Arabic is
 * unchanged: a later edit makes the field show up again. Missing translations are
 * never hidden.
 */
export function applyReviews(rows, reviews) {
  return rows
    .map((r) => {
      if (r.problem !== 'outdated') return r;
      const ok = new Set(
        reviews.filter((v) => v.file === r.file && v.path === r.path && v.ar === r.ar).flatMap((v) => v.langs),
      );
      return { ...r, langs: r.langs.filter((l) => !ok.has(l)) };
    })
    .filter((r) => r.langs.length > 0);
}

/**
 * New reviews list: existing reviews whose Arabic is still current, plus the selected
 * outdated rows (selectors like "home.json:heroText"; none = all outdated rows).
 * `current` maps file -> path -> current Arabic text.
 */
export function markReviewed(rows, existing, current, selectors) {
  const key = (v) => `${v.file}:${v.path}`;
  const byKey = new Map();
  for (const v of existing) {
    if (current[v.file]?.[v.path]?.trim() !== v.ar) continue; // Arabic changed since: stale
    byKey.set(key(v), { ...v, langs: [...v.langs] });
  }
  for (const r of rows) {
    if (r.problem !== 'outdated' || (selectors.length && !selectors.includes(key(r)))) continue;
    const entry = byKey.get(key(r));
    const langs = new Set([...(entry && entry.ar === r.ar ? entry.langs : []), ...r.langs]);
    byKey.set(key(r), { file: r.file, path: r.path, ar: r.ar, langs: [...langs].sort() });
  }
  return [...byKey.values()].sort((a, b) => key(a).localeCompare(key(b)));
}

const REVIEWS_FILE = fileURLToPath(new URL('../translations-reviewed.json', import.meta.url));

function readReviews() {
  try {
    return JSON.parse(readFileSync(REVIEWS_FILE, 'utf8'));
  } catch {
    return [];
  }
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
  const currentAr = {}; // file -> path -> Arabic, for pruning reviews
  let historyAvailable = true;
  for (const file of readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json')).sort()) {
    const current = JSON.parse(readFileSync(join(CONTENT_DIR, file), 'utf8'));
    currentAr[file] = Object.fromEntries([...localizedFields(current)].map(([p, f]) => [p, f.ar]));
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
  return { rows, currentAr, historyAvailable };
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
  const { rows: raw, currentAr, historyAvailable } = report();
  if (!historyAvailable) console.warn('Warning: no git history available, so outdated translations were not checked.');

  if (args.includes('--mark-reviewed')) {
    // e.g. --mark-reviewed home.json:heroText   (no names = every outdated text)
    const selectors = args.filter((a) => a !== '--mark-reviewed' && !a.startsWith('--'));
    const before = readReviews();
    const after = markReviewed(raw, before, currentAr, selectors);
    writeFileSync(REVIEWS_FILE, JSON.stringify(after, null, 2) + '\n');
    const shown = applyReviews(raw, before).filter((r) => r.problem === 'outdated');
    const marked = shown.filter((r) => !selectors.length || selectors.includes(`${r.file}:${r.path}`));
    if (!marked.length) console.log('Nothing outdated to mark as reviewed.');
    for (const r of marked) console.log(`  reviewed: ${r.file} → ${r.path}  [${r.langs.join(', ')}]`);
    console.log('Saved translations-reviewed.json. Commit it to clear these from the issue.\n');
  }

  const rows = applyReviews(raw, readReviews());
  const mdIndex = args.indexOf('--markdown');
  if (mdIndex !== -1 && args[mdIndex + 1]) writeFileSync(args[mdIndex + 1], toMarkdown(rows));

  if (rows.length) {
    console.log(`${rows.length} text(s) need translating:`);
    for (const r of rows) console.log(`  [${r.problem}] ${r.file} → ${r.path}  [${r.langs.join(', ')}]  "${r.ar.slice(0, 60)}"`);
  } else {
    console.log('All texts are translated and up to date.');
  }
  if (args.includes('--strict') && rows.length) process.exit(1);
}
