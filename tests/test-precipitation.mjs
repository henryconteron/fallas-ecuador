import assert from "node:assert/strict";
import {
  normalizePrecipitationDate,
  precipitationDateRange,
  PRECIPITATION_SOURCE,
  precipitationWmsOptions,
} from "../assets/js/map/precipitation.js";

const range = precipitationDateRange(new Date("2026-09-11T18:00:00Z"));
assert.deepEqual(range, { min: "2026-07-11", max: "2026-09-09", selected: "2026-09-09" });
assert.equal(normalizePrecipitationDate("2026-07-01", range), range.min);
assert.equal(normalizePrecipitationDate("2026-09-11", range), range.max);
assert.equal(normalizePrecipitationDate("not-a-date", range), range.selected);
assert.equal(precipitationWmsOptions(range.selected).layers, "IMERG_Precipitation_Rate");
assert.equal(precipitationWmsOptions(range.selected).time, "2026-09-09");
assert.equal(precipitationWmsOptions(range.selected).transparent, true);
assert.match(PRECIPITATION_SOURCE.endpoint, /^https:\/\//);

console.log("Precipitation module tests passed.");
