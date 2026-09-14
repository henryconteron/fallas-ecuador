import { readFile } from "node:fs/promises";

const FIELD_LABELS = {
  reference: "individual reference",
  escala: "map scale",
  actividad: "activity",
  confianza: "activity confidence",
  net_slip_rate: "net slip rate",
  average_dip: "average dip",
  dip_dir: "dip direction",
  upper_seis_depth: "upper seismogenic depth",
  lower_seis_depth: "lower seismogenic depth",
};

const CATALOGS = {
  ATA: "Active Tectonics of the Andes",
  SARA: "SARA",
};

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function sourceKey(feature) {
  const properties = feature.properties ?? {};
  const catalogId = String(properties.catalog_id ?? feature.id ?? "");
  if (properties.source_key) return String(properties.source_key);
  if (catalogId.startsWith("SA_")) return "SARA";
  if (catalogId.startsWith("ATA_")) return "ATA";
  return "UNKNOWN";
}

function formatRatio(value, total) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return `${value}/${total} (${percent}%)`;
}

const catalogPath = process.argv[2] ?? "data/geojson/fallas.geojson";
const data = JSON.parse(await readFile(catalogPath, "utf8"));
const fields = Object.keys(FIELD_LABELS);
const summary = new Map();

for (const feature of data.features ?? []) {
  const key = sourceKey(feature);
  const bucket = summary.get(key) ?? { features: 0, fields: Object.fromEntries(fields.map((field) => [field, 0])) };
  bucket.features += 1;
  for (const field of fields) {
    if (hasValue(feature.properties?.[field])) bucket.fields[field] += 1;
  }
  summary.set(key, bucket);
}

console.log(`# Fault metadata audit`);
console.log("");
console.log(`Catalog: ${catalogPath}`);
console.log(`Features: ${data.features?.length ?? 0}`);
console.log(`GEM source commit: ${data.metadata?.source_commit ?? "unknown"}`);
console.log("");
console.log("| Source | Features | Documented fields | Fields absent in this build |");
console.log("| --- | ---: | --- | --- |");

for (const [key, bucket] of [...summary.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const present = fields
    .filter((field) => bucket.fields[field] > 0)
    .map((field) => `${FIELD_LABELS[field]} ${formatRatio(bucket.fields[field], bucket.features)}`);
  const absent = fields.filter((field) => bucket.fields[field] === 0).map((field) => FIELD_LABELS[field]);
  console.log(
    `| ${CATALOGS[key] ?? key} | ${bucket.features} | ${present.join("; ") || "None"} | ${absent.join("; ") || "None"} |`,
  );
}

console.log("");
console.log(
  "Use this audit to decide which gaps require manual curation from papers before adding values to the public GeoJSON.",
);
