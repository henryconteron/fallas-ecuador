export const PRECIPITATION_SOURCE = Object.freeze({
  endpoint: "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi",
  layer: "IMERG_Precipitation_Rate",
  product: "GPM IMERG · 0.1° · visualización diaria",
  attribution:
    'Precipitation: <a href="https://gpm.nasa.gov/data/imerg" target="_blank" rel="noopener">NASA GPM IMERG / GIBS</a>',
});

export function isoPrecipitationDate(date) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) throw new Error("Invalid date");
  return value.toISOString().slice(0, 10);
}

export function precipitationDateRange(now = new Date()) {
  const latest = new Date(now);
  latest.setUTCHours(0, 0, 0, 0);
  latest.setUTCDate(latest.getUTCDate() - 2);
  const earliest = new Date(latest);
  earliest.setUTCDate(earliest.getUTCDate() - 60);
  return {
    min: isoPrecipitationDate(earliest),
    max: isoPrecipitationDate(latest),
    selected: isoPrecipitationDate(latest),
  };
}

export function normalizePrecipitationDate(value, range) {
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : range.selected;
  if (candidate < range.min) return range.min;
  if (candidate > range.max) return range.max;
  return candidate;
}

export function precipitationWmsOptions(date, opacity = 0.7) {
  return {
    layers: PRECIPITATION_SOURCE.layer,
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    time: date,
    opacity,
    attribution: PRECIPITATION_SOURCE.attribution,
  };
}
