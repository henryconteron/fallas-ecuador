import assert from "node:assert/strict";

import { distanceToGeometryKm, haversineKm, nearestFeature } from "../assets/js/map/place.js";
import { SOURCE_CATALOG } from "../assets/js/map/source-catalog.js";

assert.ok(Math.abs(haversineKm([-78, 0], [-78, 1]) - 111.2) < 0.5);
assert.ok(distanceToGeometryKm([-78, 0], {
  type: "LineString",
  coordinates: [[-79, 0], [-77, 0]],
}) < 0.001);

const near = { type: "Feature", geometry: { type: "Point", coordinates: [-78, 0.1] } };
const far = { type: "Feature", geometry: { type: "Point", coordinates: [-75, 0] } };
assert.equal(nearestFeature([-78, 0], [far, near]).feature, near);
assert.ok(SOURCE_CATALOG.some((source) => source.id === "inamhi-services"));
assert.ok(SOURCE_CATALOG.every((source) => source.url.startsWith("https://")));

console.log("Place explainer and source catalog tests passed.");
