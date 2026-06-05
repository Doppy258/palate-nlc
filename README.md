# Palate

A gamified social restaurant-discovery app. Discover local spots, rank them into tiers, settle them head to head, collect visit stamps, complete food quests, earn XP, and unlock local deals. Restaurants get a business dashboard with live analytics.

Beli meets a foodie rewards game, built as a premium, minimal, light-mode mobile web app.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL. The app presents as a phone on desktop and fills the screen on mobile. Progress saves to your browser (localStorage), so the gamification is live during a demo. Use **Reset demo data** at the bottom of Profile to start the story over.

```bash
npm run build     # static production build into dist/
npm run preview   # serve the production build
npm test          # core ranking / match / XP invariants
```

The build is fully static (relative asset paths), so `dist/` deploys as-is to GitHub Pages, Vercel, or Netlify. Routing is hash-based, so deep links and refreshes work on any static host.

## Demo script (the two-minute story)

1. **Discover.** Open Filters and pick `Under $15`, `Open now`, `Has active deal`, `Friends saved`. Best Match surfaces **Luna Tacos** first: S community tier, 4.7, three friends saved it, a student deal, and tags that match your taste.
2. **Save** Luna Tacos to Want to Try (+5 XP).
3. Open it, tap **Check in with code**, confirm you are dining there, and enter `TACO910`. You collect a stamp (+25 XP) and unlock reviews and coupons.
4. **Leave a verified review** (+30 XP) and **redeem** the deal (+30 XP).
5. Go to **Rank**, pick a winner in a head-to-head, and watch a restaurant move up a tier (+10 XP).
6. The stamp, review, comparison, and redemption push Lucas past 750 XP, so he **levels up to Local Champion**. Check **Passport** for stamp progress, quest progress, and the XP bar.
7. Switch to **Profile then Business view** to see Luna Tacos analytics update, then **publish a new deal** and find it back on Discover instantly.

Every check-in code is shown as a demo hint inside the check-in sheet (for example `BEAN247`, `CRUMB55`).

## How requirements map

| Requirement | In Palate |
| --- | --- |
| Sorting by category | Cuisine and meal filters, eight sort modes |
| Reviews and ratings | Verified reviews, 5-star ratings, 10-point Bites |
| Sorting by reviews or ratings | Highest rated, most reviewed, highest community tier |
| Saving and bookmarking | Want to Try, tier lists |
| Deals and coupons | Coupons, student rates, stamp rewards, slow-hour drops |
| Verification step | Human confirm plus restaurant check-in code |
| Helps local businesses | Drives visits, reviews, redemptions; owner dashboard |

## What is real, not faked

The scores are computed, not hard-coded:

- **Best Match** blends `0.30 rating + 0.25 friend activity + 0.20 tag match + 0.15 deal value + 0.10 distance`.
- **Community Restaurant Score** blends `0.40 head-to-head wins + 0.25 rating + 0.20 verified reviews + 0.15 saves`, normalized across the set and bucketed into SSS+ / S / A / B / C.
- **Head-to-head** nudges personal scores and re-buckets your tier list.
- **XP, levels, quests, and badges** all evaluate against live state.

See `src/lib/`. All data is mock-seeded in `src/data/seed.ts`.

## Tech

React + TypeScript + Vite, Tailwind v4, Zustand (persisted), Motion, Phosphor icons, self-hosted Geist and Geist Mono. Analytics figures on the business dashboard are sample data.
