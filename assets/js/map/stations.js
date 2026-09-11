export const STATION_DATA_URL = "data/geojson/estaciones-inamhi.geojson";

export const STATION_SOURCE = Object.freeze({
  endpoint:
    "https://inamhi.gob.ec/api_visor/station_information/estaciones/visores/?id_aplicacion=vs_1h_inh",
  viewer: "https://inamhi.gob.ec/info/visor/",
  institution: "INAMHI",
});

export const STATION_CATEGORIES = Object.freeze(["all", "meteorological", "hydrological", "mixed"]);

export function normalizeStationCategory(value) {
  const category = String(value || "").toUpperCase();
  if (category.includes("HIDRO") && category.includes("METEOR")) return "mixed";
  if (category.includes("HIDRO")) return "hydrological";
  return "meteorological";
}

export function filterStations(features, category = "all") {
  if (category === "all") return [...features];
  return features.filter(
    (feature) => normalizeStationCategory(feature.properties?.categoria) === category,
  );
}

export function stationMarkerOptions(feature) {
  const category = normalizeStationCategory(feature.properties?.categoria);
  const colors = {
    meteorological: "#f2b84b",
    hydrological: "#32b6d8",
    mixed: "#72dcc2",
  };
  return {
    radius: category === "mixed" ? 6 : 5,
    weight: 1.5,
    color: "#071215",
    fillColor: colors[category],
    fillOpacity: 0.9,
    opacity: 0.95,
    className: `station-marker station-marker-${category}`,
  };
}

export async function loadStationSnapshot(fetchImplementation = fetch) {
  const response = await fetchImplementation(STATION_DATA_URL);
  if (!response.ok) throw new Error(`Station snapshot request failed: ${response.status}`);
  const collection = await response.json();
  if (collection?.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
    throw new Error("Station snapshot is not a GeoJSON FeatureCollection");
  }
  return {
    features: collection.features,
    metadata: collection.metadata ?? {},
  };
}
