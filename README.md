# brand-site-skills

Two Claude Code skills that turn a brand idea into a locked identity and a working site, plus the Behance research MCP server they use.

| Skill | What it does |
|---|---|
| `brand-builder` | Taste test → Behance and saved-reel references → logo, wordmark, colour and tagline rounds as live HTML boards → locked mark → SVG/PNG kit + `DESIGN.md` |
| `site-builder` | Asks what the owner wants → studies their reference sites and Behance → live hero options → builds a light, anti-AI-look page from `DESIGN.md` → verifies on a real server at 1320 / 900 / 390 px |

Run them in order: `brand-builder`, then `site-builder`.

## Install

```sh
git clone <this repo> ~/brand-site-skills
cd ~/brand-site-skills && npm install          # playwright-core for the scripts
ln -s ~/brand-site-skills/skills/brand-builder ~/.claude/skills/brand-builder
ln -s ~/brand-site-skills/skills/site-builder  ~/.claude/skills/site-builder
```

Behance MCP (needs Node 18+ and Google Chrome):

```sh
cd ~/brand-site-skills/mcp/behance && npm install
claude mcp add -s user behance -- node ~/brand-site-skills/mcp/behance/server.mjs
# optional, for exact stats and field/sort filters (paid Apify actor, about $0.004 per result):
claude mcp add -s user behance -e APIFY_TOKEN=<your token> -- node ~/brand-site-skills/mcp/behance/server.mjs
```

The server opens a visible Chrome window because Behance blocks headless browsers. It is read-only and spaces requests out.

## Scripts

| Script | Use |
|---|---|
| `skills/brand-builder/scripts/make-kit.py <svg-dir>` | Write the full SVG kit from one mark definition (edit the CONFIG block) |
| `skills/brand-builder/scripts/render-kit.mjs <svg-dir> <png-dir> [font]` | Render PNGs with the real web font |
| `skills/site-builder/scripts/check-site.mjs <url> [dir]` | Overflow, console errors, dead anchors and tap targets at three widths, with screenshots; exits 1 on failure |

## Works best with

`antislop` (core, ui, copywriting, human, layoutmobile), `frontend-design`, `copywriting`, `playwright-cli`. The skills load them if installed.

## Rules the skills keep

- The owner picks; the agent proposes and is honest about weak options.
- References are studied for method, never copied.
- No invented numbers, testimonials or claims; sample data is labelled.
- Contrast checked by script; mobile checked at real widths.
- Nothing is published, deployed or committed without the owner asking.
