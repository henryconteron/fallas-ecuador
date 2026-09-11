import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SOURCE_URL =
  "https://inamhi.gob.ec/api_visor/station_information/estaciones/visores/?id_aplicacion=vs_1h_inh";
const OFFICIAL_VIEWER = "https://inamhi.gob.ec/info/visor/";
const DEFAULT_OUTPUT = "data/geojson/estaciones-inamhi.geojson";
const CONTINENTAL_BOUNDS = Object.freeze({ west: -81.2, south: -5.2, east: -74.8, north: 1.7 });

function outputArgument() {
  const index = process.argv.indexOf("--output");
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : DEFAULT_OUTPUT;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isContinental(longitude, latitude) {
  return (
    longitude >= CONTINENTAL_BOUNDS.west &&
    longitude <= CONTINENTAL_BOUNDS.east &&
    latitude >= CONTINENTAL_BOUNDS.south &&
    latitude <= CONTINENTAL_BOUNDS.north
  );
}

function featureFromStation(station) {
  const longitude = numberOrNull(station.longitud);
  const latitude = numberOrNull(station.latitud);
  if (longitude === null || latitude === null || !isContinental(longitude, latitude)) return null;
  if (Number(station.id_estado_transmision) !== 1) return null;

  return {
    type: "Feature",
    id: `inamhi-${station.id_estacion}`,
    geometry: { type: "Point", coordinates: [longitude, latitude] },
    properties: {
      id_estacion: Number(station.id_estacion),
      codigo: station.codigo || null,
      nombre: station.punto_obs || null,
      categoria: station.categoria || null,
      captor: station.captor || null,
      estado: station.estado_transmision || null,
      propietario: station.propietario || null,
      provincia: station.provincia || null,
      canton: station.canton || null,
      altitud_m: numberOrNull(station.altitud),
    },
  };
}

const response = await fetch(SOURCE_URL, {
  headers: { Accept: "application/json", "User-Agent": "Ecuador-Vivo-atlas/1.0" },
});
if (!response.ok) throw new Error(`INAMHI request failed: ${response.status} ${response.statusText}`);

const records = await response.json();
if (!Array.isArray(records)) throw new Error("INAMHI response is not an array");

const features = records
  .map(featureFromStation)
  .filter(Boolean)
  .sort((left, right) => String(left.properties.codigo).localeCompare(String(right.properties.codigo)));

const collection = {
  type: "FeatureCollection",
  metadata: {
    title: "Estaciones hidrometeorológicas continentales en transmisión",
    source: SOURCE_URL,
    officialViewer: OFFICIAL_VIEWER,
    retrievedAt: new Date().toISOString(),
    sourceRecordCount: records.length,
    featureCount: features.length,
    filters: {
      transmissionStatus: "TRANSMITIENDO",
      continentalBounds: CONTINENTAL_BOUNDS,
    },
    note:
      "Instantánea de ubicación y estado de transmisión. No contiene observaciones, pronósticos ni series temporales.",
  },
  features,
};

const output = resolve(outputArgument());
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(collection, null, 2)}\n`, "utf8");
console.log(`Wrote ${features.length} transmitting continental stations to ${output}`);
