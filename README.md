# Lina Salon

One-page website for **Lina Salon**, a women-only hair salon in Antwerpen. It comes in Dutch, French, Arabic (right-to-left) and English, and includes an Arabic editor so the salon owner can update services, hours, photos and texts herself.

**Page order:** hero → About → Services (names only, no prices) → Instagram & TikTok → Visit (address, hours, map). Reviews are built but hidden until real ones are ready.

- **Site:** [Astro](https://astro.build) (static) + Tailwind CSS v4, hosted free on Netlify
- **Editor:** [Decap CMS](https://decapcms.org) at `/admin/`, saving to this GitHub repo. Every save triggers a rebuild, and the change is live in about 2 minutes.
- **Languages:** `/nl/`, `/fr/`, `/ar/`, `/en/`. `/` sends visitors to their browser language (or their last choice), with Dutch as the fallback.

## Before going live: checklist

All content is **placeholder** right now. Replace it via the CMS or in `src/content/`:

- [ ] Real phone number, WhatsApp number, address and opening hours (`settings.json`)
- [ ] Real "about" photo (`src/assets/uploads/`, or upload via the CMS)
- [ ] Instagram and TikTok profile links in the CMS settings. The «تابعينا» (Follow us) section only appears once at least one is filled in. Optionally pick featured Instagram posts by pasting their links.
- [ ] The real "About" story (the current text, including the year 2011, is invented)
- [ ] **Real reviews only.** The five reviews are made up and are hidden. Replace them with real ones from Google (with permission), then switch on «إظهار آراء الزبونات على الموقع» (Show reviews) in the CMS settings.
- [ ] Real Google reviews link and social media links (empty = icon hidden)
- [ ] Set the real domain in `astro.config.mjs` (`site`), `public/robots.txt` and `public/admin/config.yml`
- [ ] Set the GitHub repo in `public/admin/config.yml` (`backend.repo`)
- [ ] Have the Arabic, French and Dutch texts read by a native speaker

## Run it locally

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:4321. To edit content locally without logging in, run the CMS proxy in a second terminal and open http://localhost:4321/admin/index.html:

```bash
npm run cms
```

Other commands: `npm test` (unit tests), `npm run build` (production build into `dist/`), `npm run check:translations`.

## How translations work

Every text the owner can edit is stored in all four languages:

```json
"name": { "ar": "قص الشعر", "nl": "Knippen", "fr": "Coupe", "en": "Haircut" }
```

- She writes the **Arabic**. The NL/FR/EN fields are labelled «يترجمها سامي» ("Sami translates") and are optional.
- While a translation is empty, that page shows the Arabic text, correctly marked right-to-left.
- If she later **edits** Arabic text that was already translated, the old translation stays on the site until you update it. The check spots this from the git history: a translation is *outdated* when the Arabic changed in a later commit. Each language is tracked separately, and translating in the CMS or in code both count.
- If her Arabic edit doesn't need new translations (a typo fix, punctuation), mark it as checked instead of changing the translations:
  - `npm run translations:reviewed` marks **every** outdated text as reviewed.
  - `npm run translations:reviewed -- home.json:heroText` marks only the texts you name (the names come from `npm run check:translations`).

  This writes `translations-reviewed.json`; commit and push it, and the issue updates. A review only covers that exact Arabic text, so if she edits it again it is flagged again. Missing (empty) translations can't be marked as reviewed.
- On every content change, the **Translations** GitHub Action (`.github/workflows/translations.yml`) keeps one issue, "Translations needed", listing every field that is missing or outdated. It closes itself once everything is translated and up to date. You get notified like for any issue. Locally: `npm run check:translations`.
- Fill the translations in through the CMS (same fields), or edit `src/content/*.json` directly.

Interface strings (buttons, day names, section titles) live in `src/i18n/{nl,fr,ar,en}.json` and are edited in code.

## Deploy (one-time setup)

1. **GitHub:** push this repo (e.g. `your-name/lina-salon`) and put that name in `public/admin/config.yml` → `backend.repo`.
2. **Netlify:** "Add new site" → import from GitHub → pick the repo. Build settings come from `netlify.toml`.
3. **CMS login (GitHub OAuth):**
   - GitHub → Settings → Developer settings → OAuth Apps → New. Homepage: your site URL. Callback URL: `https://api.netlify.com/auth/done`.
   - Netlify → Site configuration → Access & security → OAuth → Install provider → GitHub → paste the Client ID and Secret.
4. **Your mother's account:** create a GitHub account for her and add it as a collaborator on the repo (Settings → Collaborators). She logs in at `https://<your-domain>/admin/` with «تسجيل الدخول بحساب GitHub» ("Log in with GitHub").
5. **Domain (`linakapster.be`):** Netlify → Domain management → Add a domain → `linakapster.be` (set as primary; `www` redirects to it), using Netlify DNS (point the registrar's nameservers at Netlify). HTTPS is automatic. After the domain is live: trigger a redeploy (so canonical links and the sitemap use it), and set the GitHub OAuth app's homepage URL to `https://linakapster.be` (the callback URL stays `https://api.netlify.com/auth/done`). The editor is then at `https://linakapster.be/admin/`.

> **Keep the GitHub repo public.** On Netlify's free plan, a private repo only deploys commits from members of the Netlify team. The owner's CMS edits are commits from her own GitHub account, so on a private repo Netlify blocks them ("Build blocked: Unrecognized Git contributor") and her changes never go live. The repo contains no secrets (the OAuth client secret lives in Netlify, not here), so public is safe. Making it private again requires a paid Netlify plan with her as a team member.
>
> Because the repo is public, every editor should turn on GitHub → Settings → Emails → **"Keep my email addresses private"**, so commits use a `…@users.noreply.github.com` address instead of a personal email.

## Project layout

```
src/content/        Content edited via the CMS (JSON)
src/i18n/           Interface strings per language
src/components/     One component per section (Hero, About, Services, SocialFeed, Visit, ...)
src/lib/            i18n helpers, opening-hours logic, image resolving
src/assets/uploads/ Images (CMS uploads land here; Astro optimises them)
public/admin/       Decap CMS: config.yml (Arabic labels) + Arabic UI locale
scripts/            check-translations.mjs
tests/              Vitest unit tests
```

## Two designs

The same content can be shown in two designs, chosen with the `PUBLIC_THEME` environment variable:

| Theme | What it looks like | Run locally | Build |
| --- | --- | --- | --- |
| `glam` (default, chosen by the owner) | Taken from the salon's signs: berry background, pink glow, gold script logo with crown | `npm run dev` | `npm run build` |
| `soft` | Rose & ivory, arch photo frames | `npm run dev:soft` | `npm run build:soft` |

The live site uses glam. To switch to soft, set `PUBLIC_THEME=soft` under Netlify → Site configuration → Environment variables. Glam-only code: `src/styles/glam.css`, `src/components/HeroGlam.astro`, `Wordmark.astro`, `Crown.astro`; the hero portrait is `src/assets/brand/glam-portrait.jpg`, cropped from the glass-sign artwork. Only one `astro dev` server can run at a time, so stop one before starting the other.

## Design notes

- **Rose & ivory:** warm pink-tinted neutrals with one dusty-rose accent (`#a94d64`), and deep plum-brown for text. Every text colour passes WCAG AA.
- **Type:** Fraunces "soft" for headings, with *accent words* in rose italic; Outfit for body text; El Messiri (headings) and Tajawal (body) for Arabic. Arabic is never letter-spaced, and its accent words change colour only, since Arabic has no italics.
- **Accent words:** in a headline, write a word between asterisks, e.g. `Je haar, in *goede handen*.`, and it shows in rose. The CMS hint explains this in Arabic.
- **Shapes:** arch-framed photos (like a salon mirror) with a thin offset outline, soft rounded panels, and one recurring ornament (a four-point sparkle).
- Built mobile-first: a sticky bottom bar (Call / WhatsApp / Route), safe-area padding, no horizontal scroll from 320px up, and hover effects only on devices that can hover.
- Motion is CSS-only and respects `prefers-reduced-motion`.
- The Google Map only loads after a click, so no data goes to Google before that and no cookie banner is needed.
- The "Open now" badge is computed in the visitor's browser in Brussels time.
