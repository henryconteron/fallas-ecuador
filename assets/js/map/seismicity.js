import { EARTHQUAKE_QUERY } from "./config.js";
import { earthquakeDepthClass } from "./symbology.js";

export const EARTHQUAKE_DEPTH_FILTERS = Object.freeze([
  "all",
  "shallow",
  "intermediate",
  "deep",
  "veryDeep",
]);

export function normalizeEarthquakeFilters(filters = {}) {
  const days = Number(filters.days);
  const minimumMagnitude = Number(filters.minimumMagnitude);
  const depth = EARTHQUAKE_DEPTH_FILTERS.includes(filters.depth) ? filters.depth : "all";
  return {
    days: Number.isFinite(days) ? Math.min(365, Math.max(1, Math.round(days))) : EARTHQUAKE_QUERY.days,
    minimumMagnitude: Number.isFinite(minimumMagnitude)
      ? Math.min(9, Math.max(0, minimumMagnitude))
      : EARTHQUAKE_QUERY.minimumMagnitude,
    depth,
  };
}

export function filterEarthquakes(features, filters = {}) {
  const normalized = normalizeEarthquakeFilters(filters);
  if (normalized.depth === "all") return features.slice();
  return features.filter((feature) => earthquakeDepthClass(feature) === normalized.depth);
}
