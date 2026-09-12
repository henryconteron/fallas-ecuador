import assert from "node:assert/strict";
import {
  CLOUD_FRACTION_SOURCE,
  cloudFractionDateRange,
  cloudFractionWmsOptions,
  normalizeCloudFractionDate,
} from "../assets/js/map/cloud-fraction.js";

const range = cloudFractionDateRange(new Date("2026-09-12T18:00:00Z"));
assert.deepEqual(range, { min: "2026-07-13", max: "2026-09-11", selected: "2026-09-11" });
assert.equal(normalizeCloudFractionDate("2026-06-01", range), range.min);
assert.equal(normalizeCloudFractionDate("2026-09-12", range), range.max);
assert.equal(normalizeCloudFractionDate("invalid", range), range.selected);
assert.equal(cloudFractionWmsOptions(range.selected).layers, "MODIS_Aqua_Cloud_Fraction_Day");
assert.equal(cloudFractionWmsOptions(range.selected).time, "2026-09-11");
assert.equal(cloudFractionWmsOptions(range.selected).transparent, true);
assert.match(CLOUD_FRACTION_SOURCE.endpoint, /^https:\/\//);
assert.match(CLOUD_FRACTION_SOURCE.metadata, /layer-metadata/);

console.log("Cloud fraction module tests passed.");
