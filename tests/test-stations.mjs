import assert from "node:assert/strict";
import fs from "node:fs";
import {
  filterStations,
  normalizeStationCategory,
  STATION_CATEGORIES,
  STATION_SOURCE,
  stationMarkerOptions,
} from "../assets/js/map/stations.js";

assert.deepEqual(STATION_CATEGORIES, ["all", "meteorological", "hydrological", "mixed"]);
assert.equal(normalizeStationCategory("METEOROLOGICA"), "meteorological");
assert.equal(normalizeStationCategory("HIDROLOGICA"), "hydrological");
assert.equal(normalizeStationCategory("HIDRO - METEOROLOGICA"), "mixed");
assert.ok(STATION_SOURCE.endpoint.startsWith("https://inamhi.gob.ec/"));

const features = [
  { properties: { categoria: "METEOROLOGICA" } },
  { properties: { categoria: "HIDROLOGICA" } },
  { properties: { categoria: "HIDRO - METEOROLOGICA" } },
];
assert.equal(filterStations(features, "all").length, 3);
assert.equal(filterStations(features, "hydrological").length, 1);
assert.equal(stationMarkerOptions(features[0]).fillColor, "#f2b84b");
assert.equal(stationMarkerOptions(features[1]).fillColor, "#32b6d8");
assert.equal(stationMarkerOptions(features[2]).fillColor, "#72dcc2");

const snapshot = JSON.parse(fs.readFileSync("data/geojson/estaciones-inamhi.geojson", "utf8"));
assert.equal(snapshot.type, "FeatureCollection");
assert.equal(snapshot.metadata.featureCount, snapshot.features.length);
assert.ok(snapshot.features.length > 0);
assert.ok(snapshot.metadata.source.startsWith("https://inamhi.gob.ec/"));
assert.ok(snapshot.features.every((feature) => feature.geometry?.type === "Point"));
assert.ok(snapshot.features.every((feature) => feature.properties?.estado === "TRANSMITIENDO"));
assert.ok(snapshot.features.every((feature) => {
  const [longitude, latitude] = feature.geometry.coordinates;
  return longitude >= -81.2 && longitude <= -74.8 && latitude >= -5.2 && latitude <= 1.7;
}));

console.log("Station module tests passed.");
