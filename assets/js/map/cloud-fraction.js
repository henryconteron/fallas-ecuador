export const CLOUD_FRACTION_SOURCE = Object.freeze({
  endpoint: "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi",
  layer: "MODIS_Aqua_Cloud_Fraction_Day",
  product: "Aqua MODIS L2 · día · 1/5 km",
  metadata:
    "https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/MODIS_Aqua_Cloud_Fraction_Day.json",
  attribution:
    'Cloud fraction: <a href="https://worldview.earthdata.nasa.gov/" target="_blank" rel="noopener">NASA Aqua MODIS / GIBS</a>',
});

export function isoCloudFractionDate(date) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) throw new Error("Invalid date");
  return value.toISOString().slice(0, 10);
}

export function cloudFractionDateRange(now = new Date()) {
  const latest = new Date(now);
  latest.setUTCHours(0, 0, 0, 0);
  latest.setUTCDate(latest.getUTCDate() - 1);
  const earliest = new Date(latest);
  earliest.setUTCDate(earliest.getUTCDate() - 60);
  return {
    min: isoCloudFractionDate(earliest),
    max: isoCloudFractionDate(latest),
    selected: isoCloudFractionDate(latest),
  };
}

export function normalizeCloudFractionDate(value, range) {
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : range.selected;
  if (candidate < range.min) return range.min;
  if (candidate > range.max) return range.max;
  return candidate;
}

export function cloudFractionWmsOptions(date, opacity = 0.68) {
  return {
    layers: CLOUD_FRACTION_SOURCE.layer,
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    time: date,
    opacity,
    attribution: CLOUD_FRACTION_SOURCE.attribution,
  };
}
