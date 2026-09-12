import {
  DATASETS,
  ECUADOR_CONTINENTAL_BOUNDS,
  HILLSHADE,
  SOURCE_REGISTRY,
} from "./map/config.js";
import { loadGeoJson, loadRecentEarthquakes } from "./map/data.js";
import { BASIN_SOURCE, basinWmsOptions, queryBasinAtPoint } from "./map/basins.js";
import {
  earthquakeColor,
  earthquakeDashArray,
  evidencePointOptions,
  evidenceStyle,
  faultStyle,
  movementOf,
} from "./map/symbology.js";
import { filterEarthquakes, normalizeEarthquakeFilters } from "./map/seismicity.js";
import {
  createEarthquakePopup as buildEarthquakePopup,
  createEvidencePopup as buildEvidencePopup,
  createFaultPopup as buildFaultPopup,
} from "./map/popups.js";
import { nearestFeature } from "./map/place.js";
import { floodDateRange, FLOOD_SOURCE, floodWmsOptions, normalizeFloodDate } from "./map/flood.js";
import {
  AIR_TEMPERATURE_SOURCE,
  airTemperatureDateRange,
  airTemperatureWmsOptions,
  normalizeAirTemperatureDate,
} from "./map/air-temperature.js";
import {
  CLOUD_FRACTION_SOURCE,
  cloudFractionDateRange,
  cloudFractionWmsOptions,
  normalizeCloudFractionDate,
} from "./map/cloud-fraction.js";
import {
  normalizePrecipitationDate,
  precipitationDateRange,
  PRECIPITATION_SOURCE,
  precipitationWmsOptions,
} from "./map/precipitation.js";
import { catalogForSystem } from "./map/source-catalog.js";
import {
  filterStations,
  loadStationSnapshot,
  normalizeStationCategory,
  STATION_SOURCE,
  stationMarkerOptions,
} from "./map/stations.js";
import { ATLAS_SYSTEMS, contentBelongsToSystem, normalizeAtlasSystem } from "./map/systems.js";
import { normalizeThermalDate, thermalDateRange, THERMAL_SOURCE, thermalWmsOptions } from "./map/thermal.js";
import { catalogKey, createTextTools, normalize } from "./map/utils.js";

const mapElement = document.querySelector("#map");
const mapError = document.querySelector("#map-error");
const i18n = window.atlasI18n;
const { t, template, formatNumber, formatUtcDate, localizedProperty } = createTextTools(i18n);

if (typeof window.L === "undefined") {
  mapElement.setAttribute("aria-hidden", "true");
  document.querySelector("#reset-view").disabled = true;
  document.querySelector("#fault-toggle").disabled = true;
  document.querySelector("#basin-toggle").disabled = true;
  document.querySelector("#station-toggle").disabled = true;
  document.querySelector("#air-temperature-toggle").disabled = true;
  document.querySelector("#cloud-fraction-toggle").disabled = true;
  document.querySelector("#flood-toggle").disabled = true;
  document.querySelector("#earthquake-toggle").disabled = true;
  document.querySelector(".legend").hidden = true;
  mapError.hidden = false;

  const catalogState = document.querySelector("#catalog-state");
  catalogState.querySelector("strong").textContent = t("catalog.viewerErrorTitle");
  catalogState.querySelector("p").textContent = t("errors.checkConnection");
} else {
  initializeAtlas();
}

function initializeAtlas() {
  const L = window.L;
  const ecuadorBounds = L.latLngBounds(ECUADOR_CONTINENTAL_BOUNDS);
  const urlParameters = new URLSearchParams(window.location.search);
  const demoMode = urlParameters.get("demo") === "1";
  document.body.classList.toggle("is-demo", demoMode);
  const catalogUrl = demoMode ? DATASETS.faults.demo : DATASETS.faults.production;
  const evidenceUrl = demoMode ? DATASETS.evidence.demo : DATASETS.evidence.production;

  const map = L.map("map", { zoomControl: false, minZoom: 5, maxZoom: 18 }).fitBounds(
    ecuadorBounds,
  );
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.control.scale({ imperial: false, position: "topright" }).addTo(map);

  const basemaps = {
    topographic: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    }),
    streets: L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }),
  };

  let activeBasemap = basemaps.topographic.addTo(map);
  let tileErrors = 0;

  function monitorTiles(layer) {
    layer.on("tileerror", () => {
      tileErrors += 1;
      if (tileErrors >= 4 && document.querySelectorAll(".leaflet-tile-loaded").length === 0) {
        mapError.querySelector("strong").textContent = t("errors.mapUnavailable");
        mapError.querySelector("p").textContent = t("errors.checkConnection");
        mapError.hidden = false;
      }
    });
    layer.on("load", () => {
      tileErrors = 0;
      mapError.hidden = true;
    });
  }
  Object.values(basemaps).forEach(monitorTiles);

  map.createPane("terrain-relief");
  const terrainPane = map.getPane("terrain-relief");
  terrainPane.style.zIndex = "250";
  terrainPane.style.pointerEvents = "none";
  terrainPane.style.mixBlendMode = "multiply";
  const hillshadeLayer = L.tileLayer(HILLSHADE.url, {
    pane: "terrain-relief",
    maxNativeZoom: HILLSHADE.maxNativeZoom,
    maxZoom: 18,
    opacity: HILLSHADE.initialOpacity,
    attribution: HILLSHADE.attribution,
  }).addTo(map);

  map.createPane("hydrographic-basins");
  map.getPane("hydrographic-basins").style.zIndex = "260";
  const basinLayer = L.tileLayer.wms(
    BASIN_SOURCE.endpoint,
    { ...basinWmsOptions(), pane: "hydrographic-basins", opacity: 0.34 },
  );

  map.createPane("observation-stations");
  map.getPane("observation-stations").style.zIndex = "350";
  const stationRenderer = L.canvas({ pane: "observation-stations", padding: 0.35 });
  const stationLayer = L.geoJSON(null, {
    pointToLayer(feature, latlng) {
      return L.circleMarker(latlng, {
        ...stationMarkerOptions(feature),
        pane: "observation-stations",
        renderer: stationRenderer,
      });
    },
    onEachFeature(feature, layer) {
      layer.bindPopup(createStationPopup(feature));
      layer.bindTooltip(feature.properties?.codigo || t("value.unavailable"), {
        direction: "top",
        offset: [0, -4],
      });
    },
  });

  const precipitationRange = precipitationDateRange();
  map.createPane("precipitation");
  map.getPane("precipitation").style.zIndex = "270";
  const precipitationLayer = L.tileLayer.wms(
    PRECIPITATION_SOURCE.endpoint,
    { ...precipitationWmsOptions(precipitationRange.selected), pane: "precipitation" },
  );

  const airTemperatureRange = airTemperatureDateRange();
  map.createPane("air-temperature");
  map.getPane("air-temperature").style.zIndex = "280";
  const airTemperatureLayer = L.tileLayer.wms(
    AIR_TEMPERATURE_SOURCE.endpoint,
    { ...airTemperatureWmsOptions(airTemperatureRange.selected), pane: "air-temperature" },
  );

  const cloudFractionRange = cloudFractionDateRange();
  map.createPane("cloud-fraction");
  map.getPane("cloud-fraction").style.zIndex = "285";
  const cloudFractionLayer = L.tileLayer.wms(
    CLOUD_FRACTION_SOURCE.endpoint,
    { ...cloudFractionWmsOptions(cloudFractionRange.selected), pane: "cloud-fraction" },
  );

  const floodRange = floodDateRange();
  map.createPane("flood-observation");
  map.getPane("flood-observation").style.zIndex = "290";
  const floodLayer = L.tileLayer.wms(
    FLOOD_SOURCE.endpoint,
    { ...floodWmsOptions(floodRange.selected), pane: "flood-observation" },
  );

  const thermalRange = thermalDateRange();
  map.createPane("thermal-anomalies");
  map.getPane("thermal-anomalies").style.zIndex = "370";
  const thermalLayer = L.tileLayer.wms(
    THERMAL_SOURCE.endpoint,
    { ...thermalWmsOptions(thermalRange.selected), pane: "thermal-anomalies" },
  );

  const elements = {
    search: document.querySelector("#fault-search"),
    movement: document.querySelector("#movement-filter"),
    clear: document.querySelector("#clear-filters"),
    reset: document.querySelector("#reset-view"),
    count: document.querySelector("#fault-count"),
    evidenceCount: document.querySelector("#evidence-count"),
    earthquakeCount: document.querySelector("#earthquake-count"),
    resultCount: document.querySelector("#result-count"),
    sourceCount: document.querySelector("#source-count"),
    hillshadeToggle: document.querySelector("#hillshade-toggle"),
    hillshadeOpacity: document.querySelector("#hillshade-opacity"),
    hillshadeOpacityValue: document.querySelector("#hillshade-opacity-value"),
    faultToggle: document.querySelector("#fault-toggle"),
    evidenceToggle: document.querySelector("#evidence-toggle"),
    basinToggle: document.querySelector("#basin-toggle"),
    basinOpacity: document.querySelector("#basin-opacity"),
    basinOpacityValue: document.querySelector("#basin-opacity-value"),
    basinStatus: document.querySelector("#basin-status"),
    stationToggle: document.querySelector("#station-toggle"),
    stationCategory: document.querySelector("#station-category"),
    stationStatus: document.querySelector("#station-status"),
    stationRetrievedAt: document.querySelector("#station-retrieved-at"),
    precipitationCard: document.querySelector("#precipitation-layer-card"),
    precipitationToggle: document.querySelector("#precipitation-toggle"),
    precipitationDate: document.querySelector("#precipitation-date"),
    precipitationOpacity: document.querySelector("#precipitation-opacity"),
    precipitationOpacityValue: document.querySelector("#precipitation-opacity-value"),
    precipitationStatus: document.querySelector("#precipitation-status"),
    airTemperatureCard: document.querySelector("#air-temperature-layer-card"),
    airTemperatureToggle: document.querySelector("#air-temperature-toggle"),
    airTemperatureDate: document.querySelector("#air-temperature-date"),
    airTemperatureOpacity: document.querySelector("#air-temperature-opacity"),
    airTemperatureOpacityValue: document.querySelector("#air-temperature-opacity-value"),
    airTemperatureStatus: document.querySelector("#air-temperature-status"),
    cloudFractionCard: document.querySelector("#cloud-fraction-layer-card"),
    cloudFractionToggle: document.querySelector("#cloud-fraction-toggle"),
    cloudFractionDate: document.querySelector("#cloud-fraction-date"),
    cloudFractionOpacity: document.querySelector("#cloud-fraction-opacity"),
    cloudFractionOpacityValue: document.querySelector("#cloud-fraction-opacity-value"),
    cloudFractionStatus: document.querySelector("#cloud-fraction-status"),
    floodCard: document.querySelector("#flood-layer-card"),
    floodToggle: document.querySelector("#flood-toggle"),
    floodDate: document.querySelector("#flood-date"),
    floodOpacity: document.querySelector("#flood-opacity"),
    floodOpacityValue: document.querySelector("#flood-opacity-value"),
    floodStatus: document.querySelector("#flood-status"),
    thermalCard: document.querySelector("#thermal-layer-card"),
    thermalToggle: document.querySelector("#thermal-toggle"),
    thermalDate: document.querySelector("#thermal-date"),
    thermalOpacity: document.querySelector("#thermal-opacity"),
    thermalOpacityValue: document.querySelector("#thermal-opacity-value"),
    thermalStatus: document.querySelector("#thermal-status"),
    earthquakeToggle: document.querySelector("#earthquake-toggle"),
    earthquakeDays: document.querySelector("#earthquake-days"),
    earthquakeMinimumMagnitude: document.querySelector("#earthquake-min-magnitude"),
    earthquakeMinimumMagnitudeValue: document.querySelector("#earthquake-min-magnitude-value"),
    earthquakeDepthFilter: document.querySelector("#earthquake-depth-filter"),
    earthquakeStatus: document.querySelector("#earthquake-status"),
    earthquakeList: document.querySelector("#earthquake-list"),
    earthquakeListCount: document.querySelector("#earthquake-list-count"),
    list: document.querySelector("#fault-list"),
    state: document.querySelector("#catalog-state"),
    legend: document.querySelector(".legend"),
    legendEmpty: document.querySelector("#legend-empty"),
    legendSections: [...document.querySelectorAll("[data-legend-layer]")],
    dataMode: document.querySelector("#data-mode"),
    projectStatus: document.querySelector(".project-status"),
    statusFull: document.querySelector(".status-full"),
    statusShort: document.querySelector(".status-short"),
    basemapButtons: [...document.querySelectorAll("[data-basemap]")],
    systemButtons: [...document.querySelectorAll("[data-system]")],
    systemNote: document.querySelector("#system-note"),
    systemContent: [...document.querySelectorAll("[data-system-content]")],
    sidebar: document.querySelector(".sidebar"),
    systemEyebrow: document.querySelector("#system-eyebrow"),
    systemIntroTitle: document.querySelector("#system-intro-title"),
    systemIntroCopy: document.querySelector("#system-intro-copy"),
    layersTitle: document.querySelector("#layers-title"),
    explainPlace: document.querySelector("#explain-place"),
    placeExplainer: document.querySelector("#place-explainer"),
    closePlaceExplainer: document.querySelector("#close-place-explainer"),
    placeInstruction: document.querySelector("#place-instruction"),
    placeResults: document.querySelector("#place-results"),
    sourceNetworkList: document.querySelector("#source-network-list"),
    sourceNetworkBadge: document.querySelector("#source-network-badge"),
  };

  if (demoMode) {
    elements.dataMode.hidden = false;
    elements.projectStatus.setAttribute("aria-label", t("status.synthetic"));
    elements.statusFull.textContent = t("status.synthetic");
    elements.statusFull.removeAttribute("data-i18n");
    elements.statusShort.textContent = "Demo";
  }

  const compactLegend = window.matchMedia("(max-width: 30rem)");
  const updateLegendMode = (mediaQuery) => {
    elements.legend.open = !mediaQuery.matches;
  };
  updateLegendMode(compactLegend);
  compactLegend.addEventListener?.("change", updateLegendMode);

  let catalog = [];
  let evidenceCatalog = [];
  let earthquakeCatalog = [];
  let visibleEarthquakeCatalog = [];
  let earthquakeGeneratedAt = null;
  let earthquakeState = "loading";
  let earthquakeRequestId = 0;
  let earthquakeAttributionAdded = false;
  let selectedFeature = null;
  let selectedPoint = null;
  let placeMode = false;
  let activeSystem = normalizeAtlasSystem(urlParameters.get("system"));
  let basinState = "off";
  let basinTileErrors = 0;
  let basinLookupState = "idle";
  let selectedBasin = null;
  let basinLookupRequestId = 0;
  let stationCatalog = [];
  let visibleStationCatalog = [];
  let stationMetadata = {};
  let stationState = "loading";
  let precipitationState = "off";
  let precipitationTileErrors = 0;
  let airTemperatureState = "off";
  let airTemperatureTileErrors = 0;
  let cloudFractionState = "off";
  let cloudFractionTileErrors = 0;
  let floodState = "off";
  let floodTileErrors = 0;
  let thermalState = "off";
  let thermalTileErrors = 0;
  const featureIds = new WeakMap();

  elements.precipitationDate.min = precipitationRange.min;
  elements.precipitationDate.max = precipitationRange.max;
  elements.precipitationDate.value = precipitationRange.selected;
  elements.airTemperatureDate.min = airTemperatureRange.min;
  elements.airTemperatureDate.max = airTemperatureRange.max;
  elements.airTemperatureDate.value = airTemperatureRange.selected;
  elements.cloudFractionDate.min = cloudFractionRange.min;
  elements.cloudFractionDate.max = cloudFractionRange.max;
  elements.cloudFractionDate.value = cloudFractionRange.selected;
  elements.floodDate.min = floodRange.min;
  elements.floodDate.max = floodRange.max;
  elements.floodDate.value = floodRange.selected;
  elements.thermalDate.min = thermalRange.min;
  elements.thermalDate.max = thermalRange.max;
  elements.thermalDate.value = thermalRange.selected;

  function updateBasinStatus() {
    elements.basinStatus.dataset.state = basinState;
    elements.basinStatus.textContent = t(`basins.${basinState}`);
  }

  basinLayer.on("loading", () => {
    if (!map.hasLayer(basinLayer)) return;
    basinState = "loading";
    basinTileErrors = 0;
    updateBasinStatus();
  });
  basinLayer.on("load", () => {
    if (!map.hasLayer(basinLayer)) return;
    basinState = basinTileErrors >= 2 ? "error" : "loaded";
    updateBasinStatus();
  });
  basinLayer.on("tileerror", () => {
    basinTileErrors += 1;
    if (basinTileErrors >= 2) {
      basinState = "error";
      updateBasinStatus();
    }
  });

  function updatePrecipitationStatus() {
    elements.precipitationStatus.dataset.state = precipitationState;
    if (precipitationState === "off") {
      elements.precipitationStatus.textContent = t("precipitation.off");
    } else if (precipitationState === "loading") {
      elements.precipitationStatus.textContent = template("precipitation.loading", {
        date: elements.precipitationDate.value,
      });
    } else if (precipitationState === "error") {
      elements.precipitationStatus.textContent = t("precipitation.error");
    } else {
      elements.precipitationStatus.textContent = template("precipitation.loaded", {
        date: elements.precipitationDate.value,
      });
    }
  }

  precipitationLayer.on("loading", () => {
    if (!map.hasLayer(precipitationLayer)) return;
    precipitationState = "loading";
    precipitationTileErrors = 0;
    updatePrecipitationStatus();
  });
  precipitationLayer.on("load", () => {
    if (!map.hasLayer(precipitationLayer)) return;
    precipitationState = precipitationTileErrors >= 2 ? "error" : "loaded";
    updatePrecipitationStatus();
  });
  precipitationLayer.on("tileerror", () => {
    precipitationTileErrors += 1;
    if (precipitationTileErrors >= 2) {
      precipitationState = "error";
      updatePrecipitationStatus();
    }
  });

  function updateAirTemperatureStatus() {
    elements.airTemperatureStatus.dataset.state = airTemperatureState;
    if (airTemperatureState === "off") {
      elements.airTemperatureStatus.textContent = t("airTemperature.off");
    } else if (airTemperatureState === "loading") {
      elements.airTemperatureStatus.textContent = template("airTemperature.loading", {
        date: elements.airTemperatureDate.value,
      });
    } else if (airTemperatureState === "error") {
      elements.airTemperatureStatus.textContent = t("airTemperature.error");
    } else {
      elements.airTemperatureStatus.textContent = template("airTemperature.loaded", {
        date: elements.airTemperatureDate.value,
      });
    }
  }

  airTemperatureLayer.on("loading", () => {
    if (!map.hasLayer(airTemperatureLayer)) return;
    airTemperatureState = "loading";
    airTemperatureTileErrors = 0;
    updateAirTemperatureStatus();
  });
  airTemperatureLayer.on("load", () => {
    if (!map.hasLayer(airTemperatureLayer)) return;
    airTemperatureState = airTemperatureTileErrors >= 2 ? "error" : "loaded";
    updateAirTemperatureStatus();
  });
  airTemperatureLayer.on("tileerror", () => {
    airTemperatureTileErrors += 1;
    if (airTemperatureTileErrors >= 2) {
      airTemperatureState = "error";
      updateAirTemperatureStatus();
    }
  });

  function updateCloudFractionStatus() {
    elements.cloudFractionStatus.dataset.state = cloudFractionState;
    if (cloudFractionState === "off") {
      elements.cloudFractionStatus.textContent = t("cloudFraction.off");
    } else if (cloudFractionState === "loading") {
      elements.cloudFractionStatus.textContent = template("cloudFraction.loading", {
        date: elements.cloudFractionDate.value,
      });
    } else if (cloudFractionState === "error") {
      elements.cloudFractionStatus.textContent = t("cloudFraction.error");
    } else {
      elements.cloudFractionStatus.textContent = template("cloudFraction.loaded", {
        date: elements.cloudFractionDate.value,
      });
    }
  }

  cloudFractionLayer.on("loading", () => {
    if (!map.hasLayer(cloudFractionLayer)) return;
    cloudFractionState = "loading";
    cloudFractionTileErrors = 0;
    updateCloudFractionStatus();
  });
  cloudFractionLayer.on("load", () => {
    if (!map.hasLayer(cloudFractionLayer)) return;
    cloudFractionState = cloudFractionTileErrors >= 2 ? "error" : "loaded";
    updateCloudFractionStatus();
  });
  cloudFractionLayer.on("tileerror", () => {
    cloudFractionTileErrors += 1;
    if (cloudFractionTileErrors >= 2) {
      cloudFractionState = "error";
      updateCloudFractionStatus();
    }
  });

  function updateFloodStatus() {
    elements.floodStatus.dataset.state = floodState;
    if (floodState === "off") {
      elements.floodStatus.textContent = t("flood.off");
    } else if (floodState === "loading") {
      elements.floodStatus.textContent = template("flood.loading", { date: elements.floodDate.value });
    } else if (floodState === "error") {
      elements.floodStatus.textContent = t("flood.error");
    } else {
      elements.floodStatus.textContent = template("flood.loaded", { date: elements.floodDate.value });
    }
  }

  floodLayer.on("loading", () => {
    if (!map.hasLayer(floodLayer)) return;
    floodState = "loading";
    floodTileErrors = 0;
    updateFloodStatus();
  });
  floodLayer.on("load", () => {
    if (!map.hasLayer(floodLayer)) return;
    floodState = floodTileErrors >= 2 ? "error" : "loaded";
    updateFloodStatus();
  });
  floodLayer.on("tileerror", () => {
    floodTileErrors += 1;
    if (floodTileErrors >= 2) {
      floodState = "error";
      updateFloodStatus();
    }
  });

  function updateThermalStatus() {
    elements.thermalStatus.dataset.state = thermalState;
    if (thermalState === "off") {
      elements.thermalStatus.textContent = t("thermal.off");
    } else if (thermalState === "loading") {
      elements.thermalStatus.textContent = template("thermal.loading", { date: elements.thermalDate.value });
    } else if (thermalState === "error") {
      elements.thermalStatus.textContent = t("thermal.error");
    } else {
      elements.thermalStatus.textContent = template("thermal.loaded", { date: elements.thermalDate.value });
    }
  }

  thermalLayer.on("loading", () => {
    if (!map.hasLayer(thermalLayer)) return;
    thermalState = "loading";
    thermalTileErrors = 0;
    updateThermalStatus();
  });
  thermalLayer.on("load", () => {
    if (!map.hasLayer(thermalLayer)) return;
    thermalState = thermalTileErrors >= 2 ? "error" : "loaded";
    updateThermalStatus();
  });
  thermalLayer.on("tileerror", () => {
    thermalTileErrors += 1;
    if (thermalTileErrors >= 2) {
      thermalState = "error";
      updateThermalStatus();
    }
  });

  const placeMarker = L.circleMarker([0, 0], {
    radius: 8,
    weight: 3,
    color: "#ffffff",
    fillColor: "#e04f3f",
    fillOpacity: 0.92,
    className: "place-selection-marker",
  });

  function renderSourceNetwork() {
    elements.sourceNetworkList.replaceChildren();
    const sources = catalogForSystem(i18n?.language, activeSystem);
    const connected = sources.filter((source) => source.status === "connected").length;
    const candidate = sources.filter((source) => source.status === "candidate").length;
    const connectedLabel = t(
      connected === 1 ? "sourcesNetwork.connectedSingular" : "sourcesNetwork.connectedPlural",
    );
    const candidateLabel = t(
      candidate === 1 ? "sourcesNetwork.assessedSingular" : "sourcesNetwork.assessedPlural",
    );
    elements.sourceNetworkBadge.textContent = `${connected} ${connectedLabel} · ${candidate} ${candidateLabel}`;
    sources.forEach((source) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      const heading = document.createElement("span");
      const name = document.createElement("strong");
      const status = document.createElement("em");
      const detail = document.createElement("small");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      name.textContent = source.name;
      status.textContent = t(`sourcesNetwork.${source.status}`);
      status.dataset.status = source.status;
      detail.textContent = `${source.institution} · ${source.access} · ${source.purpose}`;
      heading.append(name, status);
      link.append(heading, detail);
      item.append(link);
      elements.sourceNetworkList.append(item);
    });
  }

  function renderSystemView({ updateUrl = false } = {}) {
    elements.sidebar.dataset.activeSystem = activeSystem;
    elements.systemButtons.forEach((button) => {
      const isActive = button.dataset.system === activeSystem;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
      const count = button.querySelector("small");
      if (count) count.textContent = t(isActive ? "systems.active" : count.dataset.systemCountKey);
    });
    elements.systemContent.forEach((section) => {
      section.hidden = !contentBelongsToSystem(section.dataset.systemContent, activeSystem);
    });
    elements.systemEyebrow.textContent = t(`systems.${activeSystem}Eyebrow`);
    elements.systemIntroTitle.textContent = t(`systems.${activeSystem}Title`);
    elements.systemIntroCopy.textContent = t(`systems.${activeSystem}Copy`);
    elements.layersTitle.textContent = t(`systems.${activeSystem}Layers`);
    elements.systemNote.textContent = t(`systems.${activeSystem}Note`);
    renderSourceNetwork();

    if (updateUrl) {
      const nextUrl = new URL(window.location.href);
      if (activeSystem === "earth") nextUrl.searchParams.delete("system");
      else nextUrl.searchParams.set("system", activeSystem);
      window.history.pushState({ system: activeSystem }, "", nextUrl);
    }
  }

  function selectSystem(system, options) {
    const nextSystem = normalizeAtlasSystem(system);
    if (nextSystem === activeSystem && options?.updateUrl) return;
    activeSystem = nextSystem;
    renderSystemView(options);
  }

  function createPlaceResult(label, title, detail) {
    const article = document.createElement("article");
    const resultLabel = document.createElement("span");
    const resultTitle = document.createElement("strong");
    const resultDetail = document.createElement("small");
    resultLabel.textContent = label;
    resultTitle.textContent = title;
    resultDetail.textContent = detail;
    article.append(resultLabel, resultTitle, resultDetail);
    return article;
  }

  function stationCategoryLabel(feature) {
    return t(`stations.${normalizeStationCategory(feature.properties?.categoria)}`);
  }

  function popupDetail(term, value) {
    const group = document.createElement("div");
    const label = document.createElement("dt");
    const description = document.createElement("dd");
    label.textContent = term;
    description.textContent = value || t("value.unavailable");
    group.append(label, description);
    return group;
  }

  function createStationPopup(feature) {
    const properties = feature.properties ?? {};
    const article = document.createElement("article");
    const eyebrow = document.createElement("p");
    const title = document.createElement("h3");
    const name = document.createElement("p");
    const details = document.createElement("dl");
    const link = document.createElement("a");

    article.className = "station-popup";
    eyebrow.className = "station-popup-kicker";
    eyebrow.textContent = stationCategoryLabel(feature);
    title.textContent = properties.codigo || t("value.unavailable");
    name.textContent = properties.nombre || t("value.unavailable");
    details.append(
      popupDetail(t("stations.popupAltitude"), Number.isFinite(properties.altitud_m)
        ? template("stations.altitude", { altitude: formatNumber(properties.altitud_m, 0) })
        : t("value.unavailable")),
      popupDetail(t("stations.popupOwner"), properties.propietario),
      popupDetail(t("stations.popupLocation"), [properties.canton, properties.provincia].filter(Boolean).join(", ")),
      popupDetail(t("stations.popupState"), t("stations.transmitting")),
    );
    link.href = STATION_SOURCE.viewer;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = t("stations.openViewer");
    article.append(eyebrow, title, name, details, link);
    return article;
  }

  function formatApproximateDistance(distanceKm) {
    return template("place.approxDistance", {
      distance: formatNumber(distanceKm, distanceKm < 10 ? 1 : 0),
    });
  }

  async function lookupBasinForSelectedPoint() {
    const requestId = ++basinLookupRequestId;
    selectedBasin = null;
    if (!selectedPoint || !map.hasLayer(basinLayer)) {
      basinLookupState = "idle";
      renderPlaceExplanation();
      return;
    }

    basinLookupState = "loading";
    renderPlaceExplanation();
    try {
      const [longitude, latitude] = selectedPoint;
      const properties = await queryBasinAtPoint(longitude, latitude);
      if (requestId !== basinLookupRequestId || !map.hasLayer(basinLayer)) return;
      selectedBasin = properties;
      basinLookupState = "loaded";
    } catch (error) {
      if (requestId !== basinLookupRequestId) return;
      console.warn(error);
      basinLookupState = "error";
    }
    renderPlaceExplanation();
  }

  function renderPlaceExplanation() {
    elements.placeResults.replaceChildren();
    if (!selectedPoint) {
      elements.placeInstruction.textContent = t("place.instruction");
      return;
    }

    const [longitude, latitude] = selectedPoint;
    elements.placeInstruction.textContent = t("place.selected");
    elements.placeResults.append(createPlaceResult(
      t("place.coordinates"),
      `${formatNumber(latitude, 4)}, ${formatNumber(longitude, 4)}`,
      "WGS 84 · EPSG:4326",
    ));

    if (map.hasLayer(basinLayer)) {
      if (basinLookupState === "loading") {
        elements.placeResults.append(createPlaceResult(
          t("basins.placeLabel"),
          t("basins.placeLoading"),
          "INAMHI / MAATE",
        ));
      } else if (basinLookupState === "error") {
        elements.placeResults.append(createPlaceResult(
          t("basins.placeLabel"),
          t("basins.placeUnavailable"),
          "INAMHI WFS",
        ));
      } else if (basinLookupState === "loaded" && selectedBasin) {
        elements.placeResults.append(createPlaceResult(
          t("basins.placeLabel"),
          selectedBasin.nombre_cue || t("value.unavailable"),
          template("basins.placeDetail", {
            system: selectedBasin.nombre_sis || t("value.unavailable"),
            code: selectedBasin.codigo_sis || t("value.unavailable"),
          }),
        ));
      } else if (basinLookupState === "loaded") {
        elements.placeResults.append(createPlaceResult(
          t("basins.placeLabel"),
          t("basins.placeOutside"),
          "INAMHI / MAATE",
        ));
      }
    }

    if (map.hasLayer(stationLayer) && visibleStationCatalog.length > 0) {
      const closestStation = nearestFeature(selectedPoint, visibleStationCatalog);
      if (closestStation.feature) {
        const properties = closestStation.feature.properties ?? {};
        elements.placeResults.append(createPlaceResult(
          t("stations.placeLabel"),
          `${properties.codigo || t("value.unavailable")} · ${properties.nombre || t("value.unavailable")}`,
          `${formatApproximateDistance(closestStation.distanceKm)} · ${stationCategoryLabel(closestStation.feature)}`,
        ));
      }
    }

    const closestFault = map.hasLayer(faultLayer) ? nearestFeature(selectedPoint, catalog) : {};
    if (closestFault.feature) {
      elements.placeResults.append(createPlaceResult(
        t("place.nearestFault"),
        localizedProperty(closestFault.feature, "nombre"),
        `${formatApproximateDistance(closestFault.distanceKm)} · ${movementLabel(closestFault.feature)}`,
      ));
    }

    const closestEvidence = map.hasLayer(evidenceLayer)
      ? nearestFeature(selectedPoint, evidenceCatalog)
      : {};
    if (closestEvidence.feature) {
      const properties = closestEvidence.feature.properties ?? {};
      elements.placeResults.append(createPlaceResult(
        t("place.nearestEvidence"),
        t(`evidence.${properties.tipo}`),
        `${formatApproximateDistance(closestEvidence.distanceKm)} · ${localizedProperty(closestEvidence.feature, "confianza")}`,
      ));
    }

    const closestEarthquake = map.hasLayer(earthquakeLayer)
      ? nearestFeature(selectedPoint, visibleEarthquakeCatalog)
      : {};
    if (closestEarthquake.feature) {
      const properties = closestEarthquake.feature.properties ?? {};
      elements.placeResults.append(createPlaceResult(
        t("place.nearestEarthquake"),
        properties.place || t("value.unavailable"),
        `${formatApproximateDistance(closestEarthquake.distanceKm)} · ${template("place.magnitude", { magnitude: formatNumber(properties.mag) })}`,
      ));
    } else if (earthquakeState === "loading" && elements.earthquakeToggle.checked) {
      elements.placeResults.append(createPlaceResult(
        t("place.nearestEarthquake"),
        t("place.waitingEarthquakes"),
        "USGS FDSN",
      ));
    }

    if (map.hasLayer(thermalLayer)) {
      elements.placeResults.append(createPlaceResult(
        t("thermal.placeLabel"),
        t("thermal.placeActive"),
        template("thermal.placeDetail", { date: elements.thermalDate.value }),
      ));
    }

    if (map.hasLayer(precipitationLayer)) {
      elements.placeResults.append(createPlaceResult(
        t("precipitation.placeLabel"),
        t("precipitation.placeActive"),
        template("precipitation.placeDetail", { date: elements.precipitationDate.value }),
      ));
    }

    if (map.hasLayer(airTemperatureLayer)) {
      elements.placeResults.append(createPlaceResult(
        t("airTemperature.placeLabel"),
        t("airTemperature.placeActive"),
        template("airTemperature.placeDetail", { date: elements.airTemperatureDate.value }),
      ));
    }

    if (map.hasLayer(cloudFractionLayer)) {
      elements.placeResults.append(createPlaceResult(
        t("cloudFraction.placeLabel"),
        t("cloudFraction.placeActive"),
        template("cloudFraction.placeDetail", { date: elements.cloudFractionDate.value }),
      ));
    }

    if (map.hasLayer(floodLayer)) {
      elements.placeResults.append(createPlaceResult(
        t("flood.placeLabel"),
        t("flood.placeActive"),
        template("flood.placeDetail", { date: elements.floodDate.value }),
      ));
    }

    if (elements.placeResults.children.length === 1) {
      elements.placeResults.append(createPlaceResult(t("place.title"), t("place.noData"), ""));
    }
  }

  function setPlaceMode(active) {
    placeMode = active;
    elements.explainPlace.setAttribute("aria-pressed", String(active));
    elements.explainPlace.classList.toggle("is-active", active);
    mapElement.classList.toggle("is-explaining", active);
    elements.placeExplainer.hidden = !active;
    if (active) renderPlaceExplanation();
  }

  function movementLabel(feature) {
    return t(`movement.${movementOf(feature)}`);
  }

  const popupContext = {
    t,
    template,
    formatNumber,
    formatUtcDate,
    localizedProperty,
    movementLabel,
    demoMode,
  };

  function styleFeature(feature) {
    return faultStyle(feature, selectedFeature);
  }

  function featureId(feature) {
    return featureIds.get(feature) ?? "";
  }

  function setSelectedFeature(feature) {
    selectedFeature = feature;
    faultLayer.eachLayer((layer) => layer.setStyle(styleFeature(layer.feature)));
    elements.list.querySelectorAll("button[data-feature-id]").forEach((button) => {
      if (feature && button.dataset.featureId === featureId(feature)) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }

  function onEachFault(feature, layer) {
    layer.bindPopup(buildFaultPopup(feature, popupContext));
    layer.on("click", () => setSelectedFeature(feature));
    layer.on("mouseover", () => layer.setStyle({ weight: feature === selectedFeature ? 6 : 5 }));
    layer.on("mouseout", () => layer.setStyle(styleFeature(feature)));
  }

  const faultLayer = L.geoJSON([], { style: styleFeature, onEachFeature: onEachFault }).addTo(map);
  map.createPane("evidence");
  map.getPane("evidence").style.zIndex = "420";
  const evidenceLayer = L.geoJSON([], {
    pane: "evidence",
    style(feature) {
      return ["Point", "MultiPoint"].includes(feature.geometry?.type)
        ? evidencePointOptions(feature)
        : evidenceStyle(feature);
    },
    pointToLayer(feature, latlng) {
      return L.circleMarker(latlng, { pane: "evidence", ...evidencePointOptions(feature) });
    },
    onEachFeature(feature, layer) {
      layer.bindPopup(buildEvidencePopup(feature, popupContext));
      layer.bindTooltip(t(`evidence.${feature.properties?.tipo}`), { direction: "top", offset: [0, -5] });
    },
  });

  map.createPane("earthquakes");
  map.getPane("earthquakes").style.zIndex = "390";
  const earthquakeRenderer = L.canvas({ pane: "earthquakes", padding: 0.5 });
  const earthquakeLayer = L.geoJSON([], {
    pane: "earthquakes",
    pointToLayer(feature, latlng) {
      const magnitude = Number(feature.properties?.mag);
      return L.circleMarker(latlng, {
        pane: "earthquakes",
        renderer: earthquakeRenderer,
        radius: Number.isFinite(magnitude) ? Math.max(4, Math.min(13, 1.5 + magnitude * 1.45)) : 4,
        weight: 1.1,
        color: "#ffffff",
        fillColor: earthquakeColor(feature),
        fillOpacity: 0.58,
        opacity: 0.82,
        dashArray: earthquakeDashArray(feature),
        className: "earthquake-marker",
      });
    },
    onEachFeature(feature, layer) {
      layer.bindPopup(buildEarthquakePopup(feature, popupContext));
      const magnitude = formatNumber(feature.properties?.mag);
      layer.bindTooltip(`M ${magnitude}`, { direction: "top", offset: [0, -4] });
    },
  });

  function updateLegendVisibility() {
    const activeLayers = {
      faults: map.hasLayer(faultLayer),
      evidence: map.hasLayer(evidenceLayer),
      basins: map.hasLayer(basinLayer),
      stations: map.hasLayer(stationLayer),
      precipitation: map.hasLayer(precipitationLayer),
      "air-temperature": map.hasLayer(airTemperatureLayer),
      "cloud-fraction": map.hasLayer(cloudFractionLayer),
      flood: map.hasLayer(floodLayer),
      thermal: map.hasLayer(thermalLayer),
      earthquakes: map.hasLayer(earthquakeLayer),
    };
    let visibleSections = 0;
    elements.legendSections.forEach((section) => {
      const visible = Boolean(activeLayers[section.dataset.legendLayer]);
      section.hidden = !visible;
      if (visible) visibleSections += 1;
    });
    elements.legendEmpty.hidden = visibleSections > 0;
  }

  updateLegendVisibility();

  function matchesFilters(feature) {
    const query = normalize(elements.search.value);
    const selectedMovement = elements.movement.value;
    const properties = feature.properties ?? {};
    const searchableText = normalize(
      [
        properties.nombre,
        properties.nombre_en,
        properties.provincia,
        properties.provincia_en,
        properties.sistema,
        properties.sistema_en,
        properties.catalog_id,
        properties.catalog_name,
        properties.fuente,
        properties.reference,
      ]
        .filter(Boolean)
        .join(" "),
    );
    return (query === "" || searchableText.includes(query)) &&
      (selectedMovement === "all" || movementOf(feature) === selectedMovement);
  }

  function hasActiveFilters() {
    return elements.search.value.trim() !== "" || elements.movement.value !== "all";
  }

  function updateControls() {
    const hasCatalog = catalog.length > 0;
    elements.faultToggle.disabled = !hasCatalog;
    elements.search.disabled = !hasCatalog;
    elements.movement.disabled = !hasCatalog;
    elements.clear.disabled = !hasCatalog || !hasActiveFilters();
  }

  function showCatalogState(title, message, showDemoLink = false) {
    elements.state.hidden = false;
    elements.state.querySelector("strong").textContent = title;
    elements.state.querySelector("p").textContent = message;
    elements.state.querySelector(".demo-link")?.remove();
    if (showDemoLink) {
      const link = document.createElement("a");
      link.className = "demo-link";
      link.href = "?demo=1";
      link.textContent = `${t("catalog.demoLink")} →`;
      elements.state.append(link);
    }
  }

  function zoomToFeature(feature) {
    if (!map.hasLayer(faultLayer)) {
      elements.faultToggle.checked = true;
      faultLayer.addTo(map);
      elements.count.textContent = elements.resultCount.textContent;
      updateLegendVisibility();
      updateSourceCount();
    }
    setSelectedFeature(feature);
    const bounds = L.geoJSON(feature).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.35), { maxZoom: 13 });
    faultLayer.eachLayer((layer) => {
      if (layer.feature === feature) layer.openPopup();
    });
  }

  function renderList(features) {
    elements.list.replaceChildren();
    features
      .slice()
      .sort((a, b) => localizedProperty(a, "nombre").localeCompare(localizedProperty(b, "nombre"), i18n?.language ?? "es"))
      .forEach((feature) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        const name = document.createElement("strong");
        const detail = document.createElement("small");
        button.type = "button";
        button.dataset.featureId = featureId(feature);
        if (feature === selectedFeature) button.setAttribute("aria-current", "true");
        name.textContent = localizedProperty(feature, "nombre");
        const source = SOURCE_REGISTRY[catalogKey(feature)];
        const catalogId = String(feature.properties?.catalog_id ?? feature.id ?? t("value.unavailable"));
        const identity = source ? `${source.label} · ${catalogId}` : catalogId;
        detail.textContent = `${localizedProperty(feature, "provincia")} · ${movementLabel(feature)} · ${identity}`;
        button.append(name, detail);
        button.addEventListener("click", () => zoomToFeature(feature));
        item.append(button);
        elements.list.append(item);
      });
  }

  function renderCatalog() {
    const visibleFeatures = catalog.filter(matchesFilters);
    if (selectedFeature && !visibleFeatures.includes(selectedFeature)) selectedFeature = null;
    faultLayer.clearLayers();
    faultLayer.addData({ type: "FeatureCollection", features: visibleFeatures });
    renderList(visibleFeatures);
    elements.count.textContent = String(map.hasLayer(faultLayer) ? visibleFeatures.length : 0);
    elements.resultCount.textContent = String(visibleFeatures.length);

    if (catalog.length === 0) {
      showCatalogState(
        t("catalog.preparingTitle"),
        t(demoMode ? "catalog.preparingCopy" : "catalog.preparingDemo"),
        !demoMode,
      );
    } else if (visibleFeatures.length === 0) {
      showCatalogState(t("catalog.noResultsTitle"), t("catalog.noResultsCopy"));
    } else {
      elements.state.hidden = true;
    }
    updateControls();
    updateLegendVisibility();
    if (selectedPoint) renderPlaceExplanation();
  }

  function renderEvidence() {
    evidenceLayer.clearLayers();
    evidenceLayer.addData({ type: "FeatureCollection", features: evidenceCatalog });
    elements.evidenceCount.textContent = String(evidenceCatalog.length);
    elements.evidenceToggle.disabled = evidenceCatalog.length === 0;
    if (evidenceCatalog.length === 0) elements.evidenceToggle.checked = false;
    if (elements.evidenceToggle.checked && !map.hasLayer(evidenceLayer)) evidenceLayer.addTo(map);
    if (!elements.evidenceToggle.checked && map.hasLayer(evidenceLayer)) map.removeLayer(evidenceLayer);
    updateLegendVisibility();
    if (selectedPoint) renderPlaceExplanation();
  }

  function getEarthquakeFilters() {
    return normalizeEarthquakeFilters({
      days: elements.earthquakeDays.value,
      minimumMagnitude: elements.earthquakeMinimumMagnitude.value,
      depth: elements.earthquakeDepthFilter.value,
    });
  }

  function locateEarthquake(feature) {
    elements.earthquakeToggle.checked = true;
    if (!map.hasLayer(earthquakeLayer)) earthquakeLayer.addTo(map);
    updateLegendVisibility();
    const [longitude, latitude] = feature.geometry.coordinates;
    map.setView([latitude, longitude], Math.max(map.getZoom(), 9));
    earthquakeLayer.eachLayer((layer) => {
      if (layer.feature === feature) layer.openPopup();
    });
    if (window.matchMedia("(max-width: 64rem)").matches) {
      mapElement.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    }
  }

  function renderEarthquakeList(features) {
    elements.earthquakeList.replaceChildren();
    elements.earthquakeListCount.textContent = String(features.length);
    if (features.length === 0) {
      const empty = document.createElement("li");
      empty.className = "earthquake-list-empty";
      empty.textContent = t("earthquakes.listEmpty");
      elements.earthquakeList.append(empty);
      return;
    }
    const maximumListedEvents = 200;
    features.slice(0, maximumListedEvents).forEach((feature) => {
      const properties = feature.properties ?? {};
      const depth = Number(feature.geometry.coordinates?.[2]);
      const item = document.createElement("li");
      const button = document.createElement("button");
      const title = document.createElement("strong");
      const detail = document.createElement("small");
      button.type = "button";
      title.textContent = `M ${formatNumber(properties.mag)} · ${properties.place || t("value.unavailable")}`;
      detail.textContent = `${formatUtcDate(properties.time)} · ${t("popup.depth")} ${
        Number.isFinite(depth) ? `${formatNumber(depth)} km` : t("value.unavailable")
      }`;
      button.append(title, detail);
      button.addEventListener("click", () => locateEarthquake(feature));
      item.append(button);
      elements.earthquakeList.append(item);
    });
    if (features.length > maximumListedEvents) {
      const limitNotice = document.createElement("li");
      limitNotice.className = "earthquake-list-empty";
      limitNotice.textContent = template("earthquakes.listLimited", {
        shown: maximumListedEvents,
        total: features.length,
      });
      elements.earthquakeList.append(limitNotice);
    }
  }

  function updateEarthquakeStatus() {
    elements.earthquakeStatus.dataset.state = earthquakeState;
    if (earthquakeState === "loading") {
      elements.earthquakeStatus.textContent = t("earthquakes.loading");
      return;
    }
    if (earthquakeState === "error") {
      elements.earthquakeStatus.textContent = t("earthquakes.error");
      return;
    }
    elements.earthquakeStatus.textContent = template("earthquakes.loaded", {
      count: visibleEarthquakeCatalog.length,
      date: formatUtcDate(earthquakeGeneratedAt),
    });
  }

  function renderEarthquakes() {
    visibleEarthquakeCatalog = filterEarthquakes(earthquakeCatalog, getEarthquakeFilters());
    earthquakeLayer.clearLayers();
    earthquakeLayer.addData({ type: "FeatureCollection", features: visibleEarthquakeCatalog });
    elements.earthquakeCount.textContent = String(visibleEarthquakeCatalog.length);
    elements.earthquakeToggle.disabled = earthquakeState !== "loaded";
    if (earthquakeState === "error") elements.earthquakeToggle.checked = false;
    if (elements.earthquakeToggle.checked && !map.hasLayer(earthquakeLayer)) earthquakeLayer.addTo(map);
    if (!elements.earthquakeToggle.checked && map.hasLayer(earthquakeLayer)) map.removeLayer(earthquakeLayer);
    updateLegendVisibility();
    renderEarthquakeList(visibleEarthquakeCatalog);
    updateEarthquakeStatus();
    updateSourceCount();
    if (selectedPoint) renderPlaceExplanation();
  }

  function updateSourceCount() {
    const sources = new Set(
      [...catalog, ...evidenceCatalog]
        .map((feature) => feature.properties?.fuente)
        .filter((value) => typeof value === "string" && value.trim() !== ""),
    );
    if (earthquakeCatalog.length > 0) sources.add("USGS");
    if (map.hasLayer(hillshadeLayer)) sources.add("Esri World Hillshade");
    if (map.hasLayer(basinLayer)) sources.add("INAMHI / MAATE");
    if (map.hasLayer(stationLayer)) sources.add("INAMHI Red Hidrometeorológica");
    if (map.hasLayer(thermalLayer)) sources.add("NASA FIRMS / GIBS");
    if (map.hasLayer(precipitationLayer)) sources.add("NASA GPM IMERG / GIBS");
    if (map.hasLayer(airTemperatureLayer)) sources.add("NASA Aqua AIRS / GIBS");
    if (map.hasLayer(cloudFractionLayer)) sources.add("NASA Aqua MODIS / GIBS");
    if (map.hasLayer(floodLayer)) sources.add("NASA LANCE VIIRS / GIBS");
    elements.sourceCount.textContent = String(sources.size);
  }

  async function loadEarthquakeData() {
    const requestId = ++earthquakeRequestId;
    const filters = getEarthquakeFilters();
    earthquakeState = "loading";
    elements.earthquakeToggle.disabled = true;
    updateEarthquakeStatus();
    try {
      const result = await loadRecentEarthquakes({
        days: filters.days,
        minimumMagnitude: filters.minimumMagnitude,
      });
      if (requestId !== earthquakeRequestId) return;
      earthquakeCatalog = result.features;
      earthquakeGeneratedAt = result.generatedAt;
      earthquakeState = "loaded";
      if (!earthquakeAttributionAdded) {
        map.attributionControl.addAttribution(
          'Earthquake data: <a href="https://earthquake.usgs.gov/earthquakes/search/" target="_blank" rel="noopener">USGS</a>',
        );
        earthquakeAttributionAdded = true;
      }
    } catch (error) {
      if (requestId !== earthquakeRequestId) return;
      console.error(error);
      earthquakeCatalog = [];
      earthquakeGeneratedAt = null;
      earthquakeState = "error";
    }
    renderEarthquakes();
  }

  async function loadAtlasData() {
    const [faultResult, evidenceResult] = await Promise.allSettled([
      loadGeoJson(catalogUrl, DATASETS.faults.geometries),
      loadGeoJson(evidenceUrl, DATASETS.evidence.geometries),
    ]);

    if (faultResult.status === "fulfilled") {
      catalog = faultResult.value;
      catalog.forEach((feature, index) => featureIds.set(feature, String(feature.id ?? `feature-${index + 1}`)));
      renderCatalog();
    } else {
      console.error(faultResult.reason);
      catalog = [];
      faultLayer.clearLayers();
      elements.faultToggle.checked = false;
      elements.count.textContent = "0";
      elements.resultCount.textContent = "0";
      showCatalogState(t("catalog.loadErrorTitle"), t("catalog.loadErrorCopy"));
      updateControls();
      updateLegendVisibility();
    }

    if (evidenceResult.status === "fulfilled") {
      evidenceCatalog = evidenceResult.value;
      elements.evidenceToggle.checked = evidenceCatalog.length > 0;
      renderEvidence();
    } else {
      console.error(evidenceResult.reason);
      evidenceCatalog = [];
      renderEvidence();
    }
    updateSourceCount();
  }

  elements.basemapButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedKey = button.dataset.basemap;
      const nextLayer = basemaps[selectedKey];
      if (!nextLayer || nextLayer === activeBasemap) return;
      map.removeLayer(activeBasemap);
      nextLayer.addTo(map);
      nextLayer.bringToBack();
      activeBasemap = nextLayer;
      tileErrors = 0;
      elements.basemapButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
    });
  });

  elements.systemButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectSystem(button.dataset.system, { updateUrl: true });
    });
    button.addEventListener("keydown", (event) => {
      const currentIndex = ATLAS_SYSTEMS.indexOf(button.dataset.system);
      const offsets = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let nextIndex;
      if (event.key in offsets) nextIndex = (currentIndex + offsets[event.key] + ATLAS_SYSTEMS.length) % ATLAS_SYSTEMS.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = ATLAS_SYSTEMS.length - 1;
      else return;
      event.preventDefault();
      const nextButton = elements.systemButtons.find((item) => item.dataset.system === ATLAS_SYSTEMS[nextIndex]);
      nextButton?.focus();
      selectSystem(ATLAS_SYSTEMS[nextIndex], { updateUrl: true });
    });
  });

  window.addEventListener("popstate", () => {
    selectSystem(new URLSearchParams(window.location.search).get("system"));
  });

  elements.explainPlace.addEventListener("click", () => setPlaceMode(!placeMode));
  elements.closePlaceExplainer.addEventListener("click", () => setPlaceMode(false));
  map.on("click", (event) => {
    if (!placeMode || event.originalEvent?.target?.closest?.(".leaflet-interactive")) return;
    selectedPoint = [event.latlng.lng, event.latlng.lat];
    placeMarker.setLatLng(event.latlng).addTo(map);
    if (map.hasLayer(basinLayer)) lookupBasinForSelectedPoint();
    else renderPlaceExplanation();
  });

  function updateHillshadeOpacity() {
    const opacity = Number(elements.hillshadeOpacity.value) / 100;
    hillshadeLayer.setOpacity(opacity);
    elements.hillshadeOpacityValue.value = `${Math.round(opacity * 100)}%`;
  }

  function updateStationStatus() {
    elements.stationStatus.dataset.state = stationState;
    if (stationState === "loading") {
      elements.stationStatus.textContent = t("stations.loading");
    } else if (stationState === "error") {
      elements.stationStatus.textContent = t("stations.error");
    } else if (map.hasLayer(stationLayer)) {
      elements.stationStatus.textContent = template("stations.visible", {
        visible: visibleStationCatalog.length,
        total: stationCatalog.length,
      });
    } else {
      elements.stationStatus.textContent = template("stations.ready", { count: stationCatalog.length });
    }
  }

  function updateStationRetrievedAt() {
    elements.stationRetrievedAt.dateTime = stationMetadata.retrievedAt || "";
    elements.stationRetrievedAt.textContent = stationMetadata.retrievedAt
      ? formatUtcDate(stationMetadata.retrievedAt)
      : t("value.unavailable");
  }

  function renderStations() {
    visibleStationCatalog = filterStations(stationCatalog, elements.stationCategory.value);
    stationLayer.clearLayers();
    stationLayer.addData({ type: "FeatureCollection", features: visibleStationCatalog });
    updateStationStatus();
    updateLegendVisibility();
    updateSourceCount();
    if (selectedPoint) renderPlaceExplanation();
  }

  async function loadStationData() {
    stationState = "loading";
    elements.stationToggle.disabled = true;
    updateStationStatus();
    try {
      const result = await loadStationSnapshot();
      stationCatalog = result.features;
      stationMetadata = result.metadata;
      stationState = "loaded";
      elements.stationToggle.disabled = false;
      updateStationRetrievedAt();
      map.attributionControl.addAttribution(
        '<a href="https://inamhi.gob.ec/info/visor/" target="_blank" rel="noopener">Estaciones INAMHI</a>',
      );
      renderStations();
    } catch (error) {
      console.error(error);
      stationCatalog = [];
      visibleStationCatalog = [];
      stationState = "error";
      elements.stationToggle.checked = false;
      elements.stationToggle.disabled = true;
      elements.stationCategory.disabled = true;
      updateStationStatus();
    }
  }
  updateHillshadeOpacity();

  elements.hillshadeToggle.addEventListener("change", () => {
    if (elements.hillshadeToggle.checked) hillshadeLayer.addTo(map);
    else map.removeLayer(hillshadeLayer);
    elements.hillshadeOpacity.disabled = !elements.hillshadeToggle.checked;
    updateSourceCount();
  });
  elements.hillshadeOpacity.addEventListener("input", updateHillshadeOpacity);

  function updateBasinOpacity() {
    const opacity = Number(elements.basinOpacity.value) / 100;
    basinLayer.setOpacity(opacity);
    elements.basinOpacityValue.value = `${Math.round(opacity * 100)}%`;
  }
  updateBasinOpacity();

  elements.basinToggle.addEventListener("change", () => {
    const active = elements.basinToggle.checked;
    elements.basinOpacity.disabled = !active;
    if (active) {
      basinState = "loading";
      basinTileErrors = 0;
      basinLayer.addTo(map);
      if (selectedPoint) lookupBasinForSelectedPoint();
    } else {
      map.removeLayer(basinLayer);
      basinState = "off";
      basinLookupRequestId += 1;
      basinLookupState = "idle";
      selectedBasin = null;
      if (selectedPoint) renderPlaceExplanation();
    }
    updateBasinStatus();
    updateLegendVisibility();
    updateSourceCount();
  });
  elements.basinOpacity.addEventListener("input", updateBasinOpacity);

  elements.stationToggle.addEventListener("change", () => {
    const active = elements.stationToggle.checked;
    elements.stationCategory.disabled = !active;
    if (active) stationLayer.addTo(map);
    else map.removeLayer(stationLayer);
    updateStationStatus();
    updateLegendVisibility();
    updateSourceCount();
    if (selectedPoint) renderPlaceExplanation();
  });
  elements.stationCategory.addEventListener("change", renderStations);

  function updatePrecipitationOpacity() {
    const opacity = Number(elements.precipitationOpacity.value) / 100;
    precipitationLayer.setOpacity(opacity);
    elements.precipitationOpacityValue.value = `${Math.round(opacity * 100)}%`;
  }
  updatePrecipitationOpacity();

  elements.precipitationToggle.addEventListener("change", () => {
    const active = elements.precipitationToggle.checked;
    elements.precipitationDate.disabled = !active;
    elements.precipitationOpacity.disabled = !active;
    if (active) {
      precipitationState = "loading";
      precipitationTileErrors = 0;
      precipitationLayer.addTo(map);
    } else {
      map.removeLayer(precipitationLayer);
      precipitationState = "off";
    }
    updatePrecipitationStatus();
    updateLegendVisibility();
    updateSourceCount();
    if (selectedPoint) renderPlaceExplanation();
  });

  elements.precipitationDate.addEventListener("change", () => {
    elements.precipitationDate.value = normalizePrecipitationDate(
      elements.precipitationDate.value,
      precipitationRange,
    );
    precipitationState = "loading";
    precipitationTileErrors = 0;
    precipitationLayer.setParams({ time: elements.precipitationDate.value }, false);
    precipitationLayer.redraw();
    updatePrecipitationStatus();
    if (selectedPoint) renderPlaceExplanation();
  });
  elements.precipitationOpacity.addEventListener("input", updatePrecipitationOpacity);

  function updateAirTemperatureOpacity() {
    const opacity = Number(elements.airTemperatureOpacity.value) / 100;
    airTemperatureLayer.setOpacity(opacity);
    elements.airTemperatureOpacityValue.value = `${Math.round(opacity * 100)}%`;
  }
  updateAirTemperatureOpacity();

  elements.airTemperatureToggle.addEventListener("change", () => {
    const active = elements.airTemperatureToggle.checked;
    elements.airTemperatureDate.disabled = !active;
    elements.airTemperatureOpacity.disabled = !active;
    if (active) {
      airTemperatureState = "loading";
      airTemperatureTileErrors = 0;
      airTemperatureLayer.addTo(map);
    } else {
      map.removeLayer(airTemperatureLayer);
      airTemperatureState = "off";
    }
    updateAirTemperatureStatus();
    updateLegendVisibility();
    updateSourceCount();
    if (selectedPoint) renderPlaceExplanation();
  });

  elements.airTemperatureDate.addEventListener("change", () => {
    elements.airTemperatureDate.value = normalizeAirTemperatureDate(
      elements.airTemperatureDate.value,
      airTemperatureRange,
    );
    airTemperatureState = "loading";
    airTemperatureTileErrors = 0;
    airTemperatureLayer.setParams({ time: elements.airTemperatureDate.value }, false);
    airTemperatureLayer.redraw();
    updateAirTemperatureStatus();
    if (selectedPoint) renderPlaceExplanation();
  });
  elements.airTemperatureOpacity.addEventListener("input", updateAirTemperatureOpacity);

  function updateCloudFractionOpacity() {
    const opacity = Number(elements.cloudFractionOpacity.value) / 100;
    cloudFractionLayer.setOpacity(opacity);
    elements.cloudFractionOpacityValue.value = `${Math.round(opacity * 100)}%`;
  }
  updateCloudFractionOpacity();

  elements.cloudFractionToggle.addEventListener("change", () => {
    const active = elements.cloudFractionToggle.checked;
    elements.cloudFractionDate.disabled = !active;
    elements.cloudFractionOpacity.disabled = !active;
    if (active) {
      cloudFractionState = "loading";
      cloudFractionTileErrors = 0;
      cloudFractionLayer.addTo(map);
    } else {
      map.removeLayer(cloudFractionLayer);
      cloudFractionState = "off";
    }
    updateCloudFractionStatus();
    updateLegendVisibility();
    updateSourceCount();
    if (selectedPoint) renderPlaceExplanation();
  });

  elements.cloudFractionDate.addEventListener("change", () => {
    elements.cloudFractionDate.value = normalizeCloudFractionDate(
      elements.cloudFractionDate.value,
      cloudFractionRange,
    );
    cloudFractionState = "loading";
    cloudFractionTileErrors = 0;
    cloudFractionLayer.setParams({ time: elements.cloudFractionDate.value }, false);
    cloudFractionLayer.redraw();
    updateCloudFractionStatus();
    if (selectedPoint) renderPlaceExplanation();
  });
  elements.cloudFractionOpacity.addEventListener("input", updateCloudFractionOpacity);

  function updateFloodOpacity() {
    const opacity = Number(elements.floodOpacity.value) / 100;
    floodLayer.setOpacity(opacity);
    elements.floodOpacityValue.value = `${Math.round(opacity * 100)}%`;
  }
  updateFloodOpacity();

  elements.floodToggle.addEventListener("change", () => {
    const active = elements.floodToggle.checked;
    elements.floodDate.disabled = !active;
    elements.floodOpacity.disabled = !active;
    if (active) {
      floodState = "loading";
      floodTileErrors = 0;
      floodLayer.addTo(map);
    } else {
      map.removeLayer(floodLayer);
      floodState = "off";
    }
    updateFloodStatus();
    updateLegendVisibility();
    updateSourceCount();
    if (selectedPoint) renderPlaceExplanation();
  });

  elements.floodDate.addEventListener("change", () => {
    elements.floodDate.value = normalizeFloodDate(elements.floodDate.value, floodRange);
    floodState = "loading";
    floodTileErrors = 0;
    floodLayer.setParams({ time: elements.floodDate.value }, false);
    floodLayer.redraw();
    updateFloodStatus();
    if (selectedPoint) renderPlaceExplanation();
  });
  elements.floodOpacity.addEventListener("input", updateFloodOpacity);

  function updateThermalOpacity() {
    const opacity = Number(elements.thermalOpacity.value) / 100;
    thermalLayer.setOpacity(opacity);
    elements.thermalOpacityValue.value = `${Math.round(opacity * 100)}%`;
  }
  updateThermalOpacity();

  elements.thermalToggle.addEventListener("change", () => {
    const active = elements.thermalToggle.checked;
    elements.thermalDate.disabled = !active;
    elements.thermalOpacity.disabled = !active;
    if (active) {
      thermalState = "loading";
      thermalTileErrors = 0;
      thermalLayer.addTo(map);
    } else {
      map.removeLayer(thermalLayer);
      thermalState = "off";
    }
    updateThermalStatus();
    updateLegendVisibility();
    updateSourceCount();
    if (selectedPoint) renderPlaceExplanation();
  });

  elements.thermalDate.addEventListener("change", () => {
    elements.thermalDate.value = normalizeThermalDate(elements.thermalDate.value, thermalRange);
    thermalState = "loading";
    thermalTileErrors = 0;
    thermalLayer.setParams({ time: elements.thermalDate.value }, false);
    thermalLayer.redraw();
    updateThermalStatus();
    if (selectedPoint) renderPlaceExplanation();
  });
  elements.thermalOpacity.addEventListener("input", updateThermalOpacity);

  function updateMinimumMagnitudeValue() {
    elements.earthquakeMinimumMagnitudeValue.value = Number(
      elements.earthquakeMinimumMagnitude.value,
    ).toLocaleString(i18n.language, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }
  updateMinimumMagnitudeValue();

  elements.faultToggle.addEventListener("change", () => {
    if (elements.faultToggle.checked) faultLayer.addTo(map);
    else {
      map.closePopup();
      setSelectedFeature(null);
      map.removeLayer(faultLayer);
    }
    renderCatalog();
    updateLegendVisibility();
    updateSourceCount();
  });

  elements.evidenceToggle.addEventListener("change", () => {
    if (elements.evidenceToggle.checked) evidenceLayer.addTo(map);
    else map.removeLayer(evidenceLayer);
    updateLegendVisibility();
    if (selectedPoint) renderPlaceExplanation();
  });
  elements.earthquakeToggle.addEventListener("change", () => {
    if (elements.earthquakeToggle.checked) earthquakeLayer.addTo(map);
    else map.removeLayer(earthquakeLayer);
    updateLegendVisibility();
    if (selectedPoint) renderPlaceExplanation();
  });
  elements.earthquakeDays.addEventListener("change", loadEarthquakeData);
  elements.earthquakeMinimumMagnitude.addEventListener("input", updateMinimumMagnitudeValue);
  elements.earthquakeMinimumMagnitude.addEventListener("change", loadEarthquakeData);
  elements.earthquakeDepthFilter.addEventListener("change", () => {
    if (earthquakeState === "loaded") renderEarthquakes();
  });
  elements.search.addEventListener("input", renderCatalog);
  elements.movement.addEventListener("change", renderCatalog);
  elements.clear.addEventListener("click", () => {
    elements.search.value = "";
    elements.movement.value = "all";
    renderCatalog();
    elements.search.focus();
  });
  elements.reset.addEventListener("click", () => {
    map.closePopup();
    setSelectedFeature(null);
    selectedPoint = null;
    basinLookupRequestId += 1;
    basinLookupState = "idle";
    selectedBasin = null;
    placeMarker.removeFrom(map);
    setPlaceMode(false);
    map.fitBounds(ecuadorBounds);
  });

  window.addEventListener("atlas:languagechange", () => {
    if (demoMode) {
      elements.projectStatus.setAttribute("aria-label", t("status.synthetic"));
      elements.statusFull.textContent = t("status.synthetic");
    }
    renderCatalog();
    renderEvidence();
    updateMinimumMagnitudeValue();
    if (earthquakeState === "loaded") renderEarthquakes();
    else updateEarthquakeStatus();
    updateBasinStatus();
    if (stationState === "loaded") renderStations();
    else updateStationStatus();
    updateStationRetrievedAt();
    updatePrecipitationStatus();
    updateAirTemperatureStatus();
    updateCloudFractionStatus();
    updateFloodStatus();
    updateThermalStatus();
    updateLegendVisibility();
    renderSystemView();
    renderPlaceExplanation();
    if (mapError.hidden === false) {
      mapError.querySelector("strong").textContent = t("errors.mapUnavailable");
      mapError.querySelector("p").textContent = t("errors.checkConnection");
    }
  });

  renderSystemView();
  loadAtlasData();
  loadEarthquakeData();
  loadStationData();
}
