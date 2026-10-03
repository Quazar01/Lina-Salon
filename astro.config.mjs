// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Replace with the real domain once it's bought.
  site: 'https://linasalon.be',
  trailingSlash: 'always',
  // One small stylesheet: inline it so it never blocks the first paint on slow mobile networks.
  build: { inlineStylesheets: 'always' },
  integrations: [
    icon({ include: { ph: ['*'] } }),
    sitemap({
      filter: (page) => !page.includes('/admin/'),
      i18n: {
        defaultLocale: 'nl',
        locales: { nl: 'nl-BE', fr: 'fr-BE', ar: 'ar', en: 'en' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
