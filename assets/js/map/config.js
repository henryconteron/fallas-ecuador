export const ECUADOR_CONTINENTAL_BOUNDS = [[-5.15, -81.25], [1.65, -75.05]];

export const EARTHQUAKE_QUERY = Object.freeze({
  endpoint: "https://earthquake.usgs.gov/fdsnws/event/1/query",
  days: 30,
  minimumMagnitude: 3,
  limit: 20000,
  extent: {
    minlatitude: -5.5,
    maxlatitude: 2.5,
    minlongitude: -82.5,
    maxlongitude: -74.5,
  },
});

export const HILLSHADE = Object.freeze({
  url: "https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
  initialOpacity: 0.34,
  maxNativeZoom: 13,
  attribution: "Terrain: Esri, NASA, NGA, USGS and the GIS User Community",
});

export const DATASETS = Object.freeze({
  faults: {
    production: "data/geojson/fallas.geojson",
    demo: "data/geojson/fallas.demo.geojson",
    geometries: ["LineString", "MultiLineString"],
  },
  evidence: {
    production: "data/geojson/estructuras.geojson",
    demo: "data/geojson/estructuras.demo.geojson",
    geometries: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"],
  },
});

export const FAULT_COLORS = Object.freeze({
  inversa: "#ef4444",
  normal: "#38bdf8",
  dextral: "#f59e0b",
  sinestral: "#a78bfa",
  desconocido: "#e5e7eb",
});

export const EVIDENCE_COLORS = Object.freeze({
  escarpe: "#ef6f5d",
  faceta_triangular: "#f0b45b",
  drenaje_desplazado: "#42b7cd",
  laguna_sag: "#52c6a5",
});

export const EARTHQUAKE_COLORS = Object.freeze({
  shallow: "#ef4444",
  intermediate: "#f59e0b",
  deep: "#a78bfa",
  veryDeep: "#38bdf8",
});

export const SOURCE_REGISTRY = Object.freeze({
  SARA: {
    label: "SARA",
    citation: "Alvarado et al. (2017) — SARA Active Faults",
    repository: "https://github.com/GEMScienceTools/SARA-Active-Faults",
    publication: "https://doi.org/10.13117/SARA-ACTIVE-FAULTS",
    publicationLabel: "popup.saraDatasetCitation",
    contextPublication: "https://doi.org/10.1016/j.jsames.2020.102837",
    license: "CC BY-SA 4.0",
    metadataProfile: "sara",
  },
  ATA: {
    label: "ATA",
    citation: "Veloza et al. (2012) — Active Tectonics of the Andes",
    repository: "https://github.com/GEMScienceTools/gem-global-active-faults",
    publication: "https://doi.org/10.1130/GSAT-G156A.1",
    publicationLabel: "popup.ataSourcePaper",
    license: "CC BY-SA 4.0",
    metadataProfile: "ata",
  },
});

export const FAULT_METADATA_PROFILES = Object.freeze({
  sara: {
    coverage: "popup.profileSaraCoverage",
    limits: "popup.profileSaraLimits",
  },
  ata: {
    coverage: "popup.profileAtaCoverage",
    limits: "popup.profileAtaLimits",
  },
});
