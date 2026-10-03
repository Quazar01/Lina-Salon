# Lina Salon landing page: design & plan

## Context
Your mother runs **Lina Salon**, a women-only hair salon in Antwerpen. She needs a one-page site that lets visitors see services and prices, find the salon, and contact it by phone or WhatsApp. The site comes in **Dutch, French, Arabic (right-to-left) and English**. She will keep it up to date herself, and **she only reads Arabic**, so the editing screens must be fully in Arabic. You (Sami) translate her Arabic changes into the other languages by hand. The repo is empty apart from `First file.txt`.

## Decisions (from Q&A)
- Main goals: Call/WhatsApp, find the salon, services & prices. **No online booking**: phone and WhatsApp only.
- Sections: Services & prices, Gallery, About Lina, Reviews (hand-picked quotes plus a "See all on Google" link).
- Extras: social links (Instagram, Facebook, TikTok), Google Map, floating WhatsApp button, live "Open now / Closed" badge.
- Default language: detect the browser's language, fall back to Dutch.
- Style: **warm & welcoming**.
- Content: placeholders for now. I draft all 4 languages; you review them.
- Tech: static site on free hosting, with a free Git-based CMS whose editor is in Arabic.
- Domain: none yet; buy one (e.g. `linasalon.be`).

## Approach
**Astro (static) + Decap CMS + Netlify (free tier) + GitHub.**
- Astro outputs plain HTML with almost no JavaScript, so pages load fast, and it has built-in i18n routing.
- Decap CMS adds an `/admin` editor page. It saves changes as commits to GitHub, and Netlify rebuilds the site automatically. The editor's labels, hints and collection names are all written in Arabic in `config.yml`, and the interface language is set to `ar` if Decap ships it. I'll check that during setup; otherwise the custom Arabic labels still cover everything she sees.
- Login: your mother gets her own GitHub account, added as a collaborator, and signs in through Netlify's GitHub OAuth provider. Git Gateway / Netlify Identity is deprecated, so we avoid it.

## Site structure
- Routes: `/nl/`, `/fr/`, `/ar/`, `/en/`. The root `/` runs a tiny script that redirects based on `navigator.languages` (falling back to `/nl/`) and remembers a manual choice in localStorage. It has a `<noscript>` link list as a backup.
- Each page sets `<html lang>` and `dir` (`rtl` for Arabic). Layout uses CSS logical properties (`margin-inline-start`, etc.) so RTL works without separate styles.
- SEO: `hreflang` alternates, per-language title and description, `HairSalon` JSON-LD (address, hours, phone), sitemap.

**One-page sections, in order:**
1. Header: logo/name, anchor nav, language switcher (NL · FR · ع · EN), call button.
2. Hero: warm photo, tagline, a clear **"Women only / Alleen voor vrouwen…"** note, Call + WhatsApp buttons, Open/Closed badge.
3. Services & prices: grouped by category (cuts, colour, styling, treatments, bridal…), each with price and optional duration.
4. About Lina: short story and photo.
5. Gallery: responsive grid with a lightbox; images optimized by Astro.
6. Reviews: 3–6 quotes with star ratings and a "See all reviews on Google" button.
7. Visit us: address, opening-hours table, **click-to-load** Google Map. The map loads only when clicked, so no cookie banner is needed under GDPR.
8. Footer: socials, phone, address, women-only note.
9. Floating WhatsApp button on desktop, sticky bottom action bar on phones. Both use a `wa.me` link with a pre-filled message in the current language.

**Open now badge:** client-side JavaScript compares the current time in `Europe/Brussels` (via `Intl`) against the hours in settings. It shows "Open now · closes 18:00", "Closed · opens tomorrow 09:30", and so on.

## Design process: required skills
Before writing any UI, load the project skills **`emil-design-eng`** (`.claude/skills/emil-design-eng/SKILL.md`) and **`design-taste-frontend-v1`** (the "taste-skill v1", `.claude/skills/design-taste-frontend-v1/SKILL.md`). Apply them to every component, and run both again as a review pass at the end; Emil's review uses its Before/After/Why table format. I'll also use the project's **`mobile-native`** skill as a mobile checklist (see the Mobile section below).

**How the skills fit this project.** Taste v1 defaults to React/Next and Framer Motion only when no other stack is chosen. You chose a static site, so we keep Astro and adopt the rest of its conventions:
- **Tailwind CSS v4** via `@tailwindcss/vite` for styling. No `tailwindcss` PostCSS plugin.
- **Phosphor icons** as inline SVGs via `astro-icon` with `@iconify-json/ph`. One stroke weight everywhere. **No emojis** anywhere, including WhatsApp pre-fill text and alt text.
- **Dials** (the skill allows adjusting them to fit the brief): DESIGN_VARIANCE **6** (offset and asymmetric on desktop, strict single column on phones), MOTION_INTENSITY **4** (fluid CSS only, no JS animation library, which keeps phones fast), VISUAL_DENSITY **3** (airy).
- **Layout:** no centred hero. The hero is split, with text aligned to the start edge and the photo on the other side (start edge means left in NL/FR/EN, right in Arabic). No "3 equal cards" rows. Services become a clean priced list grouped by category with `divide-y`. The gallery is an asymmetric/masonry grid on desktop and a swipeable horizontal strip on phones. Cards are used only where elevation means something, with shadows tinted to the warm background.
- **Colour:** warm neutral base (cream/sand, one warm grey family, off-black text, never `#000`) plus **one** desaturated accent, terracotta or deep rose. No purple, neon glows or gradient text.
- **Type:** a salon site is editorial, so serif headings are allowed under taste rules. Headings use *Fraunces* and body text *Outfit* (taste bans Inter). Arabic uses *Tajawal* or *IBM Plex Sans Arabic*, all self-hosted via Fontsource. **Letter-spacing/tracking stays at 0 for Arabic**, because negative tracking breaks Arabic letter joining. Tight tracking applies only on `:lang(nl|fr|en)`. Headings don't shout; hierarchy comes from weight and colour.
- **Placeholder content:** realistic Antwerp details (believable phone formats, street names, review names), no "Jane Doe" or "Lorem". Placeholder photos are local files in `src/assets/placeholder/`, not hotlinked.
- **Emil polish rules:**
  - Buttons get `:active { transform: scale(0.97) }`.
  - Transitions name exact properties (never `transition: all`) and use custom ease-out curves, around 150–250ms.
  - Nothing animates in from `scale(0)`; start from 0.95 plus opacity instead.
  - Hover effects only inside `@media (hover: hover)`.
  - Sections reveal with a subtle opacity/translate stagger via a tiny IntersectionObserver plus CSS.
  - Everything respects `prefers-reduced-motion`.
  - Visible `:focus-visible` rings.
  - The open/closed dot gets a gentle "breathing" pulse (the one perpetual micro-animation).
  - The lightbox opens from the tapped image.

## Mobile-first (most visitors will be on phones)
- Design and build at **375px first**, then scale up with `sm/md/lg`. Every asymmetric desktop layout collapses to a single column (`px-4`) below `md`. No horizontal page scroll at any width from 320px up.
- **Sticky bottom action bar on phones:** Call · WhatsApp · Route, each a thumb-sized button, so the main goals are always one tap away. This replaces the floating WhatsApp button below `md`; the floating button remains on desktop.
- Compact header on phones: name/logo, language switcher (NL · FR · ع · EN as a small segmented control), and a menu button that opens a full-height sheet with the anchor links.
- Tap targets of at least 44×44px; minimum body text 16px; `min-h-[100dvh]` instead of `h-screen`; `env(safe-area-inset-*)` padding for the notch and home bar; `viewport-fit=cover`; `theme-color` meta matching the background; `-webkit-tap-highlight-color: transparent` with our own `:active` states instead.
- Opening hours stack as a two-column list with today highlighted. The map placeholder is full-width with a "Route" button that opens the native Maps app (`geo:`/Google Maps URL).
- Images use responsive `srcset` via Astro `<Image>`, lazy-loaded below the fold. The hero image gets `fetchpriority="high"`. Target is Lighthouse mobile at 90 or above for performance and accessibility.
- Test Arabic RTL at phone width specifically, since that's where layouts break most often.

## Content model (`src/content/`, edited via the CMS)
| File | Contents | Per-language? |
|---|---|---|
| `settings.json` | phone, WhatsApp number, address, map link, Google reviews URL, social URLs, opening hours (per weekday: open/close/closed) | No (one value for all languages) |
| `services.json` | categories → services: price, duration, name/description per locale | Text yes, price no |
| `home.json` | hero tagline, women-only note, About text | Yes |
| `gallery.json` | images + alt text | alt yes |
| `reviews.json` | author, rating, quote (kept in its original language) | No |

UI strings (nav labels, button text, day names) live in `src/i18n/{nl,fr,ar,en}.json` and are managed in code by you.

**Decap i18n:** `structure: single_file` with locales `[ar, nl, fr, en]` and `default_locale: ar`, so your mother edits Arabic and can ignore the other tabs. **Missing translations:** if an NL, FR or EN field is empty, the page shows the Arabic text for that field instead. A GitHub Action runs on content commits: `scripts/check-translations.mjs` lists the empty fields, and the Action opens or updates a "Translations needed" issue so you get notified.

## Files to create (main ones)
- `astro.config.mjs` (i18n config, sitemap), `package.json`
- `src/layouts/Base.astro`, `src/pages/[lang]/index.astro`, `src/pages/index.astro` (language redirect)
- `src/components/`: `Header`, `LangSwitcher`, `Hero`, `OpenBadge`, `Services`, `About`, `Gallery`, `Reviews`, `Visit` (hours + map), `Footer`, `WhatsAppFab`, `MobileActionBar`, `MobileMenu`, `Lightbox`
- `src/styles/global.css` (Tailwind v4 `@theme` tokens: colours, fonts, easing curves, radii)
- `src/lib/i18n.ts` (locale list, `t()`, text-with-fallback helper), `src/lib/hours.ts` (open/closed logic, unit-tested)
- `src/content/*.json`, `src/i18n/*.json`, placeholder images in `src/assets/` / `public/uploads/`
- `public/admin/index.html` + `public/admin/config.yml` (Arabic labels, RTL-friendly preview)
- `.github/workflows/translations.yml`, `scripts/check-translations.mjs`
- `README.md`: how to run, how to translate, Netlify + GitHub OAuth setup, buying the domain and pointing its DNS at Netlify, adding your mother as an editor
- `docs/superpowers/specs/2026-10-03-lina-salon-landing-design.md`: this design, committed
- Delete `First file.txt`

## Verification
1. `npm run build` passes, and the `vitest` tests for `hours.ts` pass (open/closed edge cases, closed days, midnight).
2. `npm run preview` in the browser pane: check all 4 languages, the language switcher, root-redirect detection, Arabic RTL layout, phone width (375px) without horizontal scroll, `tel:` and `wa.me` links, map click-to-load, and the open badge.
3. Run the CMS locally with `npx decap-server` (`local_backend: true`): open `/admin`, confirm the labels are Arabic, edit a price and an Arabic service name, check the JSON updates and the page re-renders with the Arabic fallback.
4. Run `scripts/check-translations.mjs` and confirm it reports the new untranslated field.
5. Run Lighthouse **mobile** audits on `/nl/` and `/ar/`: performance and accessibility at 90 or above.
6. Run the design review pass: go through `emil-design-eng` (Before/After/Why table) and the `design-taste-frontend-v1` pre-flight checklist, then fix what they find.
7. Mobile check in the browser pane at 320, 375 and 414px, in both LTR and RTL: bottom action bar, menu sheet, gallery swipe, lightbox, safe-area padding, no horizontal scroll.

## Changes made during implementation
- **Translatable fields are `{ar, nl, fr, en}` objects instead of Decap's `i18n` mode.** With Decap i18n, each language keeps its own copy of a list, so a service added in Arabic would not exist in the Dutch list at all. Objects keep lists in sync, store prices once, and let the fallback to Arabic work field by field.
- **Decap has no Arabic UI locale**, so `public/admin/ar-locale.js` registers one (`CMS.registerLocale('ar', …)`) for every screen the owner sees.
- **Astro's built-in i18n routing is not used.** A `[lang]` dynamic route plus a small redirect script on `/` keeps routing explicit and avoids Astro's own `/` redirect fighting the browser-language detection.
- **The hero uses `100svh`, not `100dvh`** (per `mobile-native`), so the layout doesn't shift when the browser bar collapses.
- **Fonts:** the Fraunces `soft` subset (wght + SOFT) instead of the full font, and no italic: about 200KB less. The CSS is inlined.
- **Visible button text is the accessible name.** Longer `aria-label`s were removed (Lighthouse `label-content-name-mismatch`).
- **Verification results:** 16 unit tests pass. Lighthouse mobile: NL 98 / AR 95 performance, and 100 accessibility, best practices and SEO on both. No horizontal scroll at 320/375px in any language. A CMS edit was round-tripped to JSON locally.

## Revision: feminine & warm (after first review)
Feedback: "make the design feminine and warm, all the customers are women."
- **Palette:** terracotta/sand became **rose & ivory**: ivory `#fdf8f5`, blush `#f9ebe6`, petal `#f1dcd5`, dusty-rose accent `#a94d64` (still exactly one accent, warm rather than purple), plum-brown text `#3b2a2d`. Every text pairing was checked for WCAG AA.
- **Type:** lighter, fully "soft" Fraunces headings with *accent words* in rose italic (written `*like this*` in the CMS); Fraunces wght-italic adds 46KB. Arabic headings use **El Messiri**, preloaded on the Arabic page to keep CLS at 0.
- **Shapes and ornament:** arch-framed hero and "about" photos with an offset outline, a static blush bloom behind the hero, rounded panels for tinted sections, a rounded footer top, a sparkle ornament on eyebrows, and a large rose quotation mark on the featured review.
- **Copy:** the hero eyebrow now leads with "for women" (e.g. "Kapsalon voor vrouwen").
- **Re-verified:** 18 unit tests pass. Lighthouse mobile: NL 97 / AR 92 performance, 100 accessibility, best practices and SEO, CLS 0. No horizontal scroll at 375px.

## Addition: "glam" theme derived from the salon's signage
- **Same content, second design.** It is selected by `PUBLIC_THEME=glam` at build time (`src/lib/theme.ts`, `<html data-theme>`), so the CMS, translations and tests are shared.
- **Taken from the three signs:** a berry background (`#6b1442`, brightened after feedback that the first wine-black version looked grim), fuchsia glow and glitter, metallic gold as the single accent, a gold script "Lina" logo (Great Vibes) with a crown and "HAIR SALON" spaced caps, heavy uppercase headlines like "SALON DAMES" (Outfit 800; Lalezar for Arabic), a pink brushstroke label, a gold heart rule, a light streak, and the portrait cropped from the glass sign.
- **Deliberate exceptions to the taste skill:** gold is the accent and fuchsia is only atmosphere; gradient text is used on the logo only.
