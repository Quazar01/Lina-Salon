import settings from '../content/settings.json';
import type { DayHours } from './hours';
import type { UI } from './i18n';

export { settings };

export const hours = settings.hours as DayHours[];

export const telHref = `tel:${settings.phone.replace(/[^\d+]/g, '')}`;

export function whatsappHref(message: string) {
  const number = settings.whatsapp.replace(/\D/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Opens the native Maps app on phones, Google Maps in the browser elsewhere. */
export const routeHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(settings.mapsQuery)}`;

export const mapEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(settings.mapsQuery)}&output=embed`;

export const socials = (
  [
    ['instagram', 'Instagram', 'ph:instagram-logo'],
    ['facebook', 'Facebook', 'ph:facebook-logo'],
    ['tiktok', 'TikTok', 'ph:tiktok-logo'],
  ] as const
)
  .map(([key, label, icon]) => ({ href: settings[key]?.trim(), label, icon }))
  .filter((s) => s.href);

/** "https://www.instagram.com/lina.salon/" -> "lina.salon"; also accepts "@lina.salon" or a bare handle. */
export function handleFrom(url: string | undefined, host: 'instagram.com' | 'tiktok.com'): string | undefined {
  const raw = url?.trim();
  if (!raw) return undefined;
  let candidate: string | undefined;
  if (!raw.includes('/')) {
    candidate = raw.replace(/^@/, '');
  } else {
    try {
      const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      if (!u.hostname.endsWith(host)) return undefined;
      candidate = u.pathname.split('/').filter(Boolean)[0]?.replace(/^@/, '');
    } catch {
      return undefined;
    }
  }
  // Only real account characters: the handle ends up inside embed markup.
  return candidate && /^[A-Za-z0-9._]{1,30}$/.test(candidate) ? candidate : undefined;
}

export const instagramHandle = handleFrom(settings.instagram, 'instagram.com');
export const tiktokHandle = handleFrom(settings.tiktok, 'tiktok.com');

/** Instagram post links the owner chose to feature (CMS), keeping only real post/reel URLs. */
export function instagramPostUrl(url: string | undefined): string | undefined {
  // Rebuilt from the post id, so nothing from the CMS text reaches the markup verbatim.
  const m = url?.trim().match(/instagram\.com\/(?:[A-Za-z0-9._]+\/)?(p|reel)\/([A-Za-z0-9_-]+)/);
  return m ? `https://www.instagram.com/${m[1]}/${m[2]}/` : undefined;
}

export const instagramPosts = ((settings as { instagramPosts?: string[] }).instagramPosts ?? [])
  .map(instagramPostUrl)
  .filter((u): u is string => !!u);

export const showReviews = (settings as { showReviews?: boolean }).showReviews === true;

export function statusStrings(t: UI) {
  return { ...t.status, days: t.days };
}
