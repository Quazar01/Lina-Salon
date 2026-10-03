import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script without types
import { findMissing } from '../scripts/check-translations.mjs';

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
