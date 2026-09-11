export const FLOOD_SOURCE = Object.freeze({
  endpoint: "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi",
  layer: "VIIRS_Combined_Flood_1-Day",
  product: "NOAA-20 + NOAA-21 VIIRS · 250 m · ventana de 1 día",
  attribution:
    'Flood extent: <a href="https://www.earthdata.nasa.gov/data/instruments/viirs" target="_blank" rel="noopener">NASA LANCE VIIRS / GIBS</a>',
});

export function isoFloodDate(date) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) throw new Error("Invalid date");
  return value.toISOString().slice(0, 10);
}

export function floodDateRange(now = new Date()) {
  const latest = new Date(now);
  latest.setUTCHours(0, 0, 0, 0);
  latest.setUTCDate(latest.getUTCDate() - 3);
  const earliest = new Date(latest);
  earliest.setUTCDate(earliest.getUTCDate() - 45);
  return { min: isoFloodDate(earliest), max: isoFloodDate(latest), selected: isoFloodDate(latest) };
}

export function normalizeFloodDate(value, range) {
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : range.selected;
  if (candidate < range.min) return range.min;
  if (candidate > range.max) return range.max;
  return candidate;
}

export function floodWmsOptions(date, opacity = 0.78) {
  return {
    layers: FLOOD_SOURCE.layer,
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    time: date,
    opacity,
    attribution: FLOOD_SOURCE.attribution,
  };
}
