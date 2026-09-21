import { readFile } from "node:fs/promises";

const path = "CITATION.cff";
const text = await readFile(path, "utf8");
const required = [
  "cff-version:",
  "message:",
  "title:",
  "authors:",
  "repository-code:",
  "url:",
  "license:",
  "version:",
  "date-released:",
];

const missing = required.filter((key) => !text.split("\n").some((line) => line.startsWith(key)));
if (missing.length > 0) {
  throw new Error(`CITATION.cff no contiene campos requeridos: ${missing.join(", ")}`);
}

if (!/^version:\s+["']?\d+\.\d+\.\d+["']?\s*$/m.test(text)) {
  throw new Error("CITATION.cff debe declarar una versión semántica x.y.z");
}

if (!/^url:\s+["']https:\/\/[^"']+["']\s*$/m.test(text)) {
  throw new Error("CITATION.cff debe declarar una URL HTTPS del proyecto");
}

console.log("CITATION.cff válido.");
