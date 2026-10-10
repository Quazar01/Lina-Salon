import { describe, expect, it } from 'vitest';
import { emphasize, localize } from '../src/lib/i18n';

describe('localize', () => {
  const field = { ar: 'قص الشعر', nl: 'Knippen', fr: '', en: '  ' };

  it('returns the requested translation', () => {
    expect(localize(field, 'nl')).toEqual({ text: 'Knippen' });
  });

  it('falls back to Arabic and marks it RTL when a translation is empty', () => {
    expect(localize(field, 'fr')).toEqual({ text: 'قص الشعر', lang: 'ar', dir: 'rtl' });
    expect(localize(field, 'en')).toEqual({ text: 'قص الشعر', lang: 'ar', dir: 'rtl' });
  });

  it('does not mark Arabic as a fallback on the Arabic page', () => {
    expect(localize(field, 'ar')).toEqual({ text: 'قص الشعر' });
  });

  it('passes plain strings through and tolerates missing fields', () => {
    expect(localize('Lina', 'fr')).toEqual({ text: 'Lina' });
    expect(localize(undefined, 'fr')).toEqual({ text: '' });
  });
});

describe('emphasize', () => {
  it('turns *words* into <em> and escapes everything else', () => {
    expect(emphasize('Je haar, in *goede handen*.')).toBe('Je haar, in <em>goede handen</em>.');
    expect(emphasize('<b>Tom & *Jerry*</b>')).toBe('&lt;b&gt;Tom &amp; <em>Jerry</em>&lt;/b&gt;');
  });

  it('leaves a lone asterisk alone', () => {
    expect(emphasize('5* service')).toBe('5* service');
  });
});

