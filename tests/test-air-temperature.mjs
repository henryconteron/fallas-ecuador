import assert from "node:assert/strict";
import {
  AIR_TEMPERATURE_SOURCE,
  airTemperatureDateRange,
  airTemperatureWmsOptions,
  normalizeAirTemperatureDate,
} from "../assets/js/map/air-temperature.js";

const range = airTemperatureDateRange(new Date("2026-09-11T18:00:00Z"));
assert.deepEqual(range, { min: "2026-06-07", max: "2026-09-05", selected: "2026-09-05" });
assert.equal(normalizeAirTemperatureDate("2026-05-01", range), range.min);
assert.equal(normalizeAirTemperatureDate("2026-09-11", range), range.max);
assert.equal(normalizeAirTemperatureDate("invalid", range), range.selected);
assert.equal(
  airTemperatureWmsOptions(range.selected).layers,
  "AIRS_L3_Surface_Air_Temperature_Daily_Day",
);
assert.equal(airTemperatureWmsOptions(range.selected).time, "2026-09-05");
assert.equal(airTemperatureWmsOptions(range.selected).transparent, true);
assert.match(AIR_TEMPERATURE_SOURCE.endpoint, /^https:\/\//);
assert.match(AIR_TEMPERATURE_SOURCE.metadata, /layer-metadata/);

console.log("Air temperature module tests passed.");
