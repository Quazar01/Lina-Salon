import type { ImageMetadata } from 'astro';

// The CMS uploads into src/assets/uploads and stores paths like
// "/src/assets/uploads/photo.jpg". Resolving them through import.meta.glob lets
// Astro optimise every upload (resize, WebP/AVIF, srcset) at build time.
const uploads = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/uploads/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true },
);

export function resolveImage(path: string | undefined): ImageMetadata | undefined {
  if (!path) return undefined;
  const key = path.startsWith('/') ? path : `/${path}`;
  const found = uploads[key]?.default;
  if (!found) console.warn(`[images] No uploaded image found for "${path}"`);
  return found;
}
