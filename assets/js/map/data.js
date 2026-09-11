import { EARTHQUAKE_QUERY } from "./config.js";

export function buildEarthquakeUrl(
  now = new Date(),
  {
    days = EARTHQUAKE_QUERY.days,
    minimumMagnitude = EARTHQUAKE_QUERY.minimumMagnitude,
  } = {},
) {
  const endDate = new Date(now);
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - days);
  const parameters = new URLSearchParams({
    format: "geojson",
    starttime: startDate.toISOString(),
    endtime: endDate.toISOString(),
    minmagnitude: String(minimumMagnitude),
    eventtype: "earthquake",
    orderby: "time",
    limit: String(EARTHQUAKE_QUERY.limit),
    ...Object.fromEntries(
      Object.entries(EARTHQUAKE_QUERY.extent).map(([key, value]) => [key, String(value)]),
    ),
  });
  return `${EARTHQUAKE_QUERY.endpoint}?${parameters}`;
}

export function validateFeatureCollection(data, acceptedGeometry) {
  if (data?.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw new Error("Invalid GeoJSON FeatureCollection");
  }
  const invalidFeature = data.features.find(
    (feature) => feature?.type !== "Feature" || !acceptedGeometry.includes(feature.geometry?.type),
  );
  if (invalidFeature) throw new Error("Unsupported GeoJSON geometry");
  return data.features;
}

export async function loadGeoJson(url, acceptedGeometry) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
  return validateFeatureCollection(await response.json(), acceptedGeometry);
}

export async function loadRecentEarthquakes({
  timeoutMs = 15000,
  days = EARTHQUAKE_QUERY.days,
  minimumMagnitude = EARTHQUAKE_QUERY.minimumMagnitude,
} = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(buildEarthquakeUrl(new Date(), { days, minimumMagnitude }), {
      cache: "no-store",
      headers: { Accept: "application/geo+json, application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`USGS query failed (${response.status})`);
    const data = await response.json();
    const features = validateFeatureCollection(data, ["Point"]).filter(
      (feature) => Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.length >= 2,
    );
    return {
      features,
      generatedAt: Number(data.metadata?.generated) || Date.now(),
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
