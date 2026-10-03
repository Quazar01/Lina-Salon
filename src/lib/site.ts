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

export function statusStrings(t: UI) {
  return { ...t.status, days: t.days };
}
