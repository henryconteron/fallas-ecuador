export const AIR_TEMPERATURE_SOURCE = Object.freeze({
  endpoint: "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi",
  layer: "AIRS_L3_Surface_Air_Temperature_Daily_Day",
  product: "Aqua AIRS L3 · día · 1°",
  metadata:
    "https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/AIRS_L3_Surface_Air_Temperature_Daily_Day.json",
  attribution:
    'Air temperature: <a href="https://worldview.earthdata.nasa.gov/" target="_blank" rel="noopener">NASA Aqua AIRS / GIBS</a>',
});

export function isoAirTemperatureDate(date) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) throw new Error("Invalid date");
  return value.toISOString().slice(0, 10);
}

export function airTemperatureDateRange(now = new Date()) {
  const latest = new Date(now);
  latest.setUTCHours(0, 0, 0, 0);
  latest.setUTCDate(latest.getUTCDate() - 6);
  const earliest = new Date(latest);
  earliest.setUTCDate(earliest.getUTCDate() - 90);
  return {
    min: isoAirTemperatureDate(earliest),
    max: isoAirTemperatureDate(latest),
    selected: isoAirTemperatureDate(latest),
  };
}

export function normalizeAirTemperatureDate(value, range) {
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : range.selected;
  if (candidate < range.min) return range.min;
  if (candidate > range.max) return range.max;
  return candidate;
}

export function airTemperatureWmsOptions(date, opacity = 0.72) {
  return {
    layers: AIR_TEMPERATURE_SOURCE.layer,
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    time: date,
    opacity,
    attribution: AIR_TEMPERATURE_SOURCE.attribution,
  };
}
