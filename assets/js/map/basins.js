export const BASIN_SOURCE = Object.freeze({
  endpoint: "https://geoservicios.inamhi.gob.ec/geoserver/ows",
  layer: "geonode:cuencas_maate",
  detailUrl: "https://geoservicios.inamhi.gob.ec/catalogue/#/dataset/8",
  attribution:
    'Watershed service: <a href="https://geoservicios.inamhi.gob.ec/catalogue/#/dataset/8" target="_blank" rel="noopener">INAMHI / MAATE</a>',
});

export function basinWmsOptions() {
  return {
    layers: BASIN_SOURCE.layer,
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    attribution: BASIN_SOURCE.attribution,
  };
}

export function normalizeBasinPoint(longitude, latitude) {
  const lon = Number(longitude);
  const lat = Number(latitude);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return null;
  return [lon, lat];
}

export function basinLookupUrl(longitude, latitude, callbackName) {
  const point = normalizeBasinPoint(longitude, latitude);
  if (!point) throw new TypeError("Invalid basin lookup coordinates");
  if (!/^[A-Za-z_$][\w$]*$/.test(callbackName)) throw new TypeError("Invalid JSONP callback name");

  const [lon, lat] = point;
  const parameters = new URLSearchParams({
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    typeName: BASIN_SOURCE.layer,
    outputFormat: "text/javascript",
    format_options: `callback:${callbackName}`,
    propertyName: "nombre_cue,codigo_sis,nombre_sis",
    CQL_FILTER: `INTERSECTS(geometry,POINT(${lon} ${lat}))`,
    srsName: "EPSG:4326",
  });
  return `${BASIN_SOURCE.endpoint}?${parameters}`;
}

export function queryBasinAtPoint(longitude, latitude, options = {}) {
  const documentRef = options.documentRef ?? document;
  const windowRef = options.windowRef ?? window;
  const timeoutMs = options.timeoutMs ?? 12000;
  const callbackName = `atlasBasinCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  return new Promise((resolve, reject) => {
    const script = documentRef.createElement("script");
    const cleanup = () => {
      clearTimeout(timeout);
      script.remove();
      delete windowRef[callbackName];
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Basin lookup timed out"));
    }, timeoutMs);

    windowRef[callbackName] = (collection) => {
      const feature = collection?.features?.[0] ?? null;
      cleanup();
      resolve(feature?.properties ?? null);
    };
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error("Basin lookup failed"));
    };
    script.src = basinLookupUrl(longitude, latitude, callbackName);
    documentRef.head.append(script);
  });
}
