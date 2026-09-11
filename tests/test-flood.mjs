import assert from "node:assert/strict";
import {
  floodDateRange,
  FLOOD_SOURCE,
  floodWmsOptions,
  normalizeFloodDate,
} from "../assets/js/map/flood.js";

const range = floodDateRange(new Date("2026-09-11T18:00:00Z"));
assert.deepEqual(range, { min: "2026-07-25", max: "2026-09-08", selected: "2026-09-08" });
assert.equal(normalizeFloodDate("2026-07-01", range), range.min);
assert.equal(normalizeFloodDate("2026-09-11", range), range.max);
assert.equal(normalizeFloodDate("invalid", range), range.selected);
assert.equal(floodWmsOptions(range.selected).layers, "VIIRS_Combined_Flood_1-Day");
assert.equal(floodWmsOptions(range.selected).time, "2026-09-08");
assert.equal(floodWmsOptions(range.selected).transparent, true);
assert.match(FLOOD_SOURCE.endpoint, /^https:\/\//);

console.log("Flood module tests passed.");
