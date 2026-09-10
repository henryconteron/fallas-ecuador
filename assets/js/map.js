const mapElement = document.querySelector("#map");
const mapError = document.querySelector("#map-error");
const i18n = window.atlasI18n;
const t = (key) => i18n?.t(key) ?? key;

if (typeof window.L === "undefined") {
  mapElement.setAttribute("aria-hidden", "true");
  document.querySelector("#reset-view").disabled = true;
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
  const ECUADOR_CONTINENTAL_BOUNDS = L.latLngBounds([-5.15, -81.25], [1.65, -75.05]);
  const EARTHQUAKE_EXTENT = {
    minlatitude: -5.5,
    maxlatitude: 2.5,
    minlongitude: -82.5,
    maxlongitude: -74.5,
  };
  const urlParameters = new URLSearchParams(window.location.search);
  const demoMode = urlParameters.get("demo") === "1";
  document.body.classList.toggle("is-demo", demoMode);
  const catalogUrl = demoMode ? "data/geojson/fallas.demo.geojson" : "data/geojson/fallas.geojson";
  const evidenceUrl = demoMode
    ? "data/geojson/estructuras.demo.geojson"
    : "data/geojson/estructuras.geojson";

  const map = L.map("map", { zoomControl: false, minZoom: 5, maxZoom: 18 }).fitBounds(
    ECUADOR_CONTINENTAL_BOUNDS,
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

  const colors = {
    inversa: "#ef4444",
    normal: "#38bdf8",
    dextral: "#f59e0b",
    sinestral: "#a78bfa",
    desconocido: "#e5e7eb",
  };
  const evidenceColors = {
    escarpe: "#ef6f5d",
    faceta_triangular: "#f0b45b",
    drenaje_desplazado: "#42b7cd",
    laguna_sag: "#52c6a5",
  };
  const earthquakeColors = {
    shallow: "#ef4444",
    intermediate: "#f59e0b",
    deep: "#a78bfa",
    veryDeep: "#38bdf8",
  };

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
    evidenceToggle: document.querySelector("#evidence-toggle"),
    earthquakeToggle: document.querySelector("#earthquake-toggle"),
    earthquakeStatus: document.querySelector("#earthquake-status"),
    list: document.querySelector("#fault-list"),
    state: document.querySelector("#catalog-state"),
    legend: document.querySelector(".legend"),
    dataMode: document.querySelector("#data-mode"),
    projectStatus: document.querySelector(".project-status"),
    statusFull: document.querySelector(".status-full"),
    statusShort: document.querySelector(".status-short"),
    basemapButtons: [...document.querySelectorAll("[data-basemap]")],
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
  let earthquakeGeneratedAt = null;
  let earthquakeState = "loading";
  let earthquakeAttributionAdded = false;
  let selectedFeature = null;
  const featureIds = new WeakMap();

  function template(key, values = {}) {
    return Object.entries(values).reduce(
      (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
      t(key),
    );
  }

  function locale() {
    return i18n?.language === "en" ? "en" : "es-EC";
  }

  function formatNumber(value, maximumFractionDigits = 1) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return t("value.unavailable");
    return new Intl.NumberFormat(locale(), { maximumFractionDigits }).format(numericValue);
  }

  function formatUtcDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t("value.unavailable");
    return `${new Intl.DateTimeFormat(locale(), {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(date)} UTC`;
  }

  function buildEarthquakeUrl() {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 365);
    const parameters = new URLSearchParams({
      format: "geojson",
      starttime: startDate.toISOString(),
      endtime: endDate.toISOString(),
      minmagnitude: "3",
      orderby: "time",
      limit: "20000",
      ...Object.fromEntries(Object.entries(EARTHQUAKE_EXTENT).map(([key, value]) => [key, String(value)])),
    });
    return `https://earthquake.usgs.gov/fdsnws/event/1/query?${parameters}`;
  }

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function localizedProperty(feature, key) {
    const properties = feature.properties ?? {};
    const localizedKey = i18n?.language === "en" ? `${key}_en` : key;
    const value = properties[localizedKey] ?? properties[key];
    return value === null || value === undefined || value === "" ? t("value.unavailable") : String(value);
  }

  function movementOf(feature) {
    const value = normalize(feature.properties?.tipo_movimiento);
    return Object.prototype.hasOwnProperty.call(colors, value) ? value : "desconocido";
  }

  function movementLabel(feature) {
    return t(`movement.${movementOf(feature)}`);
  }

  function styleFeature(feature) {
    return {
      color: colors[movementOf(feature)],
      weight: feature === selectedFeature ? 6 : 3,
      opacity: feature === selectedFeature ? 1 : 0.92,
    };
  }

  function createFaultPopup(feature) {
    const wrapper = document.createElement("div");
    wrapper.className = "fault-popup";
    const title = document.createElement("h3");
    title.textContent = localizedProperty(feature, "nombre");
    wrapper.append(title);

    const list = document.createElement("dl");
    const rows = [
      ["popup.system", "sistema"],
      ["popup.movement", "tipo_movimiento"],
      ["popup.province", "provincia"],
      ["popup.activity", "actividad"],
      ["popup.confidence", "confianza"],
      ["popup.scale", "escala"],
      ["popup.source", "fuente"],
    ];
    rows.forEach(([labelKey, key]) => {
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = t(labelKey);
      description.textContent = key === "tipo_movimiento" ? movementLabel(feature) : localizedProperty(feature, key);
      list.append(term, description);
    });
    const explanation = document.createElement("p");
    explanation.textContent = localizedProperty(feature, "descripcion");
    wrapper.append(list, explanation);
    return wrapper;
  }

  function createEvidencePopup(feature) {
    const wrapper = document.createElement("div");
    wrapper.className = "fault-popup evidence-popup";
    const kicker = document.createElement("p");
    kicker.className = "evidence-kicker";
    kicker.textContent = t(`evidence.${feature.properties?.tipo}`);
    const title = document.createElement("h3");
    title.textContent = localizedProperty(feature, "nombre");
    const list = document.createElement("dl");
    [["popup.observation", "observacion"], ["popup.source", "fuente"]].forEach(([labelKey, key]) => {
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = t(labelKey);
      description.textContent = localizedProperty(feature, key);
      list.append(term, description);
    });
    wrapper.append(kicker, title, list);
    return wrapper;
  }

  function earthquakeDepthClass(feature) {
    const depth = Number(feature.geometry?.coordinates?.[2]);
    if (!Number.isFinite(depth) || depth <= 30) return "shallow";
    if (depth <= 70) return "intermediate";
    if (depth <= 300) return "deep";
    return "veryDeep";
  }

  function createEarthquakePopup(feature) {
    const properties = feature.properties ?? {};
    const depth = feature.geometry?.coordinates?.[2];
    const magnitude = formatNumber(properties.mag);
    const depthValue = Number(depth);
    const depthLabel = Number.isFinite(depthValue) ? `${formatNumber(depthValue)} km` : t("value.unavailable");
    const place = properties.place || t("value.unavailable");
    const wrapper = document.createElement("div");
    wrapper.className = "fault-popup earthquake-popup";

    const title = document.createElement("h3");
    title.textContent = `M ${magnitude} · ${place}`;
    const list = document.createElement("dl");
    const rows = [
      [t("popup.magnitude"), magnitude],
      [t("popup.depth"), depthLabel],
      [t("popup.dateUtc"), formatUtcDate(properties.time)],
      [t("popup.place"), place],
      [t("popup.catalog"), properties.net ? `USGS · ${String(properties.net).toUpperCase()}` : "USGS"],
    ];
    rows.forEach(([label, value]) => {
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      list.append(term, description);
    });
    wrapper.append(title, list);

    if (typeof properties.url === "string") {
      try {
        const eventUrl = new URL(properties.url);
        if (eventUrl.protocol === "https:") {
          const link = document.createElement("a");
          link.className = "event-link";
          link.href = eventUrl.href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = `${t("popup.openEvent")} ↗`;
          wrapper.append(link);
        }
      } catch (error) {
        console.warn("Invalid USGS event URL", error);
      }
    }
    return wrapper;
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
    layer.bindPopup(createFaultPopup(feature));
    layer.on("click", () => setSelectedFeature(feature));
    layer.on("mouseover", () => layer.setStyle({ weight: feature === selectedFeature ? 6 : 5 }));
    layer.on("mouseout", () => layer.setStyle(styleFeature(feature)));
  }

  const faultLayer = L.geoJSON([], { style: styleFeature, onEachFeature: onEachFault }).addTo(map);
  const evidenceLayer = L.geoJSON([], {
    pointToLayer(feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 7,
        weight: 2,
        color: "#102523",
        fillColor: evidenceColors[feature.properties?.tipo] ?? "#6ee7c8",
        fillOpacity: 0.95,
        className: "evidence-marker",
      });
    },
    onEachFeature(feature, layer) {
      layer.bindPopup(createEvidencePopup(feature));
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
        weight: 1.25,
        color: "#ffffff",
        fillColor: earthquakeColors[earthquakeDepthClass(feature)],
        fillOpacity: 0.78,
        opacity: 0.9,
        className: "earthquake-marker",
      });
    },
    onEachFeature(feature, layer) {
      layer.bindPopup(createEarthquakePopup(feature));
      const magnitude = formatNumber(feature.properties?.mag);
      layer.bindTooltip(`M ${magnitude}`, { direction: "top", offset: [0, -4] });
    },
  });

  function matchesFilters(feature) {
    const query = normalize(elements.search.value);
    const selectedMovement = elements.movement.value;
    const properties = feature.properties ?? {};
    const searchableText = normalize(
      [properties.nombre, properties.nombre_en, properties.provincia, properties.provincia_en, properties.sistema, properties.sistema_en]
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
        detail.textContent = `${localizedProperty(feature, "provincia")} · ${movementLabel(feature)}`;
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
    elements.count.textContent = String(visibleFeatures.length);
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
  }

  function renderEvidence() {
    evidenceLayer.clearLayers();
    evidenceLayer.addData({ type: "FeatureCollection", features: evidenceCatalog });
    elements.evidenceCount.textContent = String(evidenceCatalog.length);
    elements.evidenceToggle.disabled = evidenceCatalog.length === 0;
    if (evidenceCatalog.length === 0) elements.evidenceToggle.checked = false;
    if (elements.evidenceToggle.checked && !map.hasLayer(evidenceLayer)) evidenceLayer.addTo(map);
    if (!elements.evidenceToggle.checked && map.hasLayer(evidenceLayer)) map.removeLayer(evidenceLayer);
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
      count: earthquakeCatalog.length,
      date: formatUtcDate(earthquakeGeneratedAt),
    });
  }

  function renderEarthquakes() {
    earthquakeLayer.clearLayers();
    earthquakeLayer.addData({ type: "FeatureCollection", features: earthquakeCatalog });
    elements.earthquakeCount.textContent = String(earthquakeCatalog.length);
    elements.earthquakeToggle.disabled = earthquakeState !== "loaded";
    if (earthquakeState === "error") elements.earthquakeToggle.checked = false;
    if (elements.earthquakeToggle.checked && !map.hasLayer(earthquakeLayer)) earthquakeLayer.addTo(map);
    if (!elements.earthquakeToggle.checked && map.hasLayer(earthquakeLayer)) map.removeLayer(earthquakeLayer);
    updateEarthquakeStatus();
    updateSourceCount();
  }

  function updateSourceCount() {
    const sources = new Set(
      [...catalog, ...evidenceCatalog]
        .map((feature) => feature.properties?.fuente)
        .filter((value) => typeof value === "string" && value.trim() !== ""),
    );
    if (earthquakeCatalog.length > 0) sources.add("USGS");
    elements.sourceCount.textContent = String(sources.size);
  }

  async function loadEarthquakeData() {
    earthquakeState = "loading";
    updateEarthquakeStatus();
    try {
      const response = await fetch(buildEarthquakeUrl(), {
        cache: "no-store",
        headers: { Accept: "application/geo+json, application/json" },
      });
      if (!response.ok) throw new Error(`USGS query failed (${response.status})`);
      const data = await response.json();
      if (data?.type !== "FeatureCollection" || !Array.isArray(data.features)) {
        throw new Error("Invalid USGS GeoJSON FeatureCollection");
      }
      earthquakeCatalog = data.features.filter(
        (feature) => feature?.type === "Feature" && feature.geometry?.type === "Point" &&
          Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.length >= 2,
      );
      earthquakeGeneratedAt = Number(data.metadata?.generated) || Date.now();
      earthquakeState = "loaded";
      if (!earthquakeAttributionAdded) {
        map.attributionControl.addAttribution(
          'Earthquake data: <a href="https://earthquake.usgs.gov/earthquakes/search/" target="_blank" rel="noopener">USGS</a>',
        );
        earthquakeAttributionAdded = true;
      }
    } catch (error) {
      console.error(error);
      earthquakeCatalog = [];
      earthquakeGeneratedAt = null;
      earthquakeState = "error";
    }
    renderEarthquakes();
  }

  function validateFeatureCollection(data, acceptedGeometry) {
    if (data?.type !== "FeatureCollection" || !Array.isArray(data.features)) throw new Error("Invalid GeoJSON FeatureCollection");
    const invalidFeature = data.features.find(
      (feature) => feature?.type !== "Feature" || !acceptedGeometry.includes(feature.geometry?.type),
    );
    if (invalidFeature) throw new Error("Unsupported GeoJSON geometry");
    return data.features;
  }

  async function loadGeoJson(url, acceptedGeometry) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
    return validateFeatureCollection(await response.json(), acceptedGeometry);
  }

  async function loadAtlasData() {
    const [faultResult, evidenceResult] = await Promise.allSettled([
      loadGeoJson(catalogUrl, ["LineString", "MultiLineString"]),
      loadGeoJson(evidenceUrl, ["Point", "MultiPoint"]),
    ]);

    if (faultResult.status === "fulfilled") {
      catalog = faultResult.value;
      catalog.forEach((feature, index) => featureIds.set(feature, String(feature.id ?? `feature-${index + 1}`)));
      renderCatalog();
    } else {
      console.error(faultResult.reason);
      catalog = [];
      faultLayer.clearLayers();
      elements.count.textContent = "0";
      elements.resultCount.textContent = "0";
      showCatalogState(t("catalog.loadErrorTitle"), t("catalog.loadErrorCopy"));
      updateControls();
    }

    if (evidenceResult.status === "fulfilled") {
      evidenceCatalog = evidenceResult.value;
      elements.evidenceToggle.checked = demoMode && evidenceCatalog.length > 0;
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

  elements.evidenceToggle.addEventListener("change", () => {
    if (elements.evidenceToggle.checked) evidenceLayer.addTo(map);
    else map.removeLayer(evidenceLayer);
  });
  elements.earthquakeToggle.addEventListener("change", () => {
    if (elements.earthquakeToggle.checked) earthquakeLayer.addTo(map);
    else map.removeLayer(earthquakeLayer);
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
    map.fitBounds(ECUADOR_CONTINENTAL_BOUNDS);
  });

  window.addEventListener("atlas:languagechange", () => {
    if (demoMode) {
      elements.projectStatus.setAttribute("aria-label", t("status.synthetic"));
      elements.statusFull.textContent = t("status.synthetic");
    }
    renderCatalog();
    renderEvidence();
    if (earthquakeState === "loaded") renderEarthquakes();
    else updateEarthquakeStatus();
    if (mapError.hidden === false) {
      mapError.querySelector("strong").textContent = t("errors.mapUnavailable");
      mapError.querySelector("p").textContent = t("errors.checkConnection");
    }
  });

  loadAtlasData();
  loadEarthquakeData();
}
