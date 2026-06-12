#!/usr/bin/env node
// Local dev server with auto-rebuild + hot-reload.
//
//   npm run dev
//
// What it does:
//   1. Spawns `python3 -m http.server <PORT>` in the project root.
//   2. Runs an initial `build-locales` so /index.html + /uk/index.html exist.
//   3. Watches the source files:
//        - template.html        ← triggers rebuild + reload
//        - assets/i18n.json     ← triggers rebuild + reload
//        - assets/script.js     ← reload only
//        - assets/style.css     ← reload only
//      (debounced ~80 ms).
//   4. Runs a tiny SSE server on PORT+1; the inline hot-reload script in
//      template.html subscribes to it and refreshes the page on each event.
//      The client script no-ops on non-localhost hosts, so production HTML
//      is unaffected.

import { spawn } from "child_process";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 5179);
const SSE_PORT = PORT + 1;

// ─── 1. Static HTTP server ────────────────────────────────────────────────
const server = spawn(
  "python3",
  ["-m", "http.server", String(PORT)],
  { cwd: ROOT, stdio: ["ignore", "inherit", "inherit"] }
);
server.on("error", (err) => {
  console.error("✗ failed to start python3 http.server:", err.message);
  process.exit(1);
});
console.log(`▶ http://localhost:${PORT}`);
console.log(`  (uk: http://localhost:${PORT}/uk/)`);

// ─── 2. Build runner (with in-flight coalescing) ──────────────────────────
let inflight = null;
let queued = false;

const runBuildOnce = () =>
  new Promise((resolve, reject) => {
    const t = Date.now();
    const proc = spawn(
      process.execPath,
      [path.join(ROOT, "scripts/build-locales.mjs")],
      { cwd: ROOT, stdio: ["ignore", "inherit", "inherit"] }
    );
    proc.on("exit", (code) => {
      if (code === 0) {
        console.log(`  (built in ${Date.now() - t} ms)\n`);
        resolve();
      } else {
        console.error(`✗ build failed (exit ${code})\n`);
        // Don't reject — keep dev running so the next edit gets a chance.
        resolve();
      }
    });
    proc.on("error", reject);
  });

const runBuild = async () => {
  if (inflight) {
    queued = true;
    return;
  }
  inflight = runBuildOnce();
  await inflight;
  inflight = null;
  if (queued) {
    queued = false;
    // A change came in mid-build — run again to catch it.
    setTimeout(runBuild, 50);
  }
};

// Initial build so the first request hits real files.
await runBuild();

// ─── 3. SSE server: broadcasts "reload" events to the in-page script ──────
const sseClients = new Set();

const sseServer = http.createServer((req, res) => {
  if (req.url !== "/__reload") {
    res.writeHead(404, { "Access-Control-Allow-Origin": "*" });
    res.end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": "*",
  });
  res.write(": connected\n\n");
  sseClients.add(res);
  // Heartbeat every 25 s so proxies / browsers don't drop the idle socket.
  const heartbeat = setInterval(() => {
    try { res.write(": ping\n\n"); } catch {}
  }, 25_000);
  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

sseServer.listen(SSE_PORT, "127.0.0.1", () => {
  console.log(`🔁 hot-reload on http://localhost:${SSE_PORT}/__reload`);
});

const notifyReload = () => {
  if (!sseClients.size) return;
  const msg = `event: reload\ndata: ${Date.now()}\n\n`;
  for (const res of sseClients) {
    try { res.write(msg); } catch {}
  }
};

// ─── 4. Watcher (debounced) ───────────────────────────────────────────────
// We watch the *parent directory* of each source so atomic-rename saves
// (the way most editors save) don't break the watcher's file handle.
const SOURCES = [
  { dir: ROOT, file: "template.html",  rebuild: true  },
  { dir: path.join(ROOT, "assets"), file: "i18n.json", rebuild: true  },
  { dir: path.join(ROOT, "assets"), file: "script.js", rebuild: false },
  { dir: path.join(ROOT, "assets"), file: "style.css", rebuild: false },
];

const pendingFiles = new Set();
let pendingNeedsBuild = false;
let debounce = 0;

const flush = async () => {
  const files = [...pendingFiles];
  const needsBuild = pendingNeedsBuild;
  pendingFiles.clear();
  pendingNeedsBuild = false;
  const stamp = new Date().toLocaleTimeString();
  console.log(`↻ ${stamp} — ${files.join(", ")} changed${needsBuild ? ", rebuilding…" : ""}`);
  if (needsBuild) await runBuild();
  notifyReload();
  if (sseClients.size) console.log(`  → reloaded ${sseClients.size} tab${sseClients.size === 1 ? "" : "s"}`);
};

for (const { dir, file, rebuild } of SOURCES) {
  try {
    fs.watch(dir, (_event, name) => {
      if (name !== file) return;
      pendingFiles.add(file);
      if (rebuild) pendingNeedsBuild = true;
      clearTimeout(debounce);
      debounce = setTimeout(flush, 80);
    });
  } catch (err) {
    console.warn(`⚠ couldn't watch ${dir}/${file}: ${err.message}`);
  }
}
console.log(
  `👀 watching ${SOURCES.map(
    (s) => path.relative(ROOT, path.join(s.dir, s.file))
  ).join(", ")}\n`
);

// ─── 5. Clean shutdown ────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} → stopping…`);
  for (const res of sseClients) {
    try { res.end(); } catch {}
  }
  sseClients.clear();
  if (sseServer.listening) sseServer.close();
  if (server && !server.killed) server.kill();
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
