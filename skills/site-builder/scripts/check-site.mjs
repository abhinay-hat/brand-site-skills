#!/usr/bin/env node
// Check a running site at three widths. Usage: node check-site.mjs <url> [screenshot-dir]
// Reports per width: horizontal overflow, console errors, in-page links without a target,
// visible buttons/links under 44 px tall, and saves a full-page screenshot.
// Exit code 1 if any check fails, so it can gate a delivery.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [url, outDir = "site-check"] = process.argv.slice(2);
if (!url) {
  console.error("usage: node check-site.mjs <url> [screenshot-dir]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
let failed = false;

for (const width of [1320, 900, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 860 } });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: "networkidle" });
  // Scroll through once so in-view reveals run before measuring.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth > innerWidth;
    const missing = [...document.querySelectorAll('a[href^="#"]')]
      .map((a) => a.getAttribute("href").slice(1))
      .filter((id) => id && !document.getElementById(id));
    const small = [...document.querySelectorAll("a.btn, button, nav a, input:not([type=hidden])")]
      .filter((e) => e.offsetParent && getComputedStyle(e).visibility !== "hidden")
      .map((e) => ({ t: (e.textContent || e.placeholder || e.tagName).trim().slice(0, 30), h: Math.round(e.getBoundingClientRect().height) }))
      .filter((x) => x.h < 44);
    return { overflow, missing, small };
  });
  await page.screenshot({ path: path.join(outDir, `site-${width}.png`), fullPage: true });
  const ok = !r.overflow && !r.missing.length && !r.small.length && !errors.length;
  if (!ok) failed = true;
  console.log(`${width}px ${ok ? "PASS" : "FAIL"}  overflow=${r.overflow}  missingAnchors=${JSON.stringify(r.missing)}  under44=${JSON.stringify(r.small)}  consoleErrors=${errors.length}`);
  for (const e of errors) console.log(`   error: ${e}`);
  await page.close();
}
await browser.close();
console.log(`screenshots in ${outDir}/`);
process.exit(failed ? 1 : 0);
