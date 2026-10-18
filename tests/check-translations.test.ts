import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script without types
import { applyReviews, findMissing, findOutdated, markReviewed } from '../scripts/check-translations.mjs';

describe('findMissing', () => {
  it('reports empty translations of filled-in Arabic text, with a readable path', () => {
    const data = {
      categories: [
        {
          name: { ar: 'القص', nl: 'Knippen', fr: 'Coupes', en: 'Cuts' },
          items: [{ name: { ar: 'خدمة جديدة', nl: '', fr: '  ' }, price: 20 }],
        },
      ],
    };
    expect(findMissing(data)).toEqual([
      { path: 'categories[0].items[0].name', ar: 'خدمة جديدة', missing: ['nl', 'fr', 'en'] },
    ]);
  });

  it('ignores fields whose Arabic is empty too (e.g. an unused description)', () => {
    expect(findMissing({ description: { ar: '', nl: '', fr: '', en: '' } })).toEqual([]);
  });

  it('ignores fully translated fields and non-localized values', () => {
    expect(findMissing({ phone: '+32', t: { ar: 'أ', nl: 'a', fr: 'a', en: 'a' } })).toEqual([]);
  });
});

describe('findOutdated', () => {
  const v = (ar: string, nl: string, fr: string, en: string) => ({ about: { ar, nl, fr, en } });

  it('flags every translation older than the latest Arabic edit', () => {
    const history = [v('أ', 'a', 'a', 'a'), v('ب', 'a', 'a', 'a')];
    expect(findOutdated(history)).toEqual([{ path: 'about', ar: 'ب', outdated: ['nl', 'fr', 'en'] }]);
  });

  it('is happy once the translations are updated after the Arabic', () => {
    const history = [v('أ', 'a', 'a', 'a'), v('ب', 'a', 'a', 'a'), v('ب', 'b', 'b', 'b')];
    expect(findOutdated(history)).toEqual([]);
  });

  it('tracks each language separately', () => {
    const history = [v('أ', 'a', 'a', 'a'), v('ب', 'a', 'a', 'a'), v('ب', 'b', 'a', 'a')];
    expect(findOutdated(history)).toEqual([{ path: 'about', ar: 'ب', outdated: ['fr', 'en'] }]);
  });

  it('counts Arabic and translations changed in the same version as up to date', () => {
    expect(findOutdated([v('أ', 'a', 'a', 'a'), v('ب', 'b', 'b', 'b')])).toEqual([]);
  });

  it('does not flag fields that first appear later, or empty translations (those are "missing")', () => {
    const history = [{}, { about: { ar: 'أ', nl: 'a', fr: '', en: '' } }, { about: { ar: 'ب', nl: 'a', fr: '', en: '' } }];
    expect(findOutdated(history)).toEqual([{ path: 'about', ar: 'ب', outdated: ['nl'] }]);
    expect(findOutdated([{}, v('أ', 'a', 'a', 'a')])).toEqual([]);
  });
});

describe('reviews ("checked, still fine")', () => {
  const row = { file: 'home.json', path: 'heroText', ar: 'نص جديد', problem: 'outdated', langs: ['nl', 'fr', 'en'] };

  it('hides outdated languages reviewed for exactly this Arabic text', () => {
    const reviews = [{ file: 'home.json', path: 'heroText', ar: 'نص جديد', langs: ['nl', 'fr'] }];
    expect(applyReviews([row], reviews)).toEqual([{ ...row, langs: ['en'] }]);
    expect(applyReviews([row], [{ ...reviews[0], langs: ['nl', 'fr', 'en'] }])).toEqual([]);
  });

  it('ignores a review once the Arabic has changed again', () => {
    const reviews = [{ file: 'home.json', path: 'heroText', ar: 'نص قديم', langs: ['nl', 'fr', 'en'] }];
    expect(applyReviews([row], reviews)).toEqual([row]);
  });

  it('never hides missing translations', () => {
    const missing = { ...row, problem: 'missing', langs: ['nl'] };
    expect(applyReviews([missing], [{ file: 'home.json', path: 'heroText', ar: 'نص جديد', langs: ['nl'] }])).toEqual([missing]);
  });

  it('marks the selected outdated rows, merges with earlier reviews and drops stale ones', () => {
    const current = { 'home.json': { heroText: 'نص جديد', aboutText: 'عن' } };
    const existing = [
      { file: 'home.json', path: 'heroText', ar: 'نص جديد', langs: ['nl'] },
      { file: 'home.json', path: 'aboutText', ar: 'نص قديم', langs: ['fr'] }, // Arabic changed since: stale
    ];
    const other = { ...row, path: 'aboutText', ar: 'عن', langs: ['en'] };
    expect(markReviewed([row, other], existing, current, ['home.json:heroText'])).toEqual([
      { file: 'home.json', path: 'heroText', ar: 'نص جديد', langs: ['en', 'fr', 'nl'] },
    ]);
    expect(markReviewed([row, other], [], current, [])).toEqual([
      { file: 'home.json', path: 'aboutText', ar: 'عن', langs: ['en'] },
      { file: 'home.json', path: 'heroText', ar: 'نص جديد', langs: ['en', 'fr', 'nl'] },
    ]);
  });
});
