# Foodie Landing Re-skin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-theme the static "Lumio" fintech landing page (served in an iframe at the app root `/`) into a foodie / restaurant-discovery page that uses the Palate frontend's warm color palette, while preserving every existing animation exactly.

**Architecture:** The landing is a self-contained static site at `public/lumio/` (`index.html` + `styles.css` + `script.js` + raster `assets/`). Vite copies `public/` verbatim, so we edit these files directly — no build step transforms them. `src/screens/Landing.tsx` renders `<iframe src="./lumio/index.html">`; nothing else in the React app changes. All animation logic in `script.js` and all `@keyframes`/animation classes in `styles.css` key off **DOM structure and class names, not colors** — so we re-skin by (a) swapping colors, (b) rewriting copy, (c) restructuring only the hero mock's inner content while keeping its animated hooks, and (d) replacing a few raster assets. We touch `script.js` in exactly one content spot (a hardcoded count-up value) plus deleting dead Lumio-logo plumbing.

**Tech Stack:** Plain HTML/CSS/vanilla JS (no framework, no bundler for this page). Geist + Geist Mono fonts (already shared with the Palate app) + Instrument Serif for italic display accents (kept). Palette source of truth: `src/index.css` `@theme` block and `src/theme/tokens.ts`.

---

## Palette reference (single source of truth for this plan)

From `src/index.css` (`@theme`) and `src/theme/tokens.ts`. Every color decision below maps to these:

| Token | Value | Role |
| --- | --- | --- |
| canvas | `#FBFBFA` | page background (warm bone) |
| surface | `#FFFFFF` | cards / panels |
| ink | `#2A2A28` | primary text (charcoal, never pure black) |
| ink-soft | `#787774` | secondary text |
| ink-faint | `#A6A39E` | tertiary text |
| line | `#EAEAEA` | hairlines |
| ember | `#B8472A` | **the single brand accent** |
| ember-hover | `#9F3D22` | accent pressed |
| ember-tint | `#FBEDE7` | accent wash |
| ember-ring | `#F1D2C5` | accent border |
| amber | `#C99A3B` | secondary accent (tier SSS+/highlight) |
| amber-tint | `#FBF3DB` | amber wash |
| blue-tint | `#E1F3FE` | tier A wash (used sparingly) |
| green-tint | `#EDF3EC` | tier B wash / positive |

Tier label colors (from `tokens.ts`, used on badges): `SSS+` fg `#8A5A00` bg `#FBF3DB`; `S` fg `#B0461F` bg `#FBEDE7`; `A` fg `#1F6C9F` bg `#E1F3FE`; `B` fg `#346538` bg `#EDF3EC`; `C` fg `#787774` bg `#F1F0EE`.

## Global color find/replace map (Lumio cool → Palate warm)

Used by Task 1 (root vars) and Task 9 (sweep). These are the literal strings currently in `public/lumio/styles.css` and inline in `index.html`:

| Old (cool) | New (warm) | Meaning |
| --- | --- | --- |
| `#0E0A07` | `#2A2A28` | ink |
| `14,10,7` (rgba bodies) | `42,42,40` | ink rgba |
| `#FEFEFE` (`--paper`) | `#FBFBFA` | page bg |
| `#18498B` | `#B8472A` | primary blue → ember |
| `#2352DE` / `35,82,222` | `#B8472A` / `184,71,42` | bright blue → ember |
| `#3372D9` | `#C99A3B` | mid blue → amber |
| `#2552DE` | `#B8472A` | stat blue → ember |
| `#8669B9` / `134,105,185` | `#C99A3B` / `201,154,59` | violet → amber |
| `#072049` | `#2A1410` | curtain bg → deep ember-brown |
| `8,23,79` | `58,26,16` | curtain shadow → warm |
| `61,98,147` | `184,71,42` | cta shadow → ember |
| `97,147,221` | `255,255,255` | card chip blue → warm glass white |
| `74,130,208` | `201,154,59` | curtain tint → amber |
| `140,180,235` | `230,180,120` | curtain glow → warm |
| `24,73,139` | `184,71,42` | hero btn → ember |
| `#635BFF` | `#B8472A` | stripe purple badge → ember |
| `#E62A2A` | `#C99A3B` | red anomaly → amber (now positive) |
| `#4BA884` | `#346538` | green "up" → Palate green (keep positive) |

Curtain SVG-gradient stops (inside the `url("data:image/svg+xml...")` in `.curtain__bg`): replace the hex-encoded blues `%23041737 %23082558 %231e4d99 %234a82d0` with warm ramp `%232A1410 %234A1E10 %238A3520 %23B8472A` (deep brown → ember). `.curtain__tint` `rgba(74,130,208,.35)` → `rgba(201,154,59,.30)`.

Integration-tile inline brand hexes in `index.html` (`#1AB4D7 #635BFF #4A154B #0F1A2A #2CA01C #F5614A #0B2545 #0F2A1F #0E0A07 #0E3B2E #F2EB16 #163300 #FF5000`, plus `#117ACA`, `#9FE870`, `#FFD93D`, `#FFE5A0`) → recolored per Task 8 to a warm cuisine palette (those tiles are fully rewritten there, so no 1:1 mapping needed).

---

## File structure

- **Modify** `public/lumio/index.html` — branding/logo, hero copy, hero mock restructure (Discover feed), all section copy, card content, orbit + filters, title/meta. Delete dead Lumio `<symbol>` + logo-fixup scripts.
- **Modify** `public/lumio/styles.css` — `:root` vars, recolor sweep, restyle of the restructured hero mock + card chips + orbit tiles, card-background image wiring + scrim, hero `<video>` warm filter.
- **Modify** `public/lumio/script.js` — exactly one edit: the hardcoded card-B count-up target + label (lines ~218–224). Optional deletion of the two trailing `svg use → #lumio-mark` blocks (lines ~955–965).
- **Create** `public/lumio/assets/card-a-bg.png`, `card-b-bg.png`, `card-c-bg.png` — generated food images (with CSS scrim for text contrast). Overwrites the existing blue ones in place (same filenames → no wiring change needed beyond scrim).
- **Create (optional)** `public/lumio/assets/orbit-food-1.png`, `orbit-food-2.png` — small dish photos for the two "empty" orbit tiles.
- **No change** to `src/`, the React app, `vite.config.ts`, or `package.json`.

**Animation-preservation invariants (DO NOT break any of these):**
1. Keep these classes/ids/attributes wherever they appear — they are animation hooks: `.ch`/`.sp` (letter split), `.sub-line`, `.kpi` + `.kpi .val`, `.kpis > .kpi:nth-child(1..3)`, `.breadcrumbs`, `.welcome`, `.sidebar`, `.browser__chrome`, `#insightCard`, `.saving .v`, `.conn` (+ `:nth-child`), `.stamp`, `.chart-line`/`.chart-dash`/`.chart-clip-rect`/`.chart-dot`/`.chart .badge`, `.runway`, `.tile`/`.tile.lumio`/`.orbit-ring .tile`/`g1`…`g9`/`data-group`, `.lumio-label .n`/`.k`, `.filter-list button[data-grp]`, `.eyebrow`, `.int-pill`, `.sync-stamp`.
2. Keep `data-count` / `data-prefix` / `data-suffix` / `data-format` on the s2 stat `.v` elements (values may change; attributes must remain).
3. Keep the inline bottom-of-`index.html` `<script>` that wires `.cta`,`.btn.primary`→`#/onboarding` and `.signin`→`#/discover`. Do not rename those classes.
4. Keep the hero `<h1>` as two `.line` spans with an `.it` italic accent span on line 2; keep `<br>`-separated two-line `h2`s in s2/s3/s4 with the `.it` accent on the second line (the letter-split + per-line delay logic depends on this shape).

**How to run/verify the landing during this plan:**
- `npm run dev`, then open the printed dev URL **plus** `/lumio/index.html` (e.g. `http://localhost:5173/lumio/index.html`) to test the landing standalone with its full intro. Also open `/` to confirm it still renders inside the app iframe.
- A "verify" step means: reload that URL, watch the intro play, then scroll (wheel/arrow keys) through all 4 sections and confirm the named animation still runs and the named content/color changed.
- Commit after each task.

---

### Task 0: Baseline snapshot & branch

**Files:** none (git only)

- [ ] **Step 1: Create a working branch**

```bash
git checkout -b foodie-landing-reskin
```

- [ ] **Step 2: Confirm the dev server serves the landing**

Run: `npm run dev`
Open `http://localhost:5173/lumio/index.html` (use whatever port Vite prints).
Expected: the blue Lumio intro plays (logo → nav → hero "Know Exactly Where Your Money Goes" → browser flips in with counting KPIs), and wheel-scroll moves through 4 sections (Engineers stats, How-it-works 3 cards, Integrations orbit). This is the animation set we must preserve.

- [ ] **Step 3: Record the baseline fintech-term count (guardrail anchor)**

Run: `grep -ncE "Lumio|Stripe|QuickBooks|Runway|MRP|NRR" public/lumio/index.html`
Expected: a non-zero number (currently `18`). Task 9 drives this to `0`.

- [ ] **Step 4: Commit the branch point**

```bash
git add -A && git commit -m "chore: branch point before foodie landing re-skin" --allow-empty
```

---

### Task 1: Palette foundation (`:root` + page title)

Swap the global color variables and the document title. After this task the page is globally warm even before per-element fixes.

**Files:**
- Modify: `public/lumio/styles.css:1-16` (the `:root` block)
- Modify: `public/lumio/index.html:6` (`<title>`) and `index.html:3-14` (`<head>`)

- [ ] **Step 1: Replace the `:root` variable block**

In `public/lumio/styles.css`, replace lines 1–16 (the `:root{…}` block) with:

```css
:root{
        --ink:#2A2A28;
        --paper:#FBFBFA;
        --surface:#FFFFFF;
        --ember:#B8472A;
        --ember-hover:#9F3D22;
        --ember-tint:#FBEDE7;
        --ember-ring:#F1D2C5;
        --amber:#C99A3B;
        --amber-tint:#FBF3DB;
        /* legacy names kept so existing rules using them resolve to warm tones */
        --blue:#B8472A;
        --blue-2:#B8472A;
        --blue-3:#C99A3B;
        --violet:#C99A3B;
        --line:rgba(42,42,40,.07);
        --line-2:rgba(42,42,40,.05);
        --muted:rgba(42,42,40,.45);
        --muted-2:rgba(42,42,40,.55);
        --muted-3:rgba(42,42,40,.35);
        --font-sans:'Geist','Aktiv Grotesk Corp','Inter',ui-sans-serif,system-ui,sans-serif;
        --font-serif:'Instrument Serif',ui-serif,serif;
        --font-mono:'Geist Mono',ui-monospace,monospace;
      }
```

(We keep `--blue`, `--blue-2`, `--blue-3`, `--violet` as variable *names* pointed at warm values so any rule referencing them is corrected for free; Task 9 then removes the remaining *hardcoded* cool hexes that don't go through these vars.)

- [ ] **Step 2: Update the document title and add a description**

In `public/lumio/index.html`, replace line 6:

```html
    <title>Lumio — Know exactly where your money goes</title>
```
with:
```html
    <title>Palate — Find your next favorite restaurant</title>
    <meta name="description" content="Discover the best local spots, rank them into tiers, collect stamps, complete food quests, and unlock deals. Beli meets a foodie rewards game." />
    <link rel="icon" href="/palate-mark.svg" />
```

- [ ] **Step 3: Verify**

Run: `npm run dev` and reload `/lumio/index.html`.
Expected: text/ink is now warm charcoal `#2A2A28`, the page background is warm bone `#FBFBFA`, and the browser tab reads "Palate — Find your next favorite restaurant". The hero is still blue (its colors are hardcoded, fixed in Task 3) — that's expected at this stage.

- [ ] **Step 4: Commit**

```bash
git add public/lumio/styles.css public/lumio/index.html
git commit -m "feat(landing): swap to Palate warm palette variables + title"
```

---

### Task 2: Branding — Lumio mark → Palate mark + nav copy

Replace the Lumio logotype with a Palate "plate" glyph (concentric ring + center dot, matching `public/palate-mark.svg`) rendered in `currentColor` so it works on both nav states, plus a visible "Palate" wordmark. Update nav links and CTA copy.

**Files:**
- Modify: `public/lumio/index.html` — nav (`:17-41`), drawer (`:44-52`), intro center logo (`:56-60`), the two `<symbol id="lumio-mark">` blocks (`:730-787`), the two trailing `svg use` scripts (`:955-965`)
- Modify: `public/lumio/styles.css:34-35` (`.nav .brand`)

- [ ] **Step 1: Replace the nav brand markup**

In `index.html`, replace lines 22–25:

```html
      <a class="brand" href="#">
        <svg viewBox="0 0 84 21" fill="currentColor"><use href="./assets/lumio-white.svg#root" /></svg>
        <span style="display:none">Lumio</span>
      </a>
```
with:
```html
      <a class="brand" href="#">
        <svg class="plate-mark" viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.4" />
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
        </svg>
        <span class="brand-name">Palate</span>
      </a>
```

- [ ] **Step 2: Style the visible wordmark**

In `styles.css`, replace lines 34–35:

```css
      .nav .brand{display:flex;align-items:center;gap:8px;color:#fff}
      .nav .brand svg{height:21px;width:auto;color:#fff;transition:color .4s ease}
```
with:
```css
      .nav .brand{display:flex;align-items:center;gap:8px;color:#fff}
      .nav .brand svg{height:22px;width:22px;color:#fff;transition:color .4s ease}
      .nav .brand .brand-name{font-size:18px;font-weight:600;letter-spacing:-0.03em;color:currentColor}
```

(The existing rules `.nav.dark .brand svg{color:var(--ink)}` and `.nav.dark … .signin{color:var(--ink)}` already flip the brand to ink on non-hero sections; `.brand-name` inherits `currentColor`, so both states work.)

- [ ] **Step 3: Replace the intro center logo glyph**

In `index.html`, replace lines 58–60:

```html
      <div class="curtain__hero-logo" id="introCenterLogo" aria-hidden="true">
        <svg viewBox="0 0 84 21" fill="currentColor"><use href="#lumio-mark" /></svg>
      </div>
```
with:
```html
      <div class="curtain__hero-logo" id="introCenterLogo" aria-hidden="true">
        <svg class="plate-mark" viewBox="0 0 24 24" width="22" height="22" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="2.4" />
          <circle cx="12" cy="12" r="3.2" fill="#fff" />
        </svg>
        <span style="color:#fff;font-size:18px;font-weight:600;letter-spacing:-0.03em">Palate</span>
      </div>
```

- [ ] **Step 4: Update nav links + drawer + CTA/sign-in copy**

In `index.html`, replace the nav links block (lines 26–29):

```html
      <div class="links">
        <a href="#">About</a><a href="#">Product</a><a href="#">Integrations</a><a href="#">Pricing</a
        ><a href="#">Blog</a>
      </div>
```
with:
```html
      <div class="links">
        <a href="#">Discover</a><a href="#">How it Works</a><a href="#">Cuisines</a><a href="#">For Restaurants</a
        ><a href="#">Blog</a>
      </div>
```

Replace the drawer links (lines 46–51):

```html
      <a href="#">About</a>
      <a href="#">Product</a>
      <a href="#">Integrations</a>
      <a href="#">Pricing</a>
      <a href="#">Blog</a>
      <a href="#" style="opacity:.7;font-size:20px">Sign In</a>
```
with:
```html
      <a href="#">Discover</a>
      <a href="#">How it Works</a>
      <a href="#">Cuisines</a>
      <a href="#">For Restaurants</a>
      <a href="#">Blog</a>
      <a href="#" style="opacity:.7;font-size:20px">Sign In</a>
```

The nav CTA on line 37 currently reads `Get Started` — leave the text `Get Started` (it wires to `#/onboarding`). The `.signin` "Sign In" (line 31) stays (wires to `#/discover`).

- [ ] **Step 5: Delete the dead Lumio `<symbol>` defs and logo-fixup scripts**

In `index.html`, delete **both** `<svg width="0" height="0" …><symbol id="lumio-mark">…</symbol></svg>` blocks (lines 730–757 and 760–787). Then delete the two trailing fixup scripts (lines 955–965):

```html
      document.querySelectorAll('svg use').forEach(u => {
        u.setAttribute('href', '#lumio-mark');
      });
      document.querySelectorAll('svg use').forEach(u => {
        const h = u.getAttribute('href') || '';
        if (h.includes('lumio') && h.includes('#')) {
          u.setAttribute('href', '#lumio-mark');
        }
      });
```

(After Steps 1 & 3 there are no `<use>` elements left, so these are inert; removing them deletes the last Lumio references. These blocks are logo plumbing, not animation logic.)

- [ ] **Step 6: Verify**

Reload `/lumio/index.html`.
Expected: the intro shows a ring-and-dot "◎ Palate" mark (white) that morphs into the nav; nav reads "◎ Palate … Discover / How it Works / Cuisines / For Restaurants / Blog … Sign In / Get Started". On scroll to section 2+, the brand flips to charcoal ink. No console errors. Intro choreography timing unchanged.

- [ ] **Step 7: Commit**

```bash
git add public/lumio/index.html public/lumio/styles.css
git commit -m "feat(landing): Palate plate mark + foodie nav copy, drop Lumio logo plumbing"
```

---

### Task 3: Hero — copy, curtain recolor, warm video tint

Rewrite the hero headline/subhead/pill/CTAs to the foodie story, recolor the curtain (background, tint, overlay, shadow) from blue to warm ember/charcoal, and warm-tint the existing background video via CSS filter (per the chosen "tint it warm, keep it" approach).

**Files:**
- Modify: `public/lumio/index.html` hero section (`:67-109`)
- Modify: `public/lumio/styles.css` — `.curtain` (`:122-130`), `.curtain__bg` (`:131-138`), `.curtain__tint` (`:146-151`), `.curtain__video` (`:139-145`), `.hero .pill .new` (`:228-232`), `.hero .ctas .btn.primary` (`:271-276`), `.nav .cta` (`:40-47`)

- [ ] **Step 1: Rewrite the hero pill, headline, subhead, and CTAs**

In `index.html`, replace lines 68–108 (the `.pill`, `h1`, `p.sub`, `.ctas`) with:

```html
        <div class="pill">
          <div class="bb-wrap" aria-hidden="true">
            <div class="bb-beam bb-beam-1"></div>
            <div class="bb-beam bb-beam-2"></div>
          </div>
          <span class="new">NEW</span><span class="label">Tier rankings</span>
        </div>
        <h1 style="line-height: 1.06; padding: 0px; font-size: 60px; text-align: center">
          <span class="line line1" style="margin: 0px">Know Exactly Where to Eat</span
          ><span
            class="line line2"
            style="font-weight: 400; line-height: 1; letter-spacing: -1.2px; margin: 0px; width: auto"
            >Next.&nbsp;<span class="it">Before the Line Forms.</span></span
          >
        </h1>
        <p class="sub">
          <span class="sub-line">Open Palate and see the best spots near you in seconds.</span
          ><span class="sub-line">We blend ratings, your friends' saves, your taste, and live deals</span
          ><span class="sub-line">so you skip the guesswork and never settle for mid again.</span>
        </p>
        <div class="ctas">
          <button class="btn primary" style="padding: 0px 16px; letter-spacing: -0.9px">
            <div class="bb-wrap" aria-hidden="true">
              <div class="bb-beam bb-beam-1"></div>
              <div class="bb-beam bb-beam-2"></div>
            </div>
            Start Discovering
            <img
              src="./assets/arrows-double-sw-ne.png"
              alt=""
              style="width:18px;height:18px;flex-shrink:0;filter:brightness(0) invert(1)"
            />
          </button>
          <button class="btn ghost" style="letter-spacing: -0.9px">
            <div class="bb-wrap" aria-hidden="true">
              <div class="bb-beam bb-beam-1"></div>
              <div class="bb-beam bb-beam-2"></div>
            </div>
            See a Demo
          </button>
        </div>
```

(Kept: two `.line` spans with `.it` accent on line 2; exactly three `.sub-line` spans; the `.btn.primary`/`.btn.ghost`/`.pill` classes and their `bb-wrap` beams. Changed `width:700px`→`width:auto` on line 2 so the new copy centers without clipping.)

- [ ] **Step 2: Recolor the curtain shell**

In `styles.css`, in `.curtain` (lines 122–130) change:

```css
        background-color:#072049;
        box-shadow:0 24px 60px rgba(8,23,79,.35);
```
to:
```css
        background-color:#2A1410;
        box-shadow:0 24px 60px rgba(58,26,16,.35);
```

In `.curtain__bg` (lines 131–138) replace the whole `background-image` declaration with a warm radial glow + warm vertical ramp:

```css
        background-image:
          radial-gradient(60% 80% at 50% 30%, rgba(230,180,120,.45) 0%, rgba(184,71,42,0) 70%),
          url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='100' preserveAspectRatio='none'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='0'><stop offset='0' stop-color='%232A1410'/><stop offset='0.20' stop-color='%234A1E10'/><stop offset='0.40' stop-color='%238A3520'/><stop offset='0.50' stop-color='%23B8472A'/><stop offset='0.60' stop-color='%238A3520'/><stop offset='0.80' stop-color='%234A1E10'/><stop offset='1' stop-color='%232A1410'/></linearGradient></defs><rect width='60' height='100' fill='url(%23g)'/></svg>");
```

In `.curtain__tint` (lines 146–151) change the gradient to warm:

```css
        background:
          radial-gradient(60% 70% at 50% 30%, rgba(201,154,59,.30) 0%, rgba(42,20,16,0) 65%);
```

- [ ] **Step 3: Warm-tint the background video**

In `styles.css`, in `.curtain__video` (lines 139–145) change the filter line:

```css
        filter: brightness(1.5) saturate(1.5) contrast(1.1);
```
to:
```css
        filter: brightness(1.35) saturate(1.4) contrast(1.05) sepia(0.45) hue-rotate(-18deg);
```

(`sepia` + a small negative `hue-rotate` pushes the blue glass into amber/ember while keeping motion and brightness. Tune `sepia` 0.35–0.6 and `hue-rotate` -10° to -25° to taste.)

- [ ] **Step 4: Recolor hero accent fills**

In `styles.css`, `.hero .pill .new` (line ~230) change `background:#2352DE;` → `background:#B8472A;`.

`.hero .ctas .btn.primary` (lines 271–276) change:
```css
        background:rgb(24,73,139);border:1px solid rgba(255,255,255,.3);
        box-shadow:inset 0 0 8px 6px rgba(255,255,255,.2),
                   0 2px 5px rgba(61,98,147,.2),0 9px 9px rgba(61,98,147,.17),0 19px 12px rgba(61,98,147,.1);
```
to:
```css
        background:rgb(184,71,42);border:1px solid rgba(255,255,255,.3);
        box-shadow:inset 0 0 8px 6px rgba(255,255,255,.2),
                   0 2px 5px rgba(184,71,42,.25),0 9px 9px rgba(184,71,42,.18),0 19px 12px rgba(184,71,42,.1);
```

`.nav .cta` (lines 40–47) change `background:#18498B;` → `background:#B8472A;` and the three `rgba(61,98,147,…)` shadow bodies → `rgba(184,71,42,…)` (keep the same alpha values).

- [ ] **Step 5: Verify**

Reload `/lumio/index.html`.
Expected: hero reads "Know Exactly Where to Eat **Next.** *Before the Line Forms.*" with the three-line subhead; the curtain background and video now read warm amber/ember instead of blue; the "Start Discovering" / "Get Started" buttons are ember; letter-by-letter headline reveal, sub-line stagger, pill bounce, and CTA pop all still play.

- [ ] **Step 6: Commit**

```bash
git add public/lumio/index.html public/lumio/styles.css
git commit -m "feat(landing): foodie hero copy + warm curtain/video tint"
```

---

### Task 4: Hero floating mock → Consumer Discover feed

Restructure the inner content of the floating browser mock from a finance dashboard into Palate's diner-facing Discover feed: sidebar nav (Discover/Rank/Passport/Profile) and a "Best matches near you" list of three restaurant cards with tier badge, rating, deal, and a counting match score. **Reuse the existing `.breadcrumbs`, `.welcome`, and `.kpis > .kpi` skeleton** so the intro animation and `countUp` keep working unchanged.

**Files:**
- Modify: `public/lumio/index.html` — browser URL (`:133`), sidebar agency + menu (`:140-190`), main content (`:192-295`)
- Modify: `public/lumio/styles.css` — `.kpi*` rules (`:354-372`), `.welcome` (`:353`), `.menu` is reused as-is; add restaurant-card styles

- [ ] **Step 1: Update the browser chrome URL**

In `index.html` line 133, change the URL text `app.lumio.ai / overview` → `palate.app / discover`.

- [ ] **Step 2: Rebrand the sidebar account + menu**

Replace the `.agency` block (lines 141–155) so the account is a diner, not an agency. Replace lines 148–151:

```html
              <div class="agency__meta">
                <div class="k">AGENCY</div>
                <div class="n">Lumio Team</div>
              </div>
```
with:
```html
              <div class="agency__meta">
                <div class="k">EXPLORER</div>
                <div class="n">Lucas · Lv. 7</div>
              </div>
```

Replace the menu (lines 156–190) — keep four `<a>` rows (the active one keeps `class="active"`), only change the labels:

```html
            <h6>MAIN MENU</h6>
            <div class="menu">
              <a class="active" href="#"
                ><img src="./assets/material-symbols-light_home-rounded.svg" alt="" style="width:14px;height:14px;display:inline-block;vertical-align:middle" />
                Discover</a
              >
              <a href="#"
                ><img src="./assets/material-symbols-light_home-rounded_1.svg" alt="" style="width:14px;height:14px;display:inline-block;vertical-align:middle" />
                Rank</a
              >
              <a href="#"
                ><img src="./assets/material-symbols-light_home-rounded_1.svg" alt="" style="width:14px;height:14px;display:inline-block;vertical-align:middle" />
                Passport</a
              >
              <a href="#"
                ><img src="./assets/material-symbols-light_home-rounded_1.svg" alt="" style="width:14px;height:14px;display:inline-block;vertical-align:middle" />
                Deals</a
              >
            </div>
```

- [ ] **Step 3: Replace the main content (breadcrumbs + welcome + 3 KPI cards → Discover feed)**

Replace lines 192–295 (`<div class="main"> … </div>` inclusive of the three `.kpi`s) with the following. Each restaurant reuses `.kpi`/`.inner`/`.val`/`.label`/`.desc` so the staggered intro reveal and the `countUp` on `.kpi .val` both still fire (now counting the **match %**):

```html
          <div class="main">
            <div class="breadcrumbs" style="gap: 6px">
              <span>Discover</span> <span>›</span> <strong>Best Match</strong>
            </div>
            <div class="welcome">Best matches near you, Lucas</div>
            <div class="kpis">

              <div class="kpi rcard">
                <div class="inner">
                  <div class="rmeta">
                    <div class="rtop"><span class="tier tier-s">S</span><span class="rname">Luna Tacos</span></div>
                    <div class="label">MEXICAN · MILL DISTRICT · $</div>
                    <div class="desc">★ 4.7 · 3 friends saved · 15% off after 3 PM</div>
                  </div>
                  <div class="match"><div class="val">97</div><div class="munit">% match</div></div>
                </div>
              </div>

              <div class="kpi rcard">
                <div class="inner">
                  <div class="rmeta">
                    <div class="rtop"><span class="tier tier-sss">SSS+</span><span class="rname">Crumb Bakery</span></div>
                    <div class="label">BAKERY · OLD FOURTH · $</div>
                    <div class="desc">★ 4.8 · best dessert · free cookie at 5 stamps</div>
                  </div>
                  <div class="match"><div class="val">94</div><div class="munit">% match</div></div>
                </div>
              </div>

              <div class="kpi rcard">
                <div class="inner">
                  <div class="rmeta">
                    <div class="rtop"><span class="tier tier-a">A</span><span class="rname">Bean Theory Cafe</span></div>
                    <div class="label">CAFE · COLLEGE ROW · $$</div>
                    <div class="desc">★ 4.6 · study spot · 20% off iced 2–4 PM</div>
                  </div>
                  <div class="match"><div class="val">88</div><div class="munit">% match</div></div>
                </div>
              </div>

            </div>
          </div>
```

(Note: `countUp` strips non-digits and re-displays the raw text at the end; `97`/`94`/`88` count cleanly with no `$`/`%` prefix on the `.val` itself — the `% match` lives in a sibling `.munit`.)

- [ ] **Step 4: Restyle `.welcome`, the KPI grid as restaurant cards, and tier badges**

In `styles.css`, after the existing `.kpi .qmark` rule (line ~372) append:

```css
      /* Discover-feed restyle of the reused KPI grid */
      .kpis{grid-template-columns:1fr;gap:10px}
      .welcome{font-size:22px}
      .kpi.rcard{background:#fff;border:1px solid var(--line);padding:0}
      .kpi.rcard .inner{align-items:center;gap:14px}
      .kpi.rcard .rmeta{min-width:0;flex:1}
      .kpi.rcard .rtop{display:flex;align-items:center;gap:8px;margin-bottom:6px}
      .kpi.rcard .rname{font-size:17px;font-weight:600;letter-spacing:-0.03em;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .kpi.rcard .label{font-size:10px;letter-spacing:.08em;color:rgba(42,42,40,.45)}
      .kpi.rcard .desc{margin-top:6px;font-size:12px;color:rgba(42,42,40,.6)}
      .kpi.rcard .match{flex-shrink:0;text-align:right}
      .kpi.rcard .match .val{font-family:var(--font-mono);font-size:30px;letter-spacing:-0.05em;color:var(--ember);line-height:1}
      .kpi.rcard .match .munit{font-size:10px;letter-spacing:.06em;color:rgba(42,42,40,.45);margin-top:3px}
      .tier{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:22px;padding:0 7px;border-radius:7px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:-0.02em}
      .tier-sss{background:#FBF3DB;color:#8A5A00}
      .tier-s{background:#FBEDE7;color:#B0461F}
      .tier-a{background:#E1F3FE;color:#1F6C9F}
```

- [ ] **Step 5: Verify**

Reload `/lumio/index.html` and let the intro finish.
Expected: the floating mock is now a Palate Discover feed — sidebar Discover/Rank/Passport/Deals with "Lucas · Lv. 7"; main shows "Best matches near you" and three restaurant cards (Luna Tacos S, Crumb Bakery SSS+, Bean Theory A) each with a tier badge, rating/deal line, and an ember match score that **counts up** (0→97 / 94 / 88). The browser flip-in, per-card stagger, sidebar/breadcrumb/welcome blur-in all still play. URL chip reads `palate.app / discover`.

- [ ] **Step 6: Commit**

```bash
git add public/lumio/index.html public/lumio/styles.css
git commit -m "feat(landing): hero mock becomes Palate Discover feed (animation hooks preserved)"
```

---

### Task 5: Section 02 (Engineers) — copy + stats recolor

**Files:**
- Modify: `public/lumio/index.html` s2 (`:309-365`)
- Modify: `public/lumio/styles.css` `.s2 .stats .violet/.blue` (`:435-442`)

- [ ] **Step 1: Rewrite headline, lede, bottom copy, and stat labels/values**

In `index.html`, replace the s2 inner content (lines 318–363, from `<div class="reveal">` through `</div>` closing `.bottom`) with:

```html
              <div class="reveal">
                <div class="grid">
                  <div>
                    <span class="eyebrow"><span class="sq"></span>HOW WE THINK</span>
                  </div>
                  <div>
                    <h2>We're food obsessives at heart<br />and locals at every table</h2>
                    <p class="lede">
                      <span class="sub-line">Palate is built by a small crew who spent years</span
                      ><span class="sub-line">opening fourteen tabs and three group chats just</span
                      ><span class="sub-line">to answer one question — where should we eat?</span
                      ><span class="sub-line">Great food is everywhere; the hard part is trusting</span
                      ><span class="sub-line">the call. So we built the ranking we always wanted:</span
                      ><span class="sub-line">your taste, your friends, and the whole city, sorted.</span>
                    </p>
                  </div>
                  <div></div>
                </div>
              </div>
              <div class="bottom">
                <div class="left">
                  <p>
                    Finding somewhere great to eat shouldn't take a spreadsheet, a group vote, and
                    twenty minutes of doom-scrolling reviews.
                  </p>
                  <button class="meet">
                    How Palate Works
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
                      <path d="M4 10h12 M11 5l5 5-5 5" />
                    </svg>
                  </button>
                </div>
                <div class="stats">
                  <div class="stat violet">
                    <div class="v" data-count="4200" data-suffix="+" data-format="int">0+</div>
                    <div class="l">LOCAL<br />SPOTS<br />RANKED</div>
                  </div>
                  <div class="stat blue">
                    <div class="v" data-count="2.4" data-suffix="M" data-format="dec1">0.0M</div>
                    <div class="l">BITES<br />LOGGED<br />THIS YEAR</div>
                  </div>
                </div>
              </div>
```

(The `.violet` stat keeps `data-format="int"` and counts to `4200+`. The `.blue` stat drops the `data-prefix="$"` and uses `data-suffix="M"` so it counts to `2.4M`. Keep the class names `violet`/`blue` — the JS targets `.stat.violet .v` / `.stat.blue .v` for the count-up.)

- [ ] **Step 2: Recolor the two stat tiles**

In `styles.css` replace lines 435–442:

```css
      .s2 .stats .stat.violet{background:rgba(134,105,185,.02);border:1px solid rgba(134,105,185,.2);box-shadow:inset 0 0 11.2px 5px rgba(134,105,185,.04)}
      .s2 .stats .stat.blue{background:rgba(37,91,243,.02);border:1px solid rgba(37,91,243,.2);box-shadow:inset 0 0 11.2px 5px rgba(37,91,243,.04)}
      .s2 .stats .v{font-family:var(--font-mono);font-size:clamp(18px,1.8vw,24px);letter-spacing:-0.06em;line-height:1}
      .s2 .stats .l{font-size:clamp(8px,.8vw,10px);letter-spacing:.1em;font-weight:700;line-height:1.2}
      .s2 .stats .violet .v{color:#8669B9}
      .s2 .stats .violet .l{color:rgba(134,105,185,.7)}
      .s2 .stats .blue .v{color:#2552DE}
      .s2 .stats .blue .l{color:rgba(37,91,243,.7)}
```
with (violet→amber, blue→ember):
```css
      .s2 .stats .stat.violet{background:rgba(201,154,59,.04);border:1px solid rgba(201,154,59,.25);box-shadow:inset 0 0 11.2px 5px rgba(201,154,59,.05)}
      .s2 .stats .stat.blue{background:rgba(184,71,42,.04);border:1px solid rgba(184,71,42,.22);box-shadow:inset 0 0 11.2px 5px rgba(184,71,42,.05)}
      .s2 .stats .v{font-family:var(--font-mono);font-size:clamp(18px,1.8vw,24px);letter-spacing:-0.06em;line-height:1}
      .s2 .stats .l{font-size:clamp(8px,.8vw,10px);letter-spacing:.1em;font-weight:700;line-height:1.2}
      .s2 .stats .violet .v{color:#C99A3B}
      .s2 .stats .violet .l{color:rgba(201,154,59,.8)}
      .s2 .stats .blue .v{color:#B8472A}
      .s2 .stats .blue .l{color:rgba(184,71,42,.75)}
```

- [ ] **Step 3: Verify**

Scroll to section 2.
Expected: headline reveals letter-by-letter ("We're food obsessives at heart / and locals at every table"); the six lede sub-lines stagger in; the two stat tiles are amber + ember and count up to `4200+` and `2.4M`; the "How Palate Works" button pops.

- [ ] **Step 4: Commit**

```bash
git add public/lumio/index.html public/lumio/styles.css
git commit -m "feat(landing): foodie 'how we think' section + amber/ember stats"
```

---

### Task 6: Section 03 (How it works) — copy + card content + count-up + recolor

Rewrite the three-card story to Discover → Match → Level Up, recolor the chips/insight/anomaly/runway from blue to ember, retarget the one hardcoded JS count-up, and recolor the cash icon. (Card *background* images are handled in Task 7.)

**Files:**
- Modify: `public/lumio/index.html` s3 (`:370-572`)
- Modify: `public/lumio/script.js` (`:218-224` — the hardcoded saving count-up)
- Modify: `public/lumio/styles.css` — `.conn` (`:686-705`), `.insight-head .ic` (`:776`), `.anomaly` (`:781-787`), `.runway-head .ic svg` (`:806`)

- [ ] **Step 1: Rewrite the s3 head (corners, eyebrow, h2, sub)**

In `index.html`, replace lines 373–382:

```html
              <div class="s3-head">
                <span class="corner l">THREE THINGS HAPPEN THE</span>
                <span class="corner r">MOMENT YOU CONNECT</span>
                <div class="eyebrow"><span class="sq"></span>HOW IT WORKS</div>
                <h2>From Raw Data to Clear<br /><span class="it">Decisions in Seconds</span></h2>
                <p>
                  <span class="sub-line">Most finance tools hand you more charts to interpret. Lumio does the</span
                  ><span class="sub-line">interpreting for you connecting your accounts, watching for problems,</span
                  ><span class="sub-line">and telling you what to do next</span>
                </p>
              </div>
```
with:
```html
              <div class="s3-head">
                <span class="corner l">THREE THINGS HAPPEN THE</span>
                <span class="corner r">MOMENT YOU OPEN PALATE</span>
                <div class="eyebrow"><span class="sq"></span>HOW IT WORKS</div>
                <h2>From Craving to Your Table<br /><span class="it">in a Few Taps</span></h2>
                <p>
                  <span class="sub-line">Most food apps hand you a wall of four-star ratings to sort through.</span
                  ><span class="sub-line">Palate does the deciding — matching your taste, your friends, and</span
                  ><span class="sub-line">live deals, then telling you exactly where to go next.</span>
                </p>
              </div>
```

(Keeps two-line `h2` with `.it` on line 2, the `.corner.l`/`.corner.r` letter-animated labels, and three `.sub-line`s.)

- [ ] **Step 2: Card A — "01 — DISCOVER" restaurant rows**

In `index.html`, replace the three `.conn` rows + stamp in card A (lines 388–434). Keep three `.conn` elements (the `bb-beam` delays target `.conn:nth-child(1..3)`), the `.badge`, `.meta`/`.kicker`/`.name`, and a pill (renamed conceptually from `live-pill` but keep the class `live-pill` so styling/markup stays consistent):

```html
                  <div class="conn-list">
                    <div class="conn">
                      <div class="bb-wrap" aria-hidden="true">
                        <div class="bb-beam bb-beam-1"></div>
                        <div class="bb-beam bb-beam-2"></div>
                      </div>
                      <div class="badge cuisine-1">🌮</div>
                      <div class="meta">
                        <div class="kicker">Mexican · Mill District</div>
                        <div class="name">Luna Tacos</div>
                      </div>
                      <div class="live-pill tier-pill">S TIER</div>
                    </div>
                    <div class="conn">
                      <div class="bb-wrap" aria-hidden="true">
                        <div class="bb-beam bb-beam-1"></div>
                        <div class="bb-beam bb-beam-2"></div>
                      </div>
                      <div class="badge cuisine-2">🥐</div>
                      <div class="meta">
                        <div class="kicker">Bakery · Old Fourth</div>
                        <div class="name">Crumb Bakery</div>
                      </div>
                      <div class="live-pill tier-pill">SSS+</div>
                    </div>
                    <div class="conn">
                      <div class="bb-wrap" aria-hidden="true">
                        <div class="bb-beam bb-beam-1"></div>
                        <div class="bb-beam bb-beam-2"></div>
                      </div>
                      <div class="badge cuisine-3">☕</div>
                      <div class="meta">
                        <div class="kicker">Cafe · College Row</div>
                        <div class="name">Bean Theory Cafe</div>
                      </div>
                      <div class="live-pill tier-pill">A TIER</div>
                    </div>
                  </div>
                  <div class="stamp">01 — DISCOVER</div>
```

- [ ] **Step 3: Card B — "02 — MATCH" insight**

Replace card B inner (lines 439–467). Keep `#insightCard`, `.insight-head`/`.ic`/`.k`/`.t`, `.insight-msg`, `.anomaly`, `.saving`/`.lbl`/`.v`, and the `bb-wrap`:

```html
                  <div class="insight-card" id="insightCard">
                    <div class="bb-wrap" aria-hidden="true">
                      <div class="bb-beam bb-beam-1"></div>
                      <div class="bb-beam bb-beam-2"></div>
                    </div>
                    <div class="insight-head">
                      <div class="ic">
                        <img src="./assets/icon-ai.svg" alt="AI" style="width:24px;height:24px" />
                      </div>
                      <div>
                        <div class="k">JUST NOW</div>
                        <div class="t">Best Match</div>
                      </div>
                    </div>
                    <div class="insight-msg" style="padding: 50px 4px 0px">
                      Luna Tacos is a 97% match for you — 3 friends saved it and a student deal is live right now
                    </div>
                    <div class="anomaly">
                      <i
                        ><svg viewBox="0 0 14 14" fill="currentColor"><path d="M7 1 L13 13 H1 Z M7 5v4 M7 11v.5" /></svg
                      ></i>
                      <span>Top match near you</span>
                    </div>
                    <div class="saving">
                      <div class="lbl">Student deal</div>
                      <div class="v">$9 <em>with ID</em></div>
                    </div>
                  </div>
                  <div class="stamp">02 — MATCH</div>
```

- [ ] **Step 4: Retarget the hardcoded count-up in `script.js`**

The `$2,400 / mo` value is generated in JS, not read from HTML. In `public/lumio/script.js`, in `triggerS3` (lines ~218–224) change:

```js
                const dur = 1400, startT = performance.now();
                function s3Count(now){
                  const t = Math.min(1, (now - startT) / dur);
                  const eased = 1 - Math.pow(1 - t, 3);
                  const val = Math.round(2400 * eased);
                  vEl.innerHTML = '$' + val.toLocaleString('en-US') + ' <em>/ mo</em>';
                  if (t < 1) requestAnimationFrame(s3Count);
                }
```
to (count to `9`, label "with ID" — same easing, duration, and animation):
```js
                const dur = 1400, startT = performance.now();
                function s3Count(now){
                  const t = Math.min(1, (now - startT) / dur);
                  const eased = 1 - Math.pow(1 - t, 3);
                  const val = Math.round(9 * eased);
                  vEl.innerHTML = '$' + val.toLocaleString('en-US') + ' <em>with ID</em>';
                  if (t < 1) requestAnimationFrame(s3Count);
                }
```

- [ ] **Step 5: Card C — "03 — LEVEL UP" progress chart**

Replace the runway head, chart badge, axis labels, and foot text (lines 477–562). **Keep the entire `<svg>` chart geometry untouched** (`.chart-line`, `.chart-dash`, `.chart-clip-rect`, `.chart-dot`, gradients, paths) — only text and the icon change. Replace lines 477–499 (runway-head):

```html
                    <div class="runway-head">
                      <div class="ic">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#B8472A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
                          <path d="M7 5H4v1a3 3 0 0 0 3 3 M17 5h3v1a3 3 0 0 1-3 3" />
                          <path d="M9 14.5h6 M10 19h4 M12 12.5V19" />
                        </svg>
                      </div>
                      <div>
                        <div class="k" style="font-size:10px;letter-spacing:.1em;font-weight:700;color:rgba(255,255,255,.75)">YOUR PROGRESS</div>
                        <div class="t" style="font-size:17px;letter-spacing:-0.04em;font-weight:500;color:#fff;margin-top:4px">XP to Local Champion</div>
                      </div>
                    </div>
```

Change the chart badge text (line 501) `RUNWAY IMPROVING +4 MO` → `2 VISITS TO LEVEL UP`.

Change the axis labels (line 554) from `JUL 01 / AUG 01 / OCT 01 / NOV 01` to:
```html
                        <span>VISIT 1</span><span>VISIT 2</span><span>VISIT 3</span><span>VISIT 4</span>
```

Change the runway foot (lines 557–560):
```html
                    <div class="runway-foot" style="margin: 20px 0px 0px">
                      <div class="v">Local Champion</div>
                      <div class="d">Next level · 250 XP to go</div>
                    </div>
```

Change the stamp (line 562) `03 — FORECAST` → `03 — LEVEL UP`.

- [ ] **Step 6: Recolor card chips, insight icon, anomaly pill, runway icon**

In `styles.css`:

`.conn` background (line 687): `background:rgba(97,147,221,0.2);` → `background:rgba(255,255,255,.14);` (warm glass on the food card bg).

Replace the three badge rules (lines 697–701) with cuisine-tinted badges that show the emoji:
```css
      .conn .badge.cuisine-1{background:#B8472A;font-size:30px}
      .conn .badge.cuisine-2{background:#C99A3B;font-size:30px}
      .conn .badge.cuisine-3{background:#8A3520;font-size:30px}
```

`.conn .live-pill` (line 705): `background:rgb(35,82,222);` → `background:rgba(255,255,255,.92);color:#B0461F;` and add `.tier-pill{font-family:var(--font-mono)}` directly after it:
```css
      .conn .live-pill{font-size:11px;letter-spacing:.08em;font-weight:700;padding:6px 9px;border-radius:100px;background:rgba(255,255,255,.92);color:#B0461F;white-space:nowrap;flex-shrink:0}
      .conn .live-pill.tier-pill{font-family:var(--font-mono)}
```

`.insight-head .ic` (line 776): `color:#2352DE` → `color:#B8472A`.

`.anomaly` (lines 781–787): change `background:#E62A2A;` → `background:#C99A3B;` and `.anomaly i{… color:#E62A2A …}` → `color:#C99A3B`. (Red alert → amber "top match".)

`.runway-head .ic svg` (line 806): `color:#2352DE` → it now has an inline `stroke="#B8472A"` (Step 5), so change this rule's `color:#2352DE` to `color:#B8472A` to be safe.

- [ ] **Step 7: Verify**

Scroll to section 3.
Expected: head reveals "From Craving to Your Table / *in a Few Taps*" with both corner labels animating in; Card A pops with three restaurant rows (🌮 Luna Tacos "S TIER", 🥐 Crumb "SSS+", ☕ Bean Theory "A TIER") each circle-revealing in sequence with traveling beam; Card B reveals the "Best Match" insight, the amber "Top match near you" pill, and the "$0 → $9 with ID" count-up; Card C circle-reveals, the trophy icon is ember, badge says "2 VISITS TO LEVEL UP", the white chart line draws left-to-right with the moving dot, foot reads "Local Champion / Next level · 250 XP to go". All three card backgrounds are still the old blue images (fixed next task).

- [ ] **Step 8: Commit**

```bash
git add public/lumio/index.html public/lumio/script.js public/lumio/styles.css
git commit -m "feat(landing): Discover/Match/Level-Up cards + ember recolor + retargeted count-up"
```

---

### Task 7: Section 03 — generate & wire food card backgrounds

Replace the three blue glass card backgrounds with generated warm food photography, and add a CSS scrim so the white card text stays legible regardless of the image.

**Files:**
- Create (overwrite): `public/lumio/assets/card-a-bg.png`, `card-b-bg.png`, `card-c-bg.png`
- Modify: `public/lumio/styles.css` `.card3.a/.b/.c` (`:680-682`)

- [ ] **Step 1: Generate the three images**

Use an available image-generation tool/skill (e.g. the `imagegen-frontend-web` skill, or `brandkit`) to produce three vertical images at ~**900×1040 px** (cards render ~470×552, `background:center/cover`), saved to the exact paths below. Prompts (warm, moody, dark-topped for white-text contrast, Palate ember/amber palette):

- `public/lumio/assets/card-a-bg.png` — "Overhead moody food photograph of vibrant street tacos (al pastor, lime, cilantro) on a dark charcoal slate, warm ember and amber lighting from one side, deep shadows in the upper third, rich reds and browns, cinematic, shallow depth of field, no text."
- `public/lumio/assets/card-b-bg.png` — "Moody close-up of a latte being poured with latte art on dark walnut wood, warm amber tones, soft steam, deep shadows up top, cozy cafe lighting, cinematic, no text."
- `public/lumio/assets/card-c-bg.png` — "Moody overhead of fresh pastries and a brown-butter cookie on a dark slate surface, warm golden-amber light, deep shadows in the upper third, editorial food styling, cinematic, no text."

**Fallback if no image tool is available:** instead of images, set CSS warm gradients (and skip Step 1's files): in `styles.css` set `.card3.a{background:linear-gradient(155deg,#B8472A,#6E2616)}`, `.card3.b{background:linear-gradient(155deg,#C99A3B,#7A5410)}`, `.card3.c{background:linear-gradient(155deg,#8A3520,#3A1410)}`. (Document in the commit message if the fallback was used.)

- [ ] **Step 2: Add a contrast scrim over each card image**

In `styles.css` replace lines 680–682:

```css
      .card3.a{background:url('./assets/card-a-bg.png') center/cover}
      .card3.b{background:url('./assets/card-b-bg.png') center/cover}
      .card3.c{background:url('./assets/card-c-bg.png') center/cover}
```
with (gradient scrim composited above the photo — darker at top where headings/insight text sit):
```css
      .card3.a{background:linear-gradient(180deg, rgba(42,20,16,.78) 0%, rgba(42,20,16,.32) 45%, rgba(42,20,16,.55) 100%), url('./assets/card-a-bg.png') center/cover}
      .card3.b{background:linear-gradient(180deg, rgba(42,20,16,.78) 0%, rgba(42,20,16,.32) 45%, rgba(42,20,16,.55) 100%), url('./assets/card-b-bg.png') center/cover}
      .card3.c{background:linear-gradient(180deg, rgba(42,20,16,.80) 0%, rgba(42,20,16,.40) 45%, rgba(42,20,16,.58) 100%), url('./assets/card-c-bg.png') center/cover}
```

- [ ] **Step 3: Verify**

Scroll to section 3.
Expected: the three cards now sit on warm food photography with a subtle dark scrim; all white text (kickers, names, insight message, chart labels, stamps) remains clearly legible; the chip/insight/chart reveal animations are unchanged.

- [ ] **Step 4: Commit**

```bash
git add public/lumio/assets/card-a-bg.png public/lumio/assets/card-b-bg.png public/lumio/assets/card-c-bg.png public/lumio/styles.css
git commit -m "feat(landing): warm food card backgrounds + contrast scrim"
```

---

### Task 8: Section 04 (Integrations → City) — copy + orbit + filters

Convert the "financial hub" integrations orbit into a "your city, ranked" cuisine orbit: relabel the eyebrow/headline, turn the integration logo tiles into warm cuisine tiles, set the orbit center to the Palate mark on ember, and rewrite the filter list to cuisines (preserving `data-grp`).

**Files:**
- Modify: `public/lumio/index.html` s4 (`:577-721`)
- Modify: `public/lumio/styles.css` `.tile.lumio` (`:894-906`), `.lumio-label` (`:914-921`)

- [ ] **Step 1: Orbit center tile → Palate mark on ember**

In `index.html`, replace the center tile + label (lines 582–588):

```html
                <div class="tile lumio g5" aria-hidden="true">
                  <img src="./assets/Vector-logo.png" alt="Lumio" style="width:60%;height:auto;object-fit:contain" />
                </div>
                <div class="lumio-label" aria-hidden="true">
                  <div class="n">Lumio</div>
                  <div class="k">40+ INTEGRATIONS</div>
                </div>
```
with:
```html
                <div class="tile lumio g5" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="46%" height="auto" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="#FBEDE7" stroke-width="2.4" />
                    <circle cx="12" cy="12" r="3.2" fill="#FBEDE7" />
                  </svg>
                </div>
                <div class="lumio-label" aria-hidden="true">
                  <div class="n">Palate</div>
                  <div class="k">1,200+ SPOTS</div>
                </div>
```

(Class `tile lumio g5` and `.lumio-label .n`/`.k` are kept — the s4 reveal animation targets them by those names.)

- [ ] **Step 2: Ring tiles → cuisine tiles (group A, shown)**

Replace the group-A ring tiles (lines 592–630) with warm cuisine tiles. Keep the `tile gN` classes and `data-group="a"` (the orbit spin + group toggle depend on `g1`…`g9` and `data-group`). The two `.empty` tiles become small dish photos (generated in Step 5) or, until then, emoji tiles:

```html
                  <div class="tile empty g1" data-group="a" style="background:#FBEDE7;font-size:34px">🍜</div>
                  <div class="tile g2" data-group="a" style="background:#B8472A;font-size:34px">🌮</div>
                  <div class="tile g3" data-group="a" style="background:#C99A3B;font-size:34px">☕</div>
                  <div class="tile g4" data-group="a" style="background:#8A3520;font-size:34px">🍕</div>
                  <div class="tile g6" data-group="a" style="background:#346538;font-size:34px">🥗</div>
                  <div class="tile g7" data-group="a" style="background:#B0461F;font-size:34px">🍣</div>
                  <div class="tile g8" data-group="a" style="background:#8A5A00;font-size:34px">🍔</div>
                  <div class="tile empty g9" data-group="a" style="background:#FBF3DB;font-size:34px">🥐</div>
```

- [ ] **Step 3: Ring tiles → cuisine tiles (group B, hidden alternate)**

Replace the group-B tiles (lines 633–684) with a second cuisine set. Keep `tile gN data-group="b"` and `style="…display:none…"`:

```html
                  <div class="tile g1" data-group="b" style="background:#6E2616;display:none;font-size:34px">🍩</div>
                  <div class="tile g2" data-group="b" style="background:#C99A3B;display:none;font-size:34px">🍗</div>
                  <div class="tile g3" data-group="b" style="background:#346538;display:none;font-size:34px">🥦</div>
                  <div class="tile g4" data-group="b" style="background:#B8472A;display:none;font-size:34px">🍝</div>
                  <div class="tile g6" data-group="b" style="background:#8A5A00;display:none;font-size:34px">🧇</div>
                  <div class="tile g7" data-group="b" style="background:#B0461F;display:none;font-size:34px">🍱</div>
                  <div class="tile g8" data-group="b" style="background:#7A5410;display:none;font-size:34px">🧋</div>
                  <div class="tile g9" data-group="b" style="background:#8A3520;display:none;font-size:34px">🌯</div>
```

- [ ] **Step 4: Filters, bottom headline, int-pill, sync-stamp**

Replace the filter list (lines 688–695) — keep `data-grp` (exactly one `b` to preserve the A/B toggle demo) and the `active` default:

```html
              <div class="filter-list" id="filters">
                <button class="active" data-grp="a">Tacos</button>
                <button data-grp="a">Coffee</button>
                <button data-grp="b">Late night</button>
                <button data-grp="a">Pizza</button>
                <button data-grp="a">Brunch</button>
                <button data-grp="a">Dessert</button>
              </div>
```

Replace the s4 bottom headline (lines 697–700):
```html
              <div class="s4-bottom">
                <div class="eyebrow"><span class="sq"></span>YOUR CITY, RANKED</div>
                <h2>Every Spot Worth Knowing,<br /><span class="it">Ranked in Minutes</span></h2>
              </div>
```

Replace the int-pill meta (lines 714–717):
```html
                <div class="meta">
                  <div class="t">Open now</div>
                  <div class="s">24 SPOTS NEARBY</div>
                </div>
```

Replace the sync-stamp (line 720): `SYNC STARTS INSTANTLY` → `RANKINGS UPDATE LIVE`.

- [ ] **Step 5: (Optional, "imagery") dish photos for the two `.empty` tiles**

If using real imagery for the empty tiles, generate two ~**320×360 px** square-ish dish photos and reference them instead of the emoji on `g1`/`g9` (group A):
- `public/lumio/assets/orbit-food-1.png` — "Bowl of ramen, top-down, warm tones, dark background, no text."
- `public/lumio/assets/orbit-food-2.png` — "Golden croissant on dark slate, warm light, no text."
Then set those two tiles to `style="background:url('./assets/orbit-food-1.png') center/cover"` (drop the emoji text node). Leave the rest as color+emoji tiles.

- [ ] **Step 6: Recolor the center tile background**

In `styles.css`, in `.tile.lumio` (lines 894–906) change:
```css
        background:url('./assets/lumio-tile.png') center/cover;
        box-shadow:inset 0 0 13.3px rgba(255,255,255,.6), 0 24px 44px rgba(8,23,79,.20);
```
to:
```css
        background:linear-gradient(155deg,#B8472A,#7A2E18);
        box-shadow:inset 0 0 13.3px rgba(255,255,255,.45), 0 24px 44px rgba(58,26,16,.22);
```

- [ ] **Step 7: Verify**

Scroll to section 4.
Expected: the Palate plate mark sits at the orbit center on an ember tile labeled "Palate / 1,200+ SPOTS"; eight warm cuisine emoji tiles spiral/pop in and orbit; the headline reveals "Every Spot Worth Knowing, / *Ranked in Minutes*"; the filter wheel spins and the cuisine names scroll; clicking "Late night" swaps the orbit to the group-B cuisine set (pop-in); the int-pill pops ("Open now / 24 SPOTS NEARBY") and "RANKINGS UPDATE LIVE" fades in.

- [ ] **Step 8: Commit**

```bash
git add public/lumio/index.html public/lumio/styles.css public/lumio/assets/orbit-food-1.png public/lumio/assets/orbit-food-2.png
git commit -m "feat(landing): cuisine orbit + city-ranked copy + Palate center mark"
```

(Drop the two asset paths from the `git add` if Step 5 was skipped.)

---

### Task 9: Global recolor sweep + content guardrails

Catch every remaining cool-tone hex/rgba and any leftover fintech copy that the targeted edits missed.

**Files:** `public/lumio/styles.css`, `public/lumio/index.html`, `public/lumio/script.js`

- [ ] **Step 1: Find leftover cool-tone colors**

Run:
```bash
grep -niE "#18498B|#2352DE|#3372D9|#2552DE|#072049|#635BFF|#8669B9|#0E0A07|#1AB4D7|#4A154B|#0F1A2A|#2CA01C|#F5614A|#0B2545|#0F2A1F|#0E3B2E|#F2EB16|#163300|#FF5000|#117ACA|#9FE870|#E62A2A|97,147,221|61,98,147|8,23,79|74,130,208|140,180,235|24,73,139|35,82,222|134,105,185|37,91,243|14,10,7" public/lumio/styles.css public/lumio/index.html
```
Expected after fixes: **no matches.** For each hit, apply the Global color find/replace map at the top of this plan (e.g. any stray `14,10,7` → `42,42,40`, any `#0E0A07` → `#2A2A28`, any blue → `#B8472A`, violet → `#C99A3B`). The `.stripes` rule (styles.css ~494–510) is dead (no `.stripes` element) — recolor its gradient to `linear-gradient(90deg,#8A3520,#B8472A,#C99A3B)` or delete the rule.

- [ ] **Step 2: Find leftover fintech copy**

Run:
```bash
grep -niE "lumio|stripe|quickbooks|mercury|runway|MRP|NRR|CFO|spreadsheet|SaaS|revenue|AWS|cash|bank|payroll|integration" public/lumio/index.html public/lumio/script.js
```
Expected: **0** for the standalone words `lumio|stripe|quickbooks|mercury|runway|mrp|nrr|cfo|aws|saas|revenue`. Any remaining hit is a missed spot from Tasks 2–8 — fix it. (Alt text and `data-*` are fine to be foodie.)

- [ ] **Step 3: Confirm all animation hooks survived**

Run:
```bash
grep -cE "data-count|sub-line|class=\"kpi|kpi .val|insightCard|chart-line|orbit-ring|data-group|data-grp|class=\"conn|class=\"stamp|lumio-label" public/lumio/index.html
```
Expected: a healthy non-zero count (the hooks are all still present). Spot-check that `data-count` (×2), `#insightCard` (×1), `.chart-line` (×1), `g1`…`g9`, `data-group="a"/"b"`, and `data-grp` all still appear.

- [ ] **Step 4: Verify the full page**

Reload `/lumio/index.html`; do a full wheel scroll through all four sections, then click a filter cuisine.
Expected: zero blue/violet anywhere; the whole page reads warm ember/amber/bone; every animation from Task 0's baseline still plays (intro, count-ups, curtain, card reveals, chart draw, orbit spin, filter wheel, group toggle).

- [ ] **Step 5: Commit**

```bash
git add public/lumio/
git commit -m "fix(landing): sweep remaining cool-tone colors + fintech copy"
```

---

### Task 10: Build + in-app verification + finish

**Files:** none (build/verify only)

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: build succeeds (the `postcss.config.mjs` gotcha is already neutralized by `vite.config.ts`; `public/lumio/` is copied verbatim into `dist/lumio/`). Confirm `dist/lumio/index.html` exists and contains "Palate".

Run: `grep -c "Palate" dist/lumio/index.html`
Expected: non-zero.

- [ ] **Step 2: Verify inside the app shell**

Run: `npm run preview` (or `npm run dev`), open `/` (the app root).
Expected: `src/screens/Landing.tsx` renders the re-skinned landing in its full-screen iframe; the "Start Discovering" / "Get Started" CTAs route into the app (`#/onboarding`), and "Sign In" routes to `#/discover` — confirm by clicking each.

- [ ] **Step 3: Responsive spot-check**

Resize the browser to a narrow width (≤900px) and reload `/lumio/index.html`.
Expected: the page switches to natural-scroll (no fullpage wheel hijack); the hamburger drawer opens; sections stack and their enter-animations fire on scroll; colors/copy are the foodie palette throughout.

- [ ] **Step 4: Final reduced-motion check**

In the browser/OS, enable "reduce motion", reload `/lumio/index.html`.
Expected: content is fully visible and legible (animations collapse to ~instant per the existing `@media (prefers-reduced-motion: reduce)` rule) — no blank/stuck sections.

- [ ] **Step 5: Final commit / wrap-up**

```bash
git add -A
git commit -m "chore(landing): build verification for foodie re-skin" --allow-empty
```

Then hand off via superpowers:finishing-a-development-branch (merge / PR / cleanup).

---

## Self-review notes (author checklist, already applied)

- **Spec coverage:** foodie theme ✔ (copy rewrite across nav, hero, s2, s3, s4 — Tasks 2,3,4,5,6,8); Palate palette ✔ (Tasks 1, 3–9 + global map); same animations ✔ (invariants list + per-task "keep" notes; the only `script.js` edit is a count-up *value*, not motion); "full redesign with imagery" ✔ (Task 7 card photos, Task 8 center mark + optional orbit photos, video warm-tint Task 3); "Consumer Discover feed" hero mock ✔ (Task 4); "tint video warm" ✔ (Task 3 Step 3).
- **Placeholder scan:** every code step shows the actual old→new snippet; asset steps give exact prompts, dimensions, paths, and a concrete CSS fallback.
- **Type/name consistency:** class/id hooks (`.kpi .val`, `#insightCard`, `.chart-line`, `g1`…`g9`, `data-group`, `data-grp`, `.lumio-label .n/.k`, `.live-pill`, `.conn`) are preserved verbatim across tasks; the s2 stat `.violet`/`.blue` class names are intentionally kept (JS targets them) even though they now render amber/ember.
- **Known approximations:** the warm video tint is a CSS filter approximation of the blue glass footage; the orbit/empty tiles default to emoji unless the optional dish photos (Task 8 Step 5) are generated. Both are called out at their step.
