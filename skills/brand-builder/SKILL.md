---
name: brand-builder
description: Build a brand identity with the owner, from taste test to locked logo kit. Researches the product, buyer and category first, runs a taste test written for that brand, gathers references from Behance (and a saved-reels vault if present), iterates logo, wordmark, colour and tagline options as live HTML boards, then locks the mark and exports an SVG/PNG kit plus DESIGN.md.
when_to_use: Use when asked to design a logo, create a brand or brand identity, pick brand colours, fonts or a tagline, or "make the branding". Not for building the website itself (use site-builder after this).
argument-hint: "[brand name] [project folder]"
---

# Brand builder

A brand comes from the owner's taste, not from the agent's defaults. This skill gets that taste out of the owner first, then lets them pick by eye from options they can see. Every round is a real HTML board opened in their browser.

## Before you start

1. Read the project's business logic (`PRODUCT.md`, `README.md` or equivalent). If there is none, ask for: what it is, who buys it, the one thing a buyer should remember. Write it down before designing anything.
2. If a design system already exists (`DESIGN.md`, `brand/DESIGN.md`, a kit folder), read it and ask whether to evolve it or replace it. Never silently create a second design system.
3. Load the anti-AI-look skills if installed: `antislop`, `antislop-ui`, `antislop-copywriting`, `antislop-human`. Announce the mode once.
4. Output goes to `brand/logo/` (option boards) and `brand/kit/` (final files). Keep old systems in `brand/archive-<name>/`, never delete them.

## Step 1. Research first, then a taste test written for this brand

Do the homework before asking anything. Questions the agent could have answered itself waste the owner's patience, and a fixed question list gives every brand the same answers.

**1a. Research (no questions yet).** Write `brand/research/brief.md` with:
- The product: what it sells, price band, how it is bought (walk-in, app, sales call, enrolment).
- The buyer: who decides, who pays, their age, city, language, what they fear and want. Read the live site, reviews (Google, Justdial, app stores), social pages and any `PRODUCT.md`.
- The category: 4 to 6 real competitors, with how each looks (colour, mark type, tone) and the visual clichés the category is stuck in (for example every IT institute uses blue, a graduation cap and a laptop).
- The existing brand, if any: what is already recognised and worth keeping, what is weak.
- Gaps: only what research could not answer.

**1b. Taste test, generated per brand.** Never reuse a stock list of questions; write new ones from the brief every time. Ask 6 to 8 indirect questions with the question tool, in two rounds of 3 to 4.
- Every option is a real, concrete thing from the buyer's or owner's world (for a coaching institute: classrooms, notebooks, mentors, phones students carry; for a coffee brand: cafés, cups, mornings), local to their country and city. Not design terms.
- Each question tests one axis that is still open after research, for example: premium vs approachable, heritage vs new, calm vs energetic, warm vs cool, dense vs airy, local vs global. Name the axis in your notes, not on the question.
- Include 1 or 2 questions about the category clichés from 1a ("which of these feels most like you" with real competitor-style examples) so the owner says what to break away from.
- When evolving an existing brand, ask first which parts to keep (mark, colour, type, tagline, tone), and spend the taste test only on the parts that will change.
- Skip any question the research already answered. If the owner rejects a round of questions, change the questions; do not re-ask the same ones in new words.

Translate the answers into a 4-row profile table (axis, the owner's pick, what it means for the mark, what it means for colour and type), backed by the brief. Show it to the owner before round 1 of logos.

## Step 2. References

Collect real references, study the method, never copy a mark or layout.

- **Behance** (the `behance` MCP in this repo): `behance_search` with `field: "Branding"` or `"Logo Design"`, `sort: "appreciations"`, 2 to 4 search terms, limit 10 to 15. Prefer the cover image URLs from search results (CDN, plain download) over `behance_download`, which drives one browser and fails if called in parallel. Convert `.webp` to JPG (`sips -s format jpeg -Z 900` on macOS) before reading images.
- **Saved reels / bookmarks vault** if the project has one: search it for branding, typography, colour and logo-process reels and cite the useful ones.
- Write `brand/references/analysis.md`: per reference, the palette, type, structure, why it works, what to borrow as method, and a 1 to 5 fit score.

## Step 3. Logo rounds

Each round is one HTML board in `brand/logo/round-N.html`, screenshotted to check it, then opened for the owner.

- 4 to 8 marks per round, built from the taste profile. Show each one big, as a lockup with the wordmark, as an app icon, and at real 16, 24 and 32 px on light and dark.
- Give every option a one-line story: what each part means for the product.
- Be honest about weaknesses on the board (for example "at 16 px this reads as a menu icon"). The owner trusts honest critique.
- Ask with a multi-select question; let the owner pick several or type a mix. Next round: refine and combine their picks (for example "shape from A, colour from B"). Expect 3 to 6 rounds.
- Wordmark (2 to 4 fonts in the chosen family), colour (3 to 4 ways of the chosen palette) and tagline (6 options that cover what the product actually does) go on the same boards from round 2 on.
- When the owner asks "which is best", answer with one pick and the reason, then the story of the mark part by part.

Rules for options:
- Free-licence fonts only. Avoid default AI fonts as the primary choice (Inter, Geist, Space Grotesk, Poppins) unless the owner asks.
- A gradient or accent colour gets one meaning (for example "what is coming") and stays on one part of the mark.
- Check every colour pair with a contrast script; text needs 4.5:1, graphics 3:1.

## Step 4. Lock and export

1. Fix the geometry in a small unit grid (for example 29 x 32) and write it down part by part.
2. Write the SVGs by script (see `scripts/make-kit.py` for the pattern): mark, mark on dark, one-colour versions, app icon, favicon, lockups with and without tagline, link-preview image.
3. Render PNGs with a real browser so the font loads (`scripts/render-kit.mjs`): app icon 1024/512/180, favicon 16/32/48, lockups @2x, link preview 1200 x 630. Look at the PNGs before reporting.
4. Write `DESIGN.md` at the project root: product context, the mark (geometry table and story), wordmark, taglines, colour tokens with contrast ratios, type, shape, motion, files, open items, decisions log. Write `brand/kit/README.md` listing every file and its use.
5. Archive any earlier system, and leave a one-line pointer where the old `DESIGN.md` was.

## Step 5. Before calling it done

- [ ] Owner picked every element (mark, wordmark, colour, tagline); nothing locked by the agent alone.
- [ ] Mark legible at 16 px; one-colour versions work.
- [ ] All colour pairs checked with a script, not by eye.
- [ ] PNGs rendered with the real font and looked at.
- [ ] Open items listed: trademark search for name and mark before public use, a human designer to refine geometry and outline the wordmark, any missing script or language support.
- [ ] Nothing published or committed without the owner asking.
