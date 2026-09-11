import assert from "node:assert/strict";

import {
  ATLAS_SYSTEMS,
  contentBelongsToSystem,
  normalizeAtlasSystem,
} from "../assets/js/map/systems.js";
import { catalogForSystem } from "../assets/js/map/source-catalog.js";

assert.deepEqual(ATLAS_SYSTEMS, ["earth", "water", "sky", "life", "risk"]);
assert.equal(normalizeAtlasSystem("water"), "water");
assert.equal(normalizeAtlasSystem("unknown"), "earth");
assert.equal(contentBelongsToSystem("water sky", "sky"), true);
assert.equal(contentBelongsToSystem("water risk", "life"), false);
assert.deepEqual(
  catalogForSystem("es", "risk").map((source) => source.id),
  ["inamhi-services", "nasa-viirs-flood"],
);

console.log("Atlas system navigation tests passed.");
