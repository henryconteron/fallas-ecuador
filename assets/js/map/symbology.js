import { EARTHQUAKE_COLORS, EVIDENCE_COLORS, FAULT_COLORS } from "./config.js";
import { normalize } from "./utils.js";

export function movementOf(feature) {
  const value = normalize(feature.properties?.tipo_movimiento);
  return Object.prototype.hasOwnProperty.call(FAULT_COLORS, value) ? value : "desconocido";
}

export function faultStyle(feature, selectedFeature) {
  const movement = movementOf(feature);
  const patterns = {
    inversa: undefined,
    normal: "10 5",
    dextral: "14 4 3 4",
    sinestral: "3 5",
    desconocido: "6 6",
  };
  return {
    color: FAULT_COLORS[movement],
    weight: feature === selectedFeature ? 6 : 3,
    opacity: feature === selectedFeature ? 1 : 0.92,
    dashArray: patterns[movement],
  };
}

export function evidenceStyle(feature) {
  const type = feature.properties?.tipo;
  const color = EVIDENCE_COLORS[type] ?? "#6ee7c8";
  const polygon = ["Polygon", "MultiPolygon"].includes(feature.geometry?.type);
  return {
    color,
    weight: type === "escarpe" ? 4 : 3,
    opacity: 0.95,
    dashArray: type === "drenaje_desplazado" ? "8 5" : undefined,
    fill: polygon,
    fillColor: color,
    fillOpacity: polygon ? 0.22 : 0,
  };
}

export function evidencePointOptions(feature) {
  return {
    radius: 8,
    weight: 2,
    color: "#102523",
    fillColor: EVIDENCE_COLORS[feature.properties?.tipo] ?? "#6ee7c8",
    fillOpacity: 0.96,
    className: `evidence-marker evidence-${feature.properties?.tipo ?? "unknown"}`,
  };
}

export function earthquakeDepthClass(feature) {
  const depth = Number(feature.geometry?.coordinates?.[2]);
  if (!Number.isFinite(depth) || depth <= 30) return "shallow";
  if (depth <= 70) return "intermediate";
  if (depth <= 300) return "deep";
  return "veryDeep";
}

export function earthquakeColor(feature) {
  return EARTHQUAKE_COLORS[earthquakeDepthClass(feature)];
}

export function earthquakeDashArray(feature) {
  const patterns = {
    shallow: undefined,
    intermediate: "4 2",
    deep: "2 3",
    veryDeep: "7 3",
  };
  return patterns[earthquakeDepthClass(feature)];
}
