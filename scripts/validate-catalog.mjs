import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import process from "node:process";

const ALLOWED_MOVEMENTS = new Set(["inversa", "normal", "dextral", "sinestral", "desconocido"]);
const ALLOWED_EVIDENCE = new Set(["escarpe", "faceta_triangular", "drenaje_desplazado", "laguna_sag"]);
const EVIDENCE_GEOMETRIES = new Set(["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"]);
const PINNED_GEM_COMMIT = "850fd05b48841eb806d61a37043b5567f5bb99dd";
const REQUIRED_PROPERTIES = [
  "nombre",
  "provincia",
  "tipo_movimiento",
  "fuente",
  "fuente_url",
  "descripcion",
  "catalog_id",
  "licencia",
];

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function isPresent(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function visitCoordinates(value, callback) {
  if (!Array.isArray(value)) return;
  if (value.length >= 2 && value.every((item) => typeof item === "number")) {
    callback(value);
    return;
  }
  value.forEach((child) => visitCoordinates(child, callback));
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    fail(`${path}: ${error.message}`);
    return null;
  }
}

function validateFeatureCollection(path, data, acceptedGeometry) {
  if (data?.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    fail(`${path}: expected a GeoJSON FeatureCollection`);
    return;
  }
  data.features.forEach((feature, index) => {
    const label = `${path} feature ${feature?.id ?? index + 1}`;
    if (feature?.type !== "Feature") fail(`${label}: invalid feature type`);
    if (!acceptedGeometry.has(feature?.geometry?.type)) {
      fail(`${label}: unsupported geometry ${feature?.geometry?.type ?? "missing"}`);
    }
    visitCoordinates(feature?.geometry?.coordinates, ([longitude, latitude]) => {
      if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
        fail(`${label}: coordinate outside WGS 84 longitude/latitude ranges`);
      }
    });
  });
}

function validateFaultCatalog(path, data) {
  validateFeatureCollection(path, data, new Set(["LineString", "MultiLineString"]));
  if (!data?.features) return;

  if (data.metadata?.feature_count !== data.features.length) {
    fail(`${path}: metadata.feature_count does not match the feature array`);
  }
  if (data.metadata?.source_commit !== PINNED_GEM_COMMIT) {
    fail(`${path}: GEM source_commit is missing or not pinned to ${PINNED_GEM_COMMIT}`);
  }
  if (!String(data.metadata?.source ?? "").includes(PINNED_GEM_COMMIT)) {
    fail(`${path}: metadata.source does not use the pinned GEM commit`);
  }

  const ids = new Set();
  const names = new Map();
  let missingReferences = 0;
  let missingScales = 0;

  data.features.forEach((feature, index) => {
    const properties = feature.properties ?? {};
    const id = String(feature.id ?? properties.catalog_id ?? `index-${index}`);
    if (ids.has(id)) fail(`${path}: duplicate feature id ${id}`);
    ids.add(id);
    REQUIRED_PROPERTIES.forEach((key) => {
      if (!isPresent(properties[key])) fail(`${path} ${id}: missing required property ${key}`);
    });
    if (properties.catalog_id !== id) fail(`${path} ${id}: catalog_id and feature id differ`);
    if (!ALLOWED_MOVEMENTS.has(properties.tipo_movimiento)) {
      fail(`${path} ${id}: unsupported movement ${properties.tipo_movimiento}`);
    }
    try {
      const sourceUrl = new URL(properties.fuente_url);
      if (sourceUrl.protocol !== "https:") fail(`${path} ${id}: fuente_url must use HTTPS`);
      if (!sourceUrl.href.includes(PINNED_GEM_COMMIT)) {
        fail(`${path} ${id}: fuente_url does not use the pinned GEM commit`);
      }
    } catch {
      fail(`${path} ${id}: fuente_url is not a valid URL`);
    }

    const normalizedName = String(properties.nombre).trim().toLocaleLowerCase("es");
    names.set(normalizedName, (names.get(normalizedName) ?? 0) + 1);
    if (!isPresent(properties.reference)) missingReferences += 1;
    if (!isPresent(properties.escala)) missingScales += 1;
  });

  const repeatedNames = [...names.values()].filter((count) => count > 1).length;
  if (missingReferences) warn(`${path}: ${missingReferences} records have no individual reference`);
  if (missingScales) warn(`${path}: ${missingScales} records have no documented map scale`);
  if (repeatedNames) warn(`${path}: ${repeatedNames} names identify multiple catalog records; IDs must remain visible`);
}

function validateEvidenceCatalog(path, data, faultIds) {
  validateFeatureCollection(path, data, EVIDENCE_GEOMETRIES);
  if (!data?.features) return;
  if (data.metadata?.feature_count !== data.features.length) {
    fail(`${path}: metadata.feature_count does not match the feature array`);
  }

  const ids = new Set();
  const required = [
    "nombre",
    "tipo",
    "observacion",
    "confianza",
    "precision",
    "metodo_localizacion",
    "geometry_role",
    "fault_catalog_ids",
    "source_section",
    "fuente",
    "fuente_url",
    "licencia",
  ];
  data.features.forEach((feature, index) => {
    const properties = feature.properties ?? {};
    const id = String(feature.id ?? `index-${index}`);
    if (ids.has(id)) fail(`${path}: duplicate feature id ${id}`);
    ids.add(id);
    required.forEach((key) => {
      const value = properties[key];
      if (Array.isArray(value) ? value.length === 0 : !isPresent(value)) {
        fail(`${path} ${id}: missing required property ${key}`);
      }
    });
    if (!ALLOWED_EVIDENCE.has(properties.tipo)) fail(`${path} ${id}: unsupported evidence type`);
    if (!["alta", "media", "baja"].includes(properties.confianza)) fail(`${path} ${id}: invalid confidence`);
    if (!["sitio", "local", "regional"].includes(properties.precision)) fail(`${path} ${id}: invalid precision`);
    if (!["mapped_feature", "representative_location"].includes(properties.geometry_role)) {
      fail(`${path} ${id}: invalid geometry role`);
    }
    if (properties.geometry_role === "representative_location" && !["Point", "MultiPoint"].includes(feature.geometry?.type)) {
      fail(`${path} ${id}: a representative location must use Point or MultiPoint geometry`);
    }
    for (const faultId of properties.fault_catalog_ids ?? []) {
      if (!faultIds.has(faultId)) fail(`${path} ${id}: related fault ${faultId} is absent from the fault catalog`);
    }
    try {
      if (new URL(properties.fuente_url).protocol !== "https:") fail(`${path} ${id}: fuente_url must use HTTPS`);
    } catch {
      fail(`${path} ${id}: fuente_url is not a valid URL`);
    }
  });

  const representativeCount = data.features.filter(
    (feature) => feature.properties?.geometry_role === "representative_location",
  ).length;
  if (representativeCount) {
    warn(`${path}: ${representativeCount} documented occurrences use regional representative points, not mapped footprints`);
  }
}

async function validateBuildManifest() {
  const path = "data/catalog-build-manifest.json";
  const manifest = await readJson(path);
  if (!manifest) return;
  if (manifest.source_commit !== PINNED_GEM_COMMIT) {
    fail(`${path}: source commit does not match the validated catalog`);
  }
  const outputPath = `data/geojson/${manifest.output?.filename ?? ""}`;
  try {
    const content = await readFile(outputPath);
    const canonicalContent = Buffer.from(
      content.toString("utf8").replace(/\r\n?/g, "\n"),
      "utf8",
    );
    const checksum = createHash("sha256").update(canonicalContent).digest("hex");
    if (checksum !== manifest.output?.sha256) {
      fail(`${path}: output SHA-256 does not match ${outputPath}`);
    }
    if (canonicalContent.length !== manifest.output?.size_bytes) {
      fail(`${path}: output size does not match ${outputPath}`);
    }
  } catch (error) {
    fail(`${path}: could not verify output (${error.message})`);
  }
  if (manifest.status === "partial-legacy-build") {
    warn(`${path}: ADM0/ADM1 checksums will be completed on the next catalog rebuild`);
  }
}

const faultPath = "data/geojson/fallas.geojson";
const faultData = await readJson(faultPath);
if (faultData) validateFaultCatalog(faultPath, faultData);
const faultIds = new Set((faultData?.features ?? []).map((feature) => String(feature.id)));

const evidencePath = "data/geojson/estructuras.geojson";
const evidenceData = await readJson(evidencePath);
if (evidenceData) validateEvidenceCatalog(evidencePath, evidenceData, faultIds);

for (const [path, geometries] of [
  ["data/geojson/fallas.demo.geojson", new Set(["LineString", "MultiLineString"])],
  ["data/geojson/estructuras.demo.geojson", EVIDENCE_GEOMETRIES],
]) {
  const data = await readJson(path);
  if (data) validateFeatureCollection(path, data, geometries);
}

await validateBuildManifest();

warnings.forEach((message) => console.warn(`WARNING: ${message}`));
if (errors.length) {
  errors.forEach((message) => console.error(`ERROR: ${message}`));
  process.exitCode = 1;
} else {
  console.log(`Catalog validation passed with ${warnings.length} documented warning(s).`);
}
