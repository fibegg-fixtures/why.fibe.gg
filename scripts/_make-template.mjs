#!/usr/bin/env node
// One-off: derive template.html from the current index.html by stripping
// the text content of every [data-i18n] element. Run once during setup;
// after that, edit template.html directly for structural changes.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "node-html-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "index.html");
const OUT = path.join(ROOT, "template.html");

const html = fs.readFileSync(SRC, "utf8");
const root = parse(html, {
  comment: true,
  blockTextElements: { script: true, style: true },
});

let cleared = 0;
root.querySelectorAll("[data-i18n]").forEach((el) => {
  el.set_content("");
  cleared++;
});

// Leave data-i18n-attr targets in place — empty strings would break valid
// HTML for things like meta[content] anyway; the build always overrides.

fs.writeFileSync(OUT, root.toString(), "utf8");
console.log(`✓ ${path.relative(ROOT, OUT)} (${cleared} text elements cleared)`);
