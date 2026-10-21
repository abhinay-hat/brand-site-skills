---
name: site-builder
description: Design and build a landing or coming-soon site from a locked brand (DESIGN.md). Asks what the owner wants before building, studies their reference sites and Behance, shows live hero options, then builds a light, clear, anti-AI-look page and verifies it on a real server at three widths.
when_to_use: Use when asked to build, redesign or "make better" a landing page, homepage or coming-soon site for a brand that already has a DESIGN.md (run brand-builder first if it does not).
argument-hint: "[site folder]"
---

# Site builder

Rebuilding a page blind wastes rounds. This skill asks first, shows options second, builds third, and proves it works last.

## Before you start

1. Read `DESIGN.md` (brand), `PRODUCT.md` (business logic: what, who, stages, geography) and any voice-of-customer notes. Copy must match them. Never present a future feature as live.
2. Load and follow, in DURING mode: `antislop`, `antislop-ui`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile`, plus `frontend-design` and `copywriting` if installed. Announce the antislop mode once.
3. Back up the current page before replacing it.

## Step 1. Ask before building

Research before asking: read `DESIGN.md`, the current site (screenshot it), the product brief (`brand/research/brief.md` if brand-builder ran) and 3 to 4 competitor sites. Note who visits, what they must do on the page (enrol, book a call, buy), and what the current page gets wrong.

Then ask 3 to 4 questions with the question tool, written for this site from that research. Never a stock list:
- What feels wrong today, with options taken from the problems you found (multi-select).
- The first-3-seconds feeling, with options that fit this buyer and category.
- The one action a visitor must take, if research left it unclear.
- 1 to 3 real sites they love, as URLs. Offer sites relevant to their category as options and ask for URLs in "Other".

Skip anything research already answered.

If the owner later says "I don't like it", do not guess again: ask these questions again, and ask them to circle the part they dislike.

## Step 2. References

- Screenshot each site the owner names (`playwright-cli open <url>`, resize 1320 x 900, screenshot the first 3 to 4 screens) and write down the method: background, hero object, type scale, how product is shown, motion.
- Behance via the `behance` MCP: search the kind of site (for example "data platform landing page", "hero section 3d object", "coming soon minimal"), field `"Web Design"` or `"UI/UX"`, sort by appreciations. Fetch cover images by URL; read them.
- The pattern that has worked: one strong object in the hero (a product, a 3D scene, the brand mark), not a collage of cards.

## Step 3. Options before the full build

1. Build `site/options/index.html`: 3 to 5 complete hero directions in the brand, each from a different reference family (for example dark radar, giant type, product-first, photographic, 3D). Label each with its references and an honest risk.
2. After the owner picks, if the hero visual is the problem, build `site/options/hero.html`: the same copy with 3 one-object visuals. Let them pick again.
3. Only then build the full page.

## Step 4. Build

- Declare the Design Read and dials (ENERGY / RHYTHM / MOTION) before writing.
- Structure from content: hero (headline, one-line lede, the main form), the ways to use the product (different weights, not identical cards), how it works (real sequence only), closing call to action. Separate calls to action per audience when there are several (for example "Book a demo for my team" and "Ask for a land report").
- Every number is real or labelled "sample". No testimonials, logos or claims without evidence.
- One accent colour with one meaning. No gradient on text. Light theme unless the brand says otherwise.
- One orchestrated motion moment on load; reveals only when in view; everything still under `prefers-reduced-motion`.
- Skip link that becomes visible on focus, visible focus rings, 44 px minimum tap targets, labelled form with empty, invalid, sending, success and error states.

## Step 5. Verify (never skip)

Run `scripts/check-site.mjs <url>` against the real server (for example `wrangler dev`), not a file URL. It reports, at 1320, 900 and 390 px: horizontal overflow, console errors, anchors without targets, tap targets under 44 px, and takes screenshots. Then:
- Click through the form (empty, invalid, valid) and delete any test signup from the local database.
- Check every colour pair with a contrast script; text 4.5:1, borders and bars 3:1.
- Look at every screenshot yourself. Fix overlaps, hidden text, and anything sitting behind text.
- Report a PASS/FAIL list with evidence. Say plainly what was not tested.

## Bugs seen before

- An inline `<svg>` with only a width defaults to 150 px tall and pushes the nav down. Always set width and height.
- CSS 3D boxes need all four walls (front, back, left, right) plus the top, or they render as flat slabs from some angles.
- `fill="var(--x)"` on SVG elements is unreliable; use `style="fill:var(--x)"`.
- Parallel `behance_download` calls share one browser and fail; call it one at a time or use cover URLs.
- Absolute-positioned hero cards overlap at in-between widths; give each a z-index and test at 900 px.
- Large decorative type behind the hero can sit behind the form; move it or hide it on small screens.

## Done means

- [ ] Owner chose the direction and the hero visual.
- [ ] Page matches DESIGN.md and PRODUCT.md; no fabricated content.
- [ ] check-site passes at three widths; form click-through passes; contrast passes.
- [ ] Not deployed, not committed, and indexing left off unless the owner asks.
