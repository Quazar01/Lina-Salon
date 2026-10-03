/**
 * Two designs share the same content and CMS:
 *  - "soft": rose & ivory (default)
 *  - "glam": derived from the salon's signage: wine, fuchsia glow, metallic gold, script logo
 * Pick one with the PUBLIC_THEME environment variable (e.g. on Netlify), or locally with
 * `npm run dev:glam` / `npm run build:glam`.
 */
export type Theme = 'soft' | 'glam';

export const THEME: Theme = import.meta.env.PUBLIC_THEME === 'glam' ? 'glam' : 'soft';

export const THEME_COLOR: Record<Theme, string> = {
  soft: '#fdf8f5',
  glam: '#6b1442',
};
