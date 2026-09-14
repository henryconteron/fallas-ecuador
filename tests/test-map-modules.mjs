import assert from "node:assert/strict";

import { FAULT_METADATA_PROFILES, SOURCE_REGISTRY } from "../assets/js/map/config.js";
import { buildEarthquakeUrl } from "../assets/js/map/data.js";
import { filterEarthquakes, normalizeEarthquakeFilters } from "../assets/js/map/seismicity.js";
import { earthquakeDepthClass, faultStyle } from "../assets/js/map/symbology.js";

const queryUrl = new URL(
  buildEarthquakeUrl(new Date("2026-09-11T00:00:00Z"), {
    days: 7,
    minimumMagnitude: 4.5,
  }),
);
assert.equal(queryUrl.searchParams.get("starttime"), "2026-09-04T00:00:00.000Z");
assert.equal(queryUrl.searchParams.get("endtime"), "2026-09-11T00:00:00.000Z");
assert.equal(queryUrl.searchParams.get("minmagnitude"), "4.5");
assert.equal(queryUrl.searchParams.get("eventtype"), "earthquake");

const earthquake = (depth) => ({
  type: "Feature",
  properties: { mag: 4 },
  geometry: { type: "Point", coordinates: [-78, 0, depth] },
});
const depthFixtures = [earthquake(12), earthquake(45), earthquake(120), earthquake(340)];
assert.deepEqual(
  depthFixtures.map(earthquakeDepthClass),
  ["shallow", "intermediate", "deep", "veryDeep"],
);
assert.deepEqual(filterEarthquakes(depthFixtures, { depth: "deep" }), [depthFixtures[2]]);
assert.equal(filterEarthquakes(depthFixtures, { depth: "all" }).length, 4);
assert.deepEqual(normalizeEarthquakeFilters({ days: 999, minimumMagnitude: -2, depth: "invalid" }), {
  days: 365,
  minimumMagnitude: 0,
  depth: "all",
});

const fault = (movement) => ({ properties: { tipo_movimiento: movement } });
assert.notEqual(faultStyle(fault("normal"), null).dashArray, faultStyle(fault("dextral"), null).dashArray);
assert.equal(faultStyle(fault("inversa"), null).dashArray, undefined);

assert.equal(SOURCE_REGISTRY.SARA.metadataProfile, "sara");
assert.equal(SOURCE_REGISTRY.ATA.metadataProfile, "ata");
assert.match(FAULT_METADATA_PROFILES.sara.coverage, /^popup\./);
assert.match(FAULT_METADATA_PROFILES.ata.limits, /^popup\./);

console.log("Map module tests passed.");
