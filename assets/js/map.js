import {
  DATASETS,
  ECUADOR_CONTINENTAL_BOUNDS,
  HILLSHADE,
  SOURCE_REGISTRY,
} from "./map/config.js";
import { loadGeoJson, loadRecentEarthquakes } from "./map/data.js";
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
import {
  normalizePrecipitationDate,
  precipitationDateRange,
  PRECIPITATION_SOURCE,
  precipitationWmsOptions,
} from "./map/precipitation.js";
import { catalogForLanguage } from "./map/source-catalog.js";
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

  const precipitationRange = precipitationDateRange();
  map.createPane("precipitation");
  map.getPane("precipitation").style.zIndex = "270";
  const precipitationLayer = L.tileLayer.wms(
    PRECIPITATION_SOURCE.endpoint,
    { ...precipitationWmsOptions(precipitationRange.selected), pane: "precipitation" },
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
    precipitationCard: document.querySelector("#precipitation-layer-card"),
    precipitationToggle: document.querySelector("#precipitation-toggle"),
    precipitationDate: document.querySelector("#precipitation-date"),
    precipitationOpacity: document.querySelector("#precipitation-opacity"),
    precipitationOpacityValue: document.querySelector("#precipitation-opacity-value"),
    precipitationStatus: document.querySelector("#precipitation-status"),
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
  let previewSystem = "earth";
  let precipitationState = "off";
  let precipitationTileErrors = 0;
  let thermalState = "off";
  let thermalTileErrors = 0;
  const featureIds = new WeakMap();

  elements.precipitationDate.min = precipitationRange.min;
  elements.precipitationDate.max = precipitationRange.max;
  elements.precipitationDate.value = precipitationRange.selected;
  elements.thermalDate.min = thermalRange.min;
  elements.thermalDate.max = thermalRange.max;
  elements.thermalDate.value = thermalRange.selected;

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
    const sources = catalogForLanguage(i18n?.language);
    const connected = sources.filter((source) => source.status === "connected").length;
    const candidate = sources.filter((source) => source.status === "candidate").length;
    elements.sourceNetworkBadge.textContent = template("sourcesNetwork.summary", { connected, candidate });
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

  function formatApproximateDistance(distanceKm) {
    return template("place.approxDistance", {
      distance: formatNumber(distanceKm, distanceKm < 10 ? 1 : 0),
    });
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
      precipitation: map.hasLayer(precipitationLayer),
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
      updateLegendVisibility();
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
    if (map.hasLayer(thermalLayer)) sources.add("NASA FIRMS / GIBS");
    if (map.hasLayer(precipitationLayer)) sources.add("NASA GPM IMERG / GIBS");
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
      previewSystem = button.dataset.system || "earth";
      elements.systemButtons.forEach((item) => {
        item.classList.toggle("is-previewed", item === button && previewSystem !== "earth");
      });
      elements.systemNote.textContent = t(`systems.${previewSystem}Note`);
      if (["water", "sky", "life"].includes(previewSystem)) {
        const targetCard = previewSystem === "life" ? elements.thermalCard : elements.precipitationCard;
        targetCard.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "center",
        });
      }
    });
  });

  elements.explainPlace.addEventListener("click", () => setPlaceMode(!placeMode));
  elements.closePlaceExplainer.addEventListener("click", () => setPlaceMode(false));
  map.on("click", (event) => {
    if (!placeMode || event.originalEvent?.target?.closest?.(".leaflet-interactive")) return;
    selectedPoint = [event.latlng.lng, event.latlng.lat];
    placeMarker.setLatLng(event.latlng).addTo(map);
    renderPlaceExplanation();
  });

  function updateHillshadeOpacity() {
    const opacity = Number(elements.hillshadeOpacity.value) / 100;
    hillshadeLayer.setOpacity(opacity);
    elements.hillshadeOpacityValue.value = `${Math.round(opacity * 100)}%`;
  }
  updateHillshadeOpacity();

  elements.hillshadeToggle.addEventListener("change", () => {
    if (elements.hillshadeToggle.checked) hillshadeLayer.addTo(map);
    else map.removeLayer(hillshadeLayer);
    elements.hillshadeOpacity.disabled = !elements.hillshadeToggle.checked;
    updateSourceCount();
  });
  elements.hillshadeOpacity.addEventListener("input", updateHillshadeOpacity);

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
    updatePrecipitationStatus();
    updateThermalStatus();
    updateLegendVisibility();
    elements.systemNote.textContent = t(`systems.${previewSystem}Note`);
    renderSourceNetwork();
    renderPlaceExplanation();
    if (mapError.hidden === false) {
      mapError.querySelector("strong").textContent = t("errors.mapUnavailable");
      mapError.querySelector("p").textContent = t("errors.checkConnection");
    }
  });

  renderSourceNetwork();
  loadAtlasData();
  loadEarthquakeData();
}
