#!/usr/bin/env node
/**
 * Behance — MCP server.
 *
 * Search Behance and read projects from any Claude conversation, for design
 * research. Behance answers headless browsers and plain HTTP with 400/403, so
 * this drives your installed Chrome in a visible window with its own persistent
 * profile (~/.behance-mcp/profile). Image files come straight from Behance's
 * CDN, which allows normal downloads.
 *
 * Search can instead go through Apify when APIFY_TOKEN is set: exact stats and
 * field/sort filters, no window, small per-result cost.
 *
 * Read-only by design: no sign-in, likes, follows, messages or moodboard edits.
 * Navigations are spaced out (MIN_GAP_MS) to keep the load polite.
 *
 * Register it with Claude Code:
 *   claude mcp add behance -e APIFY_TOKEN=... -- node /absolute/path/to/server.mjs
 */
import path from "node:path";
import os from "node:os";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const PROFILE = process.env.BEHANCE_MCP_PROFILE ?? path.join(os.homedir(), ".behance-mcp", "profile");
const MIN_GAP_MS = 3000;

let context;
let lastNav = 0;

async function page() {
  if (!context) {
    mkdirSync(PROFILE, { recursive: true });
    context = await chromium.launchPersistentContext(PROFILE, {
      channel: "chrome",
      headless: false,
      viewport: { width: 1280, height: 900 },
    });
    // If the user closes the window, start a fresh one on the next call.
    context.on("close", () => { context = undefined; });
  }
  return context.pages()[0] ?? context.newPage();
}

// A fresh profile's first request can get a 403 bot check that clears itself
// in the browser, so readiness is judged by the content showing up, not the status.
async function go(url, ready) {
  const wait = lastNav + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNav = Date.now();
  const p = await page();
  const res = await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  try {
    await p.waitForSelector(ready, { timeout: 20000 });
  } catch {
    await p.reload({ waitUntil: "domcontentloaded" });
    await p.waitForSelector(ready, { timeout: 20000 }).catch(() => {
      throw new Error(`Behance page did not load (HTTP ${res?.status()}, title "${p.url()}"). It may be blocking; stop and tell the user.`);
    });
  }
  await p.waitForTimeout(1500);
  return p;
}

function isProjectUrl(url) {
  return /^https:\/\/www\.behance\.net\/gallery\/\d+/.test(String(url));
}

// ----------------------------------- tools -----------------------------------

// Apify actor dami_studio/behance-projects-scraper: exact stats, creative-field
// filter and sort, no window. Paid (~$3.70 per 1,000 projects), so capped.
const APIFY_ACTOR = "dami_studio~behance-projects-scraper";
const APIFY_MAX = 50;

async function searchApify({ query, limit, sort, field, within }) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?timeout=150`,
    {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.APIFY_TOKEN}` },
      body: JSON.stringify({
        searchTerms: [query],
        maxItems: Math.min(limit, APIFY_MAX),
        sortBy: sort,
        creativeField: field,
        publishedWithin: within,
      }),
    },
  );
  if (!res.ok) throw new Error(`Apify returned HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const items = await res.json();
  const results = items.filter((i) => i.recordType === "project").map((i) => ({
    url: i.url,
    title: i.title,
    owner: i.creatorName,
    location: i.creatorLocation,
    likes: i.appreciations,
    views: i.views,
    comments: i.comments,
    fields: i.creativeFields,
    tags: i.tags,
    published: i.publishedAt?.slice(0, 10),
    cover: i.coverImage,
  }));
  // Behance's own sort is loose; re-sort so "appreciations"/"views" mean it.
  if (sort === "appreciations") results.sort((a, b) => b.likes - a.likes);
  if (sort === "views") results.sort((a, b) => b.views - a.views);
  return { query, source: "apify", count: results.length, results };
}

async function search({ query, limit = 24, sort = "recommended", field = "", within = "all", source }) {
  if (!query) throw new Error("query is required");
  source ??= process.env.APIFY_TOKEN ? "apify" : "browser";
  if (source === "apify") {
    if (!process.env.APIFY_TOKEN) throw new Error("source 'apify' needs APIFY_TOKEN in the server's environment");
    return searchApify({ query, limit, sort, field, within });
  }
  const p = await go(`https://www.behance.net/search/projects?search=${encodeURIComponent(query)}`, `a[href*="/gallery/"]`);
  for (let i = 0; i < 2; i++) {
    await p.mouse.wheel(0, 3000);
    await p.waitForTimeout(1500);
  }
  const cards = await p.evaluate(() => {
    const seen = new Set();
    return [...document.querySelectorAll('a[href*="/gallery/"]')].map((a) => {
      const url = a.href.split("?")[0];
      if (seen.has(url)) return null;
      seen.add(url);
      let c = a;
      for (let i = 0; i < 6 && c.parentElement && !/\d/.test(c.innerText || ""); i++) c = c.parentElement;
      const nums = [...new Set((c.innerText || "").match(/\d[\d.,]*[KM]?/g) || [])];
      return {
        url,
        title: decodeURIComponent(url.split("/").pop()).replace(/-/g, " "),
        stats: nums.slice(0, 3).join(" · "), // likes/views as shown on the card; may include digits from the title
        cover: c.querySelector("img")?.src || "",
      };
    }).filter(Boolean);
  });
  return { query, source: "browser", count: Math.min(cards.length, limit), results: cards.slice(0, limit) };
}

async function project({ url }) {
  if (!isProjectUrl(url)) throw new Error("url must be a https://www.behance.net/gallery/... link");
  const p = await go(url.split("?")[0], `img[src*="project_modules"], img[srcset*="project_modules"]`);
  return p.evaluate(() => {
    const txt = (s) => [...document.querySelectorAll(s)].map((e) => e.innerText.trim()).filter(Boolean);
    const junk = /^(Follow|Following|Unfollow)( All)?$|^(Sign up|Sign in|Read More|SuSiFacebook)$/;
    return {
      url: location.href.split("?")[0],
      title: document.title.replace(/ :: Behance$/, ""),
      owner: txt('[class*="Owner"] a').find((t) => !junk.test(t)) || "",
      tools: [...new Set(txt('[class*="Tools"] a, [class*="tool"] a'))].filter((t) => !junk.test(t)).slice(0, 10),
      tags: [...new Set(txt('a[href*="tracking_source=project_tag"], a[href*="/search/projects?search="]'))].slice(0, 15),
      images: [...new Set([...document.querySelectorAll("img")].map((i) => i.currentSrc || i.src).filter((s) => /project_modules/.test(s)))],
    };
  });
}

async function download({ url, dir, max = 6 }) {
  if (!dir || !path.isAbsolute(dir)) throw new Error("dir must be an absolute path");
  const info = await project({ url });
  const id = url.match(/gallery\/(\d+)/)[1];
  mkdirSync(dir, { recursive: true });
  const saved = [];
  for (const [i, src] of info.images.slice(0, Math.min(max, 12)).entries()) {
    const res = await fetch(src);
    if (!res.ok) continue;
    const ext = (res.headers.get("content-type") || "").split("/")[1]?.replace("jpeg", "jpg") || "img";
    const file = path.join(dir, `${id}-${i + 1}.${ext}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    saved.push(file);
  }
  return { ...info, images: undefined, saved };
}

async function close() {
  await context?.close();
  context = undefined;
  return { closed: true };
}

const TOOLS = [
  {
    name: "behance_search",
    description: "Search Behance projects by keyword. With APIFY_TOKEN set it uses Apify (exact likes/views/tags, field filter, sort; paid, ~$0.004 per result, max 50). Otherwise, or with source 'browser', it opens a visible Chrome window (free, rough stats, sort/field ignored).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search terms, e.g. 'proptech brand identity'" },
        limit: { type: "number", description: "Max results (default 24; Apify caps at 50)" },
        sort: { type: "string", enum: ["recommended", "appreciations", "views", "published_date", "featured_date", "comments"], description: "Apify only" },
        field: { type: "string", description: "Creative field, Apify only, e.g. 'Branding', 'Logo Design', 'UI/UX', 'Graphic Design'" },
        within: { type: "string", enum: ["all", "today", "week", "month"], description: "Published within, Apify only" },
        source: { type: "string", enum: ["apify", "browser"], description: "Default: apify if APIFY_TOKEN is set, else browser" },
      },
      required: ["query"],
    },
    handler: search,
  },
  {
    name: "behance_project",
    description: "Read one Behance project: title, owner, tools, tags and its full-size image URLs.",
    inputSchema: {
      type: "object",
      properties: { url: { type: "string", description: "https://www.behance.net/gallery/<id>/<slug>" } },
      required: ["url"],
    },
    handler: project,
  },
  {
    name: "behance_download",
    description: "Save a project's images to a local folder (for reference and analysis only). Returns the saved file paths.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "https://www.behance.net/gallery/<id>/<slug>" },
        dir: { type: "string", description: "Absolute folder path to save into" },
        max: { type: "number", description: "Max images (default 6, cap 12)" },
      },
      required: ["url", "dir"],
    },
    handler: download,
  },
  {
    name: "behance_close",
    description: "Close the Chrome window opened by this server.",
    inputSchema: { type: "object", properties: {} },
    handler: close,
  },
];

// ----------------------------- JSON-RPC over stdio -----------------------------

function send(msg) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...msg }) + "\n");
}

async function handle(req) {
  const { id, method, params } = req;
  const isNotification = id === undefined || id === null;

  try {
    switch (method) {
      case "initialize":
        return send({
          id,
          result: {
            protocolVersion: params?.protocolVersion ?? "2025-06-18",
            capabilities: { tools: {} },
            serverInfo: { name: "behance", version: "1.0.0" },
          },
        });

      case "tools/list":
        return send({
          id,
          result: { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) },
        });

      case "tools/call": {
        const tool = TOOLS.find((t) => t.name === params?.name);
        if (!tool) return send({ id, error: { code: -32602, message: `unknown tool: ${params?.name}` } });
        try {
          const result = await tool.handler(params?.arguments ?? {});
          return send({ id, result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] } });
        } catch (err) {
          // Tool failures go back as results so the model can read them and adjust.
          return send({ id, result: { isError: true, content: [{ type: "text", text: String(err?.message ?? err) }] } });
        }
      }

      case "ping":
        return send({ id, result: {} });

      default:
        if (isNotification) return;
        return send({ id, error: { code: -32601, message: `unknown method: ${method}` } });
    }
  } catch (err) {
    if (isNotification) return;
    send({ id, error: { code: -32603, message: String(err?.message ?? err) } });
  }
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let req;
    try {
      req = JSON.parse(line);
    } catch {
      continue;
    }
    handle(req);
  }
});
process.stdin.on("end", async () => {
  await context?.close().catch(() => {});
  process.exit(0);
});
