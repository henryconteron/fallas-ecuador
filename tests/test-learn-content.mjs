import assert from "node:assert/strict";
import fs from "node:fs";

const markup = fs.readFileSync("learn.html", "utf8");
const assetPaths = new Set();

for (const match of markup.matchAll(/(?:src|href)="(assets\/[^"?]+)(?:\?[^\"]*)?"/g)) {
  assetPaths.add(match[1]);
}

for (const match of markup.matchAll(/srcset="([^"]+)"/g)) {
  for (const candidate of match[1].split(",")) {
    const source = candidate.trim().split(/\s+/)[0];
    if (source.startsWith("assets/")) assetPaths.add(source);
  }
}

for (const assetPath of assetPaths) {
  assert.ok(fs.existsSync(assetPath), `Missing local resource referenced by learn.html: ${assetPath}`);
}

const images = [...markup.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
assert.ok(images.length > 0, "learn.html should contain educational images");
for (const image of images) {
  assert.match(image, /\balt="[^"]*"/, `Image is missing alternative text: ${image}`);
}

const bibliographyIds = new Set(
  [...markup.matchAll(/\bid="(ref-[^"]+)"/g)].map((match) => match[1]),
);
const citedIds = [...markup.matchAll(/href="#(ref-[^"]+)"/g)].map((match) => match[1]);
assert.ok(citedIds.length >= 5, "The educational story should visibly connect figures and claims to references");
for (const citedId of citedIds) {
  assert.ok(bibliographyIds.has(citedId), `Citation target #${citedId} is missing from the bibliography`);
}

for (const chapter of ["observar", "fundamentos", "sismo", "paleosismologia", "caso-ecuador", "laboratorio"]) {
  assert.match(markup, new RegExp(`data-story-section="${chapter}"`), `Missing story chapter: ${chapter}`);
  assert.match(markup, new RegExp(`data-story-link="${chapter}"`), `Missing story navigation link: ${chapter}`);
}

console.log(`Learn content tests passed for ${assetPaths.size} local resources and ${citedIds.length} citations.`);
