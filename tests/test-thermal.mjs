import assert from "node:assert/strict";

import {
  THERMAL_SOURCE,
  normalizeThermalDate,
  thermalDateRange,
  thermalWmsOptions,
} from "../assets/js/map/thermal.js";

const range = thermalDateRange(new Date("2026-09-11T18:00:00Z"));
assert.deepEqual(range, { min: "2026-08-11", max: "2026-09-10", selected: "2026-09-10" });
assert.equal(normalizeThermalDate("2026-08-01", range), range.min);
assert.equal(normalizeThermalDate("2026-10-01", range), range.max);
assert.equal(normalizeThermalDate("invalid", range), range.selected);
assert.equal(thermalWmsOptions(range.selected).time, "2026-09-10");
assert.ok(THERMAL_SOURCE.endpoint.startsWith("https://gibs.earthdata.nasa.gov/"));

console.log("Thermal anomaly module tests passed.");
