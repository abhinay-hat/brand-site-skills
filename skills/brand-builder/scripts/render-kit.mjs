#!/usr/bin/env node
// Render every SVG in a kit to PNG with a real Chrome, so web fonts in lockups load.
// Usage: node render-kit.mjs <svg-dir> <png-dir> [google-font-family]
// Sizes come from the filename: app-icon -> 1024/512/180, favicon -> 16/32/48,
// og-image -> 1200, lockup-* -> @2x of its own width, everything else -> 512.
import { chromium } from "playwright-core";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import path from "node:path";

const [svgDir, pngDir, font = "Sora"] = process.argv.slice(2);
if (!svgDir || !pngDir) {
  console.error("usage: node render-kit.mjs <svg-dir> <png-dir> [google-font-family]");
  process.exit(1);
}
mkdirSync(pngDir, { recursive: true });

const jobsFor = (name, svg) => {
  const base = name.replace(/\.svg$/, "");
  if (base === "app-icon") return [[1024, "app-icon-1024"], [512, "app-icon-512"], [180, "apple-touch-icon-180"]];
  if (base === "favicon") return [[16, "favicon-16"], [32, "favicon-32"], [48, "favicon-48"]];
  if (base === "og-image") return [[1200, "og-image-1200x630"]];
  if (base.startsWith("lockup")) {
    const w = Number(svg.match(/viewBox="0 0 (\d+)/)?.[1] || 400);
    return [[w * 2, `${base}@2x`]];
  }
  return [[512, `${base}-512`]];
};

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700&display=block`;

for (const file of readdirSync(svgDir).filter((f) => f.endsWith(".svg"))) {
  const raw = readFileSync(path.join(svgDir, file), "utf8");
  for (const [width, out] of jobsFor(file, raw)) {
    const svg = raw.replace(/width="\d+" height="\d+"/, `width="${width}" style="display:block;height:auto"`);
    await page.setContent(`<!doctype html><html><head><link href="${fontUrl}" rel="stylesheet"><style>html,body{margin:0;background:transparent}</style></head><body>${svg}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.locator("svg").screenshot({ path: path.join(pngDir, `${out}.png`), omitBackground: true });
    console.log(`${file} -> ${out}.png`);
  }
}
console.log("font loaded:", await page.evaluate((f) => document.fonts.check(`700 20px "${f}"`), font));
await browser.close();
