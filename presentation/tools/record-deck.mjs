// Record a deck to MP4: `node presentation/tools/record-deck.mjs 07 [out.mp4]` (or `just record 07`).
// Serves the repo, opens the deck in installed Google Chrome (headed, so WebGL runs on the GPU) with
// ?record (which ignores keys, so typing in that window can't derail it), starts autoplay and pipes
// DevTools screencast frames into ffmpeg at a fixed 30 fps until the deck fires "deck:end".
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const FPS = 30, W = 1920, H = 1080;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const deck = process.argv[2] || "07";
const exportDir = join(root, "presentation", deck, "export");
const pdf = existsSync(exportDir) ? readdirSync(exportDir).find((f) => f.endsWith(".pdf")) : null;
const out = resolve(process.argv[3] || join(exportDir, pdf ? pdf.replace(/\.pdf$/, ".mp4") : `deck-${deck}.mp4`));

const freePort = () => new Promise((ok) => { const s = createServer().listen(0, () => { const { port } = s.address(); s.close(() => ok(port)); }); });
const port = await freePort();
const server = spawn("python3", ["-m", "http.server", String(port)], { cwd: root, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch({
  channel: "chrome",
  headless: false,
  args: [`--window-size=${W},${H + 120}`, "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.goto(`http://localhost:${port}/presentation/${deck}/?record#/1`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

// Visit every page once so each diagram module and three.js are loaded before recording.
const total = await page.evaluate(() => document.querySelectorAll("#deck section.page").length);
for (let i = 2; i <= total; i++) { await page.evaluate((n) => (location.hash = `#/${n}`), i); await page.waitForTimeout(250); }
await page.evaluate(() => (location.hash = "#/1"));
await page.waitForTimeout(2000);

const ffmpeg = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });

// The screencast only sends a frame when the page changes; repeat the latest one to keep real time.
const cdp = await page.context().newCDPSession(page);
let latest = null;
cdp.on("Page.screencastFrame", ({ data, sessionId }) => { latest = Buffer.from(data, "base64"); cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {}); });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
while (!latest) await new Promise((r) => setTimeout(r, 20));

const t0 = Date.now();
let written = 0;
const pump = setInterval(() => {
  const due = Math.floor(((Date.now() - t0) * FPS) / 1000);
  for (; written < due; written++) ffmpeg.stdin.write(latest);
}, 1000 / FPS / 2);

const ended = page.evaluate(() => new Promise((r) => addEventListener("deck:end", r, { once: true })));
await page.evaluate(() => dispatchEvent(new Event("deck:play"))); // the cover gets its full time
let last = 1;
const timer = setInterval(async () => {
  const n = await page.evaluate(() => parseInt(location.hash.slice(2), 10)).catch(() => last);
  const s = Math.round((Date.now() - t0) / 1000);
  if (n !== last) console.log(`\n${s} s · page ${n}${n < last ? "  ⚠ went backwards" : ""}`);
  last = n;
  process.stdout.write(`\rrecording ${s} s`);
}, 1000);
await ended;
await new Promise((r) => setTimeout(r, 1500)); // hold the last slide briefly

clearInterval(pump); clearInterval(timer);
await cdp.send("Page.stopScreencast").catch(() => {});
ffmpeg.stdin.end();
await new Promise((r) => ffmpeg.on("close", r));
await browser.close();
server.kill();
console.log(`\nsaved ${out} (${(written / FPS).toFixed(1)} s)`);
