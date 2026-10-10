/**
 * Two designs share the same content and CMS:
 *  - "glam": derived from the salon's signage: berry, fuchsia glow, metallic gold, script logo (default, chosen by the owner)
 *  - "soft": rose & ivory (kept as an alternative)
 * Switch with the PUBLIC_THEME environment variable (e.g. on Netlify), or locally with
 * `npm run dev:soft` / `npm run build:soft`.
 */
export type Theme = 'soft' | 'glam';

export const THEME: Theme = import.meta.env.PUBLIC_THEME === 'soft' ? 'soft' : 'glam';

export const THEME_COLOR: Record<Theme, string> = {
  soft: '#fdf8f5',
  glam: '#6b1442',
};
