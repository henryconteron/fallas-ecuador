const mapElement = document.querySelector("#map");
const mapError = document.querySelector("#map-error");

if (typeof window.L === "undefined") {
  mapElement.setAttribute("aria-hidden", "true");
  document.querySelector("#reset-view").disabled = true;
  document.querySelector(".legend").hidden = true;
  mapError.hidden = false;

  const catalogState = document.querySelector("#catalog-state");
  catalogState.querySelector("strong").textContent = "No se pudo iniciar el visor";
  catalogState.querySelector("p").textContent =
    "Comprueba la conexión y vuelve a cargar la página.";
} else {
  initializeAtlas();
}

function initializeAtlas() {
  const L = window.L;
  const ECUADOR_CONTINENTAL_BOUNDS = L.latLngBounds(
    [-5.15, -81.25],
    [1.65, -75.05],
  );
  const urlParameters = new URLSearchParams(window.location.search);
  const demoMode = urlParameters.get("demo") === "1";
  const catalogUrl = demoMode
    ? "data/geojson/fallas.demo.geojson"
    : "data/geojson/fallas.geojson";

  const map = L.map("map", {
    zoomControl: false,
    minZoom: 5,
    maxZoom: 18,
  }).fitBounds(ECUADOR_CONTINENTAL_BOUNDS);

  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.control.scale({ imperial: false, position: "topright" }).addTo(map);

  const baseMap = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  let tileErrors = 0;
  baseMap.on("tileerror", () => {
    tileErrors += 1;
    if (tileErrors >= 4 && document.querySelectorAll(".leaflet-tile-loaded").length === 0) {
      mapError.querySelector("strong").textContent = "No se pudo cargar el mapa base";
      mapError.querySelector("p").textContent =
        "Las trazas pueden seguir disponibles. Comprueba la conexión e inténtalo nuevamente.";
      mapError.hidden = false;
    }
  });
  baseMap.on("load", () => {
    mapError.hidden = true;
  });

  const colors = {
    inversa: "#ef4444",
    normal: "#38bdf8",
    dextral: "#f59e0b",
    sinestral: "#a78bfa",
    desconocido: "#e5e7eb",
  };

  const elements = {
    search: document.querySelector("#fault-search"),
    movement: document.querySelector("#movement-filter"),
    clear: document.querySelector("#clear-filters"),
    reset: document.querySelector("#reset-view"),
    count: document.querySelector("#fault-count"),
    resultCount: document.querySelector("#result-count"),
    sourceCount: document.querySelector("#source-count"),
    list: document.querySelector("#fault-list"),
    state: document.querySelector("#catalog-state"),
    legend: document.querySelector(".legend"),
    dataMode: document.querySelector("#data-mode"),
    projectStatus: document.querySelector(".project-status"),
    statusFull: document.querySelector(".status-full"),
    statusShort: document.querySelector(".status-short"),
  };

  if (demoMode) {
    elements.dataMode.hidden = false;
    elements.projectStatus.setAttribute("aria-label", "Modo demostración con datos sintéticos");
    elements.statusFull.textContent = "Modo demostración";
    elements.statusShort.textContent = "Demo";
  }

  const compactLegend = window.matchMedia("(max-width: 30rem)");
  const updateLegendMode = (mediaQuery) => {
    elements.legend.open = !mediaQuery.matches;
  };
  updateLegendMode(compactLegend);
  compactLegend.addEventListener?.("change", updateLegendMode);

  let catalog = [];
  let selectedFeature = null;
  const featureIds = new WeakMap();
  let faultLayer;

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function movementOf(feature) {
    const value = normalize(feature.properties?.tipo_movimiento);
    return Object.prototype.hasOwnProperty.call(colors, value) ? value : "desconocido";
  }

  function styleFeature(feature) {
    return {
      color: colors[movementOf(feature)],
      weight: feature === selectedFeature ? 6 : 3,
      opacity: feature === selectedFeature ? 1 : 0.9,
    };
  }

  function propertyValue(feature, key) {
    const value = feature.properties?.[key];
    return value === null || value === undefined || value === "" ? "No disponible" : String(value);
  }

  function createPopup(feature) {
    const wrapper = document.createElement("div");
    wrapper.className = "fault-popup";

    const title = document.createElement("h3");
    title.textContent = propertyValue(feature, "nombre");
    wrapper.append(title);

    const list = document.createElement("dl");
    const rows = [
      ["Sistema", "sistema"],
      ["Movimiento", "tipo_movimiento"],
      ["Provincia", "provincia"],
      ["Actividad", "actividad"],
      ["Confianza", "confianza"],
      ["Escala", "escala"],
      ["Fuente", "fuente"],
    ];

    rows.forEach(([label, key]) => {
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = propertyValue(feature, key);
      list.append(term, description);
    });

    const explanation = document.createElement("p");
    explanation.textContent = propertyValue(feature, "descripcion");
    wrapper.append(list, explanation);
    return wrapper;
  }

  function featureId(feature) {
    return featureIds.get(feature) ?? "";
  }

  function setSelectedFeature(feature) {
    selectedFeature = feature;

    faultLayer.eachLayer((layer) => {
      layer.setStyle(styleFeature(layer.feature));
    });

    elements.list.querySelectorAll("button[data-feature-id]").forEach((button) => {
      if (feature && button.dataset.featureId === featureId(feature)) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function onEachFeature(feature, layer) {
    layer.bindPopup(createPopup(feature));
    layer.on("click", () => setSelectedFeature(feature));
    layer.on("mouseover", () => layer.setStyle({ weight: feature === selectedFeature ? 6 : 5 }));
    layer.on("mouseout", () => layer.setStyle(styleFeature(feature)));
  }

  faultLayer = L.geoJSON([], {
    style: styleFeature,
    onEachFeature,
  }).addTo(map);

  function matchesFilters(feature) {
    const query = normalize(elements.search.value);
    const selectedMovement = elements.movement.value;
    const properties = feature.properties ?? {};
    const searchableText = normalize(
      [properties.nombre, properties.provincia, properties.sistema].filter(Boolean).join(" "),
    );

    const matchesText = query === "" || searchableText.includes(query);
    const matchesMovement =
      selectedMovement === "all" || movementOf(feature) === selectedMovement;

    return matchesText && matchesMovement;
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

  function showCatalogState(title, message) {
    elements.state.hidden = false;
    elements.state.querySelector("strong").textContent = title;
    elements.state.querySelector("p").textContent = message;
  }

  function zoomToFeature(feature) {
    setSelectedFeature(feature);
    const temporaryLayer = L.geoJSON(feature);
    const bounds = temporaryLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.35), { maxZoom: 13 });
    }

    faultLayer.eachLayer((layer) => {
      if (layer.feature === feature) {
        layer.openPopup();
      }
    });
  }

  function renderList(features) {
    elements.list.replaceChildren();

    features
      .slice()
      .sort((a, b) => propertyValue(a, "nombre").localeCompare(propertyValue(b, "nombre"), "es"))
      .forEach((feature) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        const name = document.createElement("strong");
        const detail = document.createElement("small");

        button.type = "button";
        button.dataset.featureId = featureId(feature);
        if (feature === selectedFeature) {
          button.setAttribute("aria-current", "true");
        }
        name.textContent = propertyValue(feature, "nombre");
        detail.textContent = `${propertyValue(feature, "provincia")} · ${propertyValue(
          feature,
          "tipo_movimiento",
        )}`;
        button.append(name, detail);
        button.addEventListener("click", () => zoomToFeature(feature));
        item.append(button);
        elements.list.append(item);
      });
  }

  function renderCatalog() {
    const visibleFeatures = catalog.filter(matchesFilters);
    if (selectedFeature && !visibleFeatures.includes(selectedFeature)) {
      selectedFeature = null;
    }

    faultLayer.clearLayers();
    faultLayer.addData({ type: "FeatureCollection", features: visibleFeatures });
    renderList(visibleFeatures);

    elements.count.textContent = String(visibleFeatures.length);
    elements.resultCount.textContent = String(visibleFeatures.length);

    if (catalog.length === 0) {
      showCatalogState(
        "Catálogo en preparación",
        "El mapa está listo para recibir las primeras trazas verificadas.",
      );
    } else if (visibleFeatures.length === 0) {
      showCatalogState(
        "Sin coincidencias",
        "Prueba con otro nombre, provincia, sistema o tipo de movimiento.",
      );
    } else {
      elements.state.hidden = true;
    }

    updateControls();
  }

  function updateSourceCount() {
    const sources = new Set(
      catalog
        .map((feature) => feature.properties?.fuente)
        .filter((value) => typeof value === "string" && value.trim() !== ""),
    );
    elements.sourceCount.textContent = String(sources.size);
  }

  function validateFeatureCollection(data) {
    if (data?.type !== "FeatureCollection" || !Array.isArray(data.features)) {
      throw new Error("El archivo no es una colección GeoJSON válida");
    }

    const invalidFeature = data.features.find(
      (feature) =>
        feature?.type !== "Feature" ||
        !["LineString", "MultiLineString"].includes(feature.geometry?.type),
    );
    if (invalidFeature) {
      throw new Error("El catálogo contiene una geometría no compatible");
    }

    return data.features;
  }

  async function loadCatalog() {
    try {
      const response = await fetch(catalogUrl);
      if (!response.ok) {
        throw new Error(`No se pudo cargar el catálogo (${response.status})`);
      }

      const data = await response.json();
      catalog = validateFeatureCollection(data);
      catalog.forEach((feature, index) => {
        featureIds.set(feature, String(feature.id ?? `feature-${index + 1}`));
      });
      updateSourceCount();
      renderCatalog();
    } catch (error) {
      console.error(error);
      catalog = [];
      faultLayer.clearLayers();
      elements.count.textContent = "0";
      elements.resultCount.textContent = "0";
      elements.sourceCount.textContent = "0";
      showCatalogState(
        "No se pudo cargar el catálogo",
        "Comprueba la conexión o la estructura del archivo GeoJSON.",
      );
      updateControls();
    }
  }

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

  loadCatalog();
}
