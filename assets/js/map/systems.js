export const ATLAS_SYSTEMS = Object.freeze(["earth", "water", "sky", "life", "risk"]);

export function normalizeAtlasSystem(value) {
  return ATLAS_SYSTEMS.includes(value) ? value : "earth";
}

export function contentBelongsToSystem(value, system) {
  const activeSystem = normalizeAtlasSystem(system);
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .includes(activeSystem);
}
