# ShadowBoosting.co — Brand & Product Context

Reference doc for any marketing/design/CRO skill working on this repo. Everything below reflects what's actually implemented in the codebase as of 2026-08-06 — not aspirational, not invented. If a skill needs a color, font, or voice example, use this instead of guessing.

## Product

Game-boosting service marketplace: customers pay boosters to level up characters, push ranks, farm currency/gear, or clear campaign content across 14 supported games (Escape From Tarkov, Fortnite, Diablo IV, Path of Exile 2, Arc Raiders, Black Desert Online, World of Warcraft, Dune Awakening, PUBG Mobile, Marvel Rivals, Elder Scrolls Online, SWTOR, Arena Breakout, League of Legends). Also runs a companion blog (guides/updates/playthroughs) and an application pipeline for boosters and content creators.

**Prices and product catalog are currently placeholder/fictional** — no real payment processing is live yet. Don't do pricing-strategy work or treat displayed prices as real business data until told otherwise.

## ICP

Players who want a specific in-game outcome (rank, level, item, achievement) without spending the hours it normally takes, and who are anxious about account safety when handing that over to a stranger. The single biggest objection to address in any copy or flow is **"will this get my account banned/flagged."**

## Visual Identity

### Color palette

| Token | Hex | Usage |
|---|---|---|
| `--gold` | `#f5c518` | Primary accent — CTAs, prices, active states, "Guide"/"News" content category |
| `--violet` | `#9333ea` | Secondary accent — "Update"/"Playthrough" content category, decorative glows |
| `--bg` | `#0a0a0a` | Page background |
| `--bg-card` | `#111111` | Card/panel surfaces |
| `--bg-elevated` | `#1a1a1a` | Inputs, hover surfaces, lightest dark tone |
| `--border` | `#222222` | Default borders |
| `--border-hover` | `#333333` | Hover borders |
| `--text` | `#ffffff` | Primary text |
| `--text-muted` | `#8a8a8a` | Secondary text |
| `--text-dim` | `#7a7a7a` | Tertiary/caption text |
| success | `#4caf50` | Confirmations, positive states (100+ uses across the app — established de facto standard) |
| error | `#ff6666` | Errors, destructive actions, required-field indicators (same — established standard) |

Dark-mode-only site. No light theme exists. Gold/violet is the full accent vocabulary — don't introduce a third accent color without a real reason.

### Typography

- **Headings, buttons, labels, nav**: Chakra Petch (`--font-montserrat` CSS var — historical name, actual font is Chakra Petch), weights 500/600/700. Distinctive, slightly technical/gaming feel.
- **Body copy**: Plus Jakarta Sans (`--font-inter` CSS var — same historical naming), weights 400/500/600/700.
- Never use weight 800 — the pairing's practical ceiling is 700 (checked and reduced from 800 sitewide in a prior pass).

### Logo

**Wordmark only — no symbol/icon mark exists.** Rendered as text: "ShadowBoosting.co" in gold (`--gold`), Chakra Petch, weight 700. Tagline: "Forge Your Power in the Shadows" (used in footer and homepage hero, styled as `--text-dim` caption text). Do not fabricate a logo graphic/icon if one is needed — flag it as a real gap for the site owner instead.

### Iconography

Two custom SVG icon systems exist, both hand-built (no icon library dependency for these):

1. **Blog cover art** (`public/blog/covers/*.svg`) — 700×400 gradient cards with a category-coded corner badge icon: compass (Guide), sparkle/star-burst (Update), megaphone (News), gamepad (Playthrough). Accent color follows category: gold for Guide/News, violet for Update/Playthrough.
2. **Service category icons** — category-aware icons on service cards (leveling, rank, farm, battlepass, gear, quest, pvp, achievement, coach, account, etc.) instead of one repeated generic icon.

New iconography should match this hand-drawn line-art style, not swap in a generic icon font/library without checking first.

### Motion

`framer-motion` for scroll-reveals and expand/collapse (`Reveal` component, `AnimatePresence`), `countup.js` for animated stat numbers, `canvas-confetti` for reward moments (referral bonus, order placed), `nprogress` for route-transition loading bar, `react-parallax-tilt` on game/service cards. Motion is used for delight and hierarchy signaling, not as decoration — every current use ties to a real state change (data loaded, action succeeded, page navigating).

## Voice & Tone

Established through direct copywriting work on hero, FAQ, and error copy — not a formal doc until now, but consistent in practice:

- **Direct, confident, no exclamation marks.** ("Browse Boosts" not "Browse Boosts!")
- **Benefit-led over feature-led.** Example (homepage subheadline): *"Vetted boosters, VPN-protected sessions, and live order tracking — so your account stays exactly as safe as it should."*
- **Safety-first framing wherever trust is the objection.** The homepage FAQ, hero subheadline, and trust badges all lead with account-safety language before speed/price.
- **Never fabricate stats, testimonials, or reviews.** Every number and quote on the site (trust score, testimonial cards, "X completed orders") is pulled from real aggregate DB data — this is a hard rule from prior work, not a style preference.
- **Error messages are specific, not generic.** ("Discord tag is required" not "Invalid input" — see `src/components/ApplicationForm.js` for the established pattern.)
- CTA copy is value-specific: `"$X — Buy Now"` not `"Submit"`; `"Browse Games"` not `"Continue"`.

## Known gaps (real, not filled in — don't fabricate to close these)

- No logo icon/symbol mark, only a text wordmark.
- No social media profiles/links exist yet (`sameAs` intentionally omitted from Organization schema for this reason).
- No real payment processor integration (prices are placeholder).
- No analytics yet wired to a real GA4 property (infrastructure exists in `src/lib/analytics.js`, inactive until `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set).
