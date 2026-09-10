const ECUADOR_BOUNDS = L.latLngBounds(
  [-5.15, -81.25],
  [1.65, -75.05],
);

const map = L.map("map", {
  zoomControl: false,
  minZoom: 5,
  maxZoom: 18,
}).fitBounds(ECUADOR_BOUNDS);

L.control.zoom({ position: "bottomright" }).addTo(map);
L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

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
};

let catalog = [];
let faultLayer = L.geoJSON([], {
  style: styleFeature,
  onEachFeature,
}).addTo(map);

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function movementOf(feature) {
  const value = normalize(feature.properties?.tipo_movimiento);
  return Object.hasOwn(colors, value) ? value : "desconocido";
}

function styleFeature(feature) {
  return {
    color: colors[movementOf(feature)],
    weight: 3,
    opacity: 0.9,
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
    ["Movimiento", "tipo_movimiento"],
    ["Provincia", "provincia"],
    ["Actividad", "actividad"],
    ["Fuente", "fuente"],
  ];

  rows.forEach(([label, key]) => {
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = propertyValue(feature, key);
    list.append(term, description);
  });

  wrapper.append(list);
  return wrapper;
}

function onEachFeature(feature, layer) {
  layer.bindPopup(createPopup(feature));
  layer.on("mouseover", () => layer.setStyle({ weight: 5 }));
  layer.on("mouseout", () => faultLayer.resetStyle(layer));
}

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

function zoomToFeature(feature) {
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
  faultLayer.clearLayers();
  faultLayer.addData({ type: "FeatureCollection", features: visibleFeatures });
  renderList(visibleFeatures);

  elements.resultCount.textContent = String(visibleFeatures.length);
  elements.state.hidden = catalog.length > 0;
}

function updateSummary() {
  const sources = new Set(
    catalog.map((feature) => feature.properties?.fuente).filter((value) => Boolean(value)),
  );
  elements.count.textContent = String(catalog.length);
  elements.sourceCount.textContent = String(sources.size);
}

async function loadCatalog() {
  try {
    const response = await fetch("data/geojson/fallas.geojson");
    if (!response.ok) {
      throw new Error(`No se pudo cargar el catálogo (${response.status})`);
    }

    const data = await response.json();
    catalog = Array.isArray(data.features) ? data.features : [];
    updateSummary();
    renderCatalog();
  } catch (error) {
    console.error(error);
    elements.state.hidden = false;
    elements.state.querySelector("strong").textContent = "No se pudo cargar el catálogo";
    elements.state.querySelector("p").textContent =
      "Comprueba la conexión o la estructura del archivo GeoJSON.";
  }
}

elements.search.addEventListener("input", renderCatalog);
elements.movement.addEventListener("change", renderCatalog);
elements.clear.addEventListener("click", () => {
  elements.search.value = "";
  elements.movement.value = "all";
  renderCatalog();
});
elements.reset.addEventListener("click", () => map.fitBounds(ECUADOR_BOUNDS));

loadCatalog();
