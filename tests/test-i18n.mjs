import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const document = {
  body: { dataset: { page: "map" } },
  documentElement: { lang: "es" },
  querySelector: () => null,
  querySelectorAll: () => [],
  title: "",
};

const storage = new Map();
const window = { dispatchEvent: () => {} };
const context = vm.createContext({
  CustomEvent: class CustomEvent {},
  document,
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  },
  window,
});

vm.runInContext(fs.readFileSync("assets/js/i18n.js", "utf8"), context);

const markup = ["index.html", "learn.html"]
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
const runtimeSource = ["assets/js/learn.js", "assets/js/map.js"]
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
const keys = [
  ...new Set([
    ...[...markup.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map(
      (match) => match[1],
    ),
    ...[...runtimeSource.matchAll(/\bt\("([^"]+)"\)/g)].map(
      (match) => match[1],
    ),
    ...["earth", "water", "sky", "life", "risk"].flatMap((system) =>
      ["Eyebrow", "Title", "Copy", "Layers", "Note"].map(
        (field) => `systems.${system}${field}`,
      ),
    ),
    ...["off", "loading", "loaded", "error"].map((state) => `basins.${state}`),
    ...["placeLabel", "placeLoading", "placeUnavailable", "placeOutside", "placeDetail"].map(
      (field) => `basins.${field}`,
    ),
    ...["normal", "reverse", "strike"].flatMap((scenario) =>
      ["kicker", "question", "clue", "imageAlt", "explanation"].map(
        (field) => `lab.scenario.${scenario}.${field}`,
      ),
    ),
  ]),
];

for (const language of ["es", "en"]) {
  window.atlasI18n.setLanguage(language);
  for (const key of keys) {
    assert.notEqual(
      window.atlasI18n.t(key),
      key,
      `Missing ${language} translation for ${key}`,
    );
  }
}

console.log(`i18n tests passed for ${keys.length} markup keys.`);
