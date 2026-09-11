export const THERMAL_SOURCE = Object.freeze({
  endpoint: "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi",
  layer: "VIIRS_NOAA20_Thermal_Anomalies_375m_All",
  sensor: "VIIRS NOAA-20 · 375 m",
  attribution:
    'Thermal anomalies: <a href="https://earthdata.nasa.gov/firms" target="_blank" rel="noopener">NASA FIRMS / GIBS</a>',
});

export function isoDateUtc(date) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) throw new Error("Invalid date");
  return value.toISOString().slice(0, 10);
}

export function thermalDateRange(now = new Date()) {
  const latest = new Date(now);
  latest.setUTCHours(0, 0, 0, 0);
  latest.setUTCDate(latest.getUTCDate() - 1);
  const earliest = new Date(latest);
  earliest.setUTCDate(earliest.getUTCDate() - 30);
  return { min: isoDateUtc(earliest), max: isoDateUtc(latest), selected: isoDateUtc(latest) };
}

export function normalizeThermalDate(value, range) {
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : range.selected;
  if (candidate < range.min) return range.min;
  if (candidate > range.max) return range.max;
  return candidate;
}

export function thermalWmsOptions(date, opacity = 0.88) {
  return {
    layers: THERMAL_SOURCE.layer,
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    time: date,
    opacity,
    attribution: THERMAL_SOURCE.attribution,
  };
}

