import nl from '../i18n/nl.json';
import fr from '../i18n/fr.json';
import ar from '../i18n/ar.json';
import en from '../i18n/en.json';

export const LOCALES = ['nl', 'fr', 'ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'nl';

/** Arabic is what the salon owner writes; it's the source and the fallback. */
export const SOURCE_LOCALE = 'ar' as const;

export const LOCALE_META: Record<Locale, { label: string; short: string; name: string; dir: 'ltr' | 'rtl'; bcp47: string }> = {
  nl: { label: 'Nederlands', short: 'NL', name: 'Nederlands', dir: 'ltr', bcp47: 'nl-BE' },
  fr: { label: 'Français', short: 'FR', name: 'Français', dir: 'ltr', bcp47: 'fr-BE' },
  ar: { label: 'العربية', short: 'ع', name: 'العربية', dir: 'rtl', bcp47: 'ar' },
  en: { label: 'English', short: 'EN', name: 'English', dir: 'ltr', bcp47: 'en' },
};

export type UI = typeof nl;
const UI_STRINGS: Record<Locale, UI> = { nl, fr, ar, en };

export function ui(locale: Locale): UI {
  return UI_STRINGS[locale];
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** A field the CMS stores in all four languages; only Arabic is required. */
export type Localized = { ar: string } & Partial<Record<Exclude<Locale, 'ar'>, string>>;

export interface LocalizedText {
  text: string;
  /** Set when the text is shown in a different language than the page (fallback). */
  lang?: Locale;
  dir?: 'ltr' | 'rtl';
}

/**
 * Pick the text for `locale`, falling back to Arabic when the translation is
 * still empty. When it falls back, `lang`/`dir` are set so the caller can mark
 * the element up correctly (Arabic text inside a Dutch page must still be RTL).
 */
export function localize(field: Localized | string | undefined, locale: Locale): LocalizedText {
  if (field == null) return { text: '' };
  if (typeof field === 'string') return { text: field };
  const wanted = field[locale]?.trim();
  if (wanted) return { text: wanted };
  const fallback = field[SOURCE_LOCALE]?.trim() ?? '';
  if (!fallback || locale === SOURCE_LOCALE) return { text: fallback };
  return { text: fallback, lang: SOURCE_LOCALE, dir: 'rtl' };
}

/** Plain-string variant for attributes (alt text, meta tags). */
export function t(field: Localized | string | undefined, locale: Locale): string {
  return localize(field, locale).text;
}

/**
 * HTML for a heading where *words between asterisks* become an accent (<em>).
 * Everything else is escaped, so CMS text can never inject markup.
 */
export function emphasize(text: string): string {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, (c) => entities[c]).replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
}

export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_META[locale].bcp47, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    // Western digits everywhere: prices must match what's said on the phone.
    numberingSystem: 'latn',
  }).format(amount);
}
