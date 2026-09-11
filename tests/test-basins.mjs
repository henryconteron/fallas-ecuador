import assert from "node:assert/strict";

import {
  BASIN_SOURCE,
  basinLookupUrl,
  basinWmsOptions,
  normalizeBasinPoint,
} from "../assets/js/map/basins.js";

assert.equal(BASIN_SOURCE.layer, "geonode:cuencas_maate");
assert.equal(basinWmsOptions().transparent, true);
assert.equal(basinWmsOptions().version, "1.1.1");
assert.deepEqual(normalizeBasinPoint("-78.5", "-0.2"), [-78.5, -0.2]);
assert.equal(normalizeBasinPoint(-200, 0), null);

const lookup = new URL(basinLookupUrl(-78.5, -0.2, "testCallback"));
assert.equal(lookup.searchParams.get("service"), "WFS");
assert.equal(lookup.searchParams.get("typeName"), BASIN_SOURCE.layer);
assert.equal(lookup.searchParams.get("format_options"), "callback:testCallback");
assert.equal(lookup.searchParams.get("propertyName"), "nombre_cue,codigo_sis,nombre_sis");
assert.equal(lookup.searchParams.get("CQL_FILTER"), "INTERSECTS(geometry,POINT(-78.5 -0.2))");

console.log("Watershed module tests passed.");
