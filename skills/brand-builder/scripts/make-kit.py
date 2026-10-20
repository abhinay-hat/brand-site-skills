#!/usr/bin/env python3
"""Write a logo kit as SVG files from one mark definition.

Edit the CONFIG block for a new brand, then run:
    python3 make-kit.py <output-svg-dir>
Then render PNGs with render-kit.mjs.

The example mark is three bars and a dot on a 29 x 32 grid: the top bar takes the
accent gradient, the rest takes the body colour. Replace `mark()` for another shape.
"""
import os
import sys

# ---- CONFIG -----------------------------------------------------------------
NAME = "Brand"
BODY = "#0B1F3A"          # main colour (mark body, wordmark)
ON_DARK = "#FFFFFF"       # body colour on dark backgrounds
ACCENT_FLAT = "#D94F00"   # one-colour accent version
GRAD = ("#D94F00", "#FFB703")  # accent gradient, used on one part only
FONT = "Sora, sans-serif"
TAGLINE_SHORT = "Short tagline."
TAGLINE_LONG = "Longer tagline for heroes."
TAGLINE_COLOR_LIGHT, TAGLINE_COLOR_DARK = "#4A5468", "#AEBBCD"
# -----------------------------------------------------------------------------

GRAD_DEF = (f'<linearGradient id="g" x1="0" y1="1" x2="1" y2="0">'
            f'<stop offset="0" stop-color="{GRAD[0]}"/><stop offset="1" stop-color="{GRAD[1]}"/></linearGradient>')


def mark(tx, ty, scale, body, accent):
    """The mark in a 29 x 32 box, translated and scaled."""
    return (f'<g transform="translate({tx} {ty}) scale({scale})">'
            f'<rect x="0" y="0" width="29" height="8" rx="1" fill="{accent}"/>'
            f'<g fill="{body}"><rect x="0" y="12" width="14" height="8" rx="1"/>'
            f'<circle cx="25" cy="16" r="4"/><rect x="0" y="24" width="29" height="8" rx="1"/></g></g>')


def svg(w, h, inner, bg=None, rx=0, defs=True):
    back = f'<rect width="{w}" height="{h}" rx="{rx}" fill="{bg}"/>' if bg else ""
    d = f"<defs>{GRAD_DEF}</defs>" if defs else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{d}{back}{inner}</svg>\n'


def lockup(fg, tag=None, tag_color=None, bg=None):
    w, h = 400, (140 if tag else 112)
    text = (f'<text x="96" y="70" font-family="{FONT}" font-weight="700" font-size="56" '
            f'letter-spacing="-2.4" fill="{fg}">{NAME}</text>')
    if tag:
        text += (f'<text x="98" y="106" font-family="{FONT}" font-weight="500" font-size="19" '
                 f'fill="{tag_color}">{tag}</text>')
    return svg(w, h, mark(20, 20 if tag else 24, 2.2, fg, "url(#g)") + text, bg=bg)


def main(out):
    os.makedirs(out, exist_ok=True)
    acc = "url(#g)"
    files = {
        "mark.svg": svg(37, 40, mark(4, 4, 1, BODY, acc)),
        "mark-on-dark.svg": svg(37, 40, mark(4, 4, 1, ON_DARK, acc), bg=BODY),
        "mark-mono-dark.svg": svg(37, 40, mark(4, 4, 1, BODY, BODY), defs=False),
        "mark-mono-white.svg": svg(37, 40, mark(4, 4, 1, ON_DARK, ON_DARK), defs=False),
        "mark-mono-accent.svg": svg(37, 40, mark(4, 4, 1, ACCENT_FLAT, ACCENT_FLAT), defs=False),
        "app-icon.svg": svg(1024, 1024, mark(512 - 29 * 9, 512 - 32 * 9, 18, ON_DARK, acc), bg=BODY, rx=229),
        "favicon.svg": svg(32, 32, mark(16 - 29 * .35, 16 - 32 * .35, .7, ON_DARK, acc), bg=BODY, rx=7),
        "lockup-light.svg": lockup(BODY),
        "lockup-dark.svg": lockup(ON_DARK, bg=BODY),
        "lockup-tagline-light.svg": lockup(BODY, TAGLINE_SHORT, TAGLINE_COLOR_LIGHT),
        "lockup-tagline-dark.svg": lockup(ON_DARK, TAGLINE_LONG, TAGLINE_COLOR_DARK, bg=BODY),
        "og-image.svg": svg(1200, 630,
                            mark(120, 215, 6.2, ON_DARK, acc)
                            + f'<text x="360" y="330" font-family="{FONT}" font-weight="700" font-size="120" letter-spacing="-6" fill="{ON_DARK}">{NAME}</text>'
                            + f'<text x="364" y="400" font-family="{FONT}" font-weight="500" font-size="38" fill="{TAGLINE_COLOR_DARK}">{TAGLINE_LONG}</text>',
                            bg=BODY),
    }
    for name, content in files.items():
        with open(os.path.join(out, name), "w") as fh:
            fh.write(content)
    print(f"{len(files)} SVG files written to {out}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python3 make-kit.py <output-svg-dir>")
    main(sys.argv[1])
