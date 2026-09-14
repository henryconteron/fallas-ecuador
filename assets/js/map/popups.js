import { FAULT_METADATA_PROFILES, SOURCE_REGISTRY } from "./config.js";
import { catalogKey, missingScientificFields } from "./utils.js";

function appendDefinitionRows(list, rows, t) {
  rows.forEach(([labelKey, value]) => {
    if (value === t("value.unavailable")) return;
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = t(labelKey);
    description.textContent = value;
    list.append(term, description);
  });
}

function appendHttpsLink(wrapper, url, text, warningLabel) {
  if (typeof url !== "string") return;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:") return;
    const link = document.createElement("a");
    link.className = "event-link";
    link.href = parsedUrl.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `${text} ↗`;
    wrapper.append(link);
  } catch (error) {
    console.warn(warningLabel, error);
  }
}

function appendOriginalSourceAttributes(wrapper, feature, context) {
  const { t, localizedProperty } = context;
  const fields = [
    ["popup.netSlipRate", "net_slip_rate"],
    ["popup.averageDip", "average_dip"],
    ["popup.dipDirection", "dip_dir"],
    ["popup.upperSeisDepth", "upper_seis_depth"],
    ["popup.lowerSeisDepth", "lower_seis_depth"],
  ].filter(([, key]) => {
    const value = feature.properties?.[key];
    return value !== null && value !== undefined && String(value).trim() !== "";
  });
  if (!fields.length) return;

  const details = document.createElement("details");
  details.className = "source-attributes";
  const summary = document.createElement("summary");
  summary.textContent = t("popup.sourceAttributes");
  const list = document.createElement("dl");
  appendDefinitionRows(
    list,
    fields.map(([labelKey, key]) => [labelKey, localizedProperty(feature, key)]),
    t,
  );
  const note = document.createElement("p");
  note.textContent = t("popup.sourceAttributesNote");
  details.append(summary, list, note);
  wrapper.append(details);
}

function appendCatalogMetadataProfile(wrapper, feature, context) {
  const { t } = context;
  const catalogSource = SOURCE_REGISTRY[catalogKey(feature)];
  const profile = FAULT_METADATA_PROFILES[catalogSource?.metadataProfile];
  if (!profile) return;

  const details = document.createElement("details");
  details.className = "source-attributes metadata-profile";
  const summary = document.createElement("summary");
  summary.textContent = t("popup.metadataProfile");
  const list = document.createElement("dl");
  appendDefinitionRows(
    list,
    [
      ["popup.catalogReference", catalogSource.citation],
      ["popup.catalogLicense", catalogSource.license],
      ["popup.metadataCoverage", t(profile.coverage)],
      ["popup.metadataLimits", t(profile.limits)],
    ],
    t,
  );
  const links = document.createElement("p");
  links.className = "metadata-links";
  appendHttpsLink(
    links,
    catalogSource.repository,
    t("popup.catalogRepository"),
    "Invalid catalog repository URL",
  );
  appendHttpsLink(
    links,
    catalogSource.publication,
    t(catalogSource.publicationLabel ?? "popup.catalogPublication"),
    "Invalid catalog publication URL",
  );
  appendHttpsLink(
    links,
    catalogSource.contextPublication,
    t("popup.catalogContextPublication"),
    "Invalid catalog context publication URL",
  );
  details.append(summary, list);
  if (links.childElementCount > 0) details.append(links);
  wrapper.append(details);
}

export function createFaultPopup(feature, context) {
  const { t, template, localizedProperty, movementLabel, demoMode } = context;
  const wrapper = document.createElement("div");
  wrapper.className = "fault-popup";
  const title = document.createElement("h3");
  title.textContent = localizedProperty(feature, "nombre");
  wrapper.append(title);

  const list = document.createElement("dl");
  const fields = [
    ["popup.system", "sistema"],
    ["popup.movement", "tipo_movimiento"],
    ["popup.originalMovement", "movimiento_original"],
    ["popup.province", "provincia"],
    ["popup.activity", "actividad"],
    ["popup.confidence", "confianza"],
    ["popup.scale", "escala"],
    ["popup.source", "fuente"],
    ["popup.reference", "reference"],
    ["popup.catalogId", "catalog_id"],
    ["popup.license", "licencia"],
  ];
  appendDefinitionRows(
    list,
    fields.map(([labelKey, key]) => [
      labelKey,
      key === "tipo_movimiento" ? movementLabel(feature) : localizedProperty(feature, key),
    ]),
    t,
  );

  const catalogSource = SOURCE_REGISTRY[catalogKey(feature)];
  if (!feature.properties?.reference && catalogSource?.citation) {
    appendDefinitionRows(list, [["popup.catalogReference", catalogSource.citation]], t);
  }
  const explanation = document.createElement("p");
  explanation.textContent = localizedProperty(feature, "descripcion");
  wrapper.append(list, explanation);

  const missingFields = missingScientificFields(feature);
  if (!demoMode && missingFields.length > 0) {
    const notice = document.createElement("p");
    notice.className = "metadata-notice";
    notice.textContent = template("popup.missingMetadata", {
      fields: missingFields.map((key) => t(`metadata.${key}`)).join(", "),
    });
    wrapper.append(notice);
  }

  if (!demoMode) appendOriginalSourceAttributes(wrapper, feature, context);
  if (!demoMode) appendCatalogMetadataProfile(wrapper, feature, context);

  appendHttpsLink(
    wrapper,
    feature.properties?.fuente_url,
    t("popup.openSource"),
    "Invalid fault source URL",
  );
  return wrapper;
}

export function createEvidencePopup(feature, context) {
  const { t, localizedProperty } = context;
  const wrapper = document.createElement("div");
  wrapper.className = "fault-popup evidence-popup";
  const kicker = document.createElement("p");
  kicker.className = "evidence-kicker";
  kicker.textContent = t(`evidence.${feature.properties?.tipo}`);
  const title = document.createElement("h3");
  title.textContent = localizedProperty(feature, "nombre");
  const list = document.createElement("dl");
  const fields = [
    ["popup.observation", "observacion"],
    ["popup.confidence", "confianza"],
    ["popup.precision", "precision"],
    ["popup.locationMethod", "metodo_localizacion"],
    ["popup.linkedFaults", "fault_catalog_ids"],
    ["popup.sourceSection", "source_section"],
    ["popup.source", "fuente"],
    ["popup.license", "licencia"],
  ];
  appendDefinitionRows(
    list,
    fields.map(([labelKey, key]) => {
      const rawValue = feature.properties?.[key];
      return [labelKey, Array.isArray(rawValue) ? rawValue.join(", ") : localizedProperty(feature, key)];
    }),
    t,
  );
  wrapper.append(kicker, title, list);
  appendHttpsLink(
    wrapper,
    feature.properties?.fuente_url,
    t("popup.openSource"),
    "Invalid evidence source URL",
  );
  return wrapper;
}

export function createEarthquakePopup(feature, context) {
  const { t, formatNumber, formatUtcDate } = context;
  const properties = feature.properties ?? {};
  const depthValue = Number(feature.geometry?.coordinates?.[2]);
  const magnitude = formatNumber(properties.mag);
  const depthLabel = Number.isFinite(depthValue) ? `${formatNumber(depthValue)} km` : t("value.unavailable");
  const place = properties.place || t("value.unavailable");
  const wrapper = document.createElement("div");
  wrapper.className = "fault-popup earthquake-popup";
  const title = document.createElement("h3");
  title.textContent = `M ${magnitude} · ${place}`;
  const list = document.createElement("dl");
  appendDefinitionRows(
    list,
    [
      ["popup.magnitude", magnitude],
      ["popup.depth", depthLabel],
      ["popup.dateUtc", formatUtcDate(properties.time)],
      ["popup.place", place],
      ["popup.catalog", properties.net ? `USGS · ${String(properties.net).toUpperCase()}` : "USGS"],
    ],
    t,
  );
  wrapper.append(title, list);

  const eventUrl = properties.url;
  if (typeof eventUrl === "string") {
    try {
      const parsedUrl = new URL(eventUrl);
      const trustedHost = parsedUrl.hostname === "usgs.gov" || parsedUrl.hostname.endsWith(".usgs.gov");
      if (parsedUrl.protocol === "https:" && trustedHost) {
        appendHttpsLink(wrapper, parsedUrl.href, t("popup.openEvent"), "Invalid USGS event URL");
      }
    } catch (error) {
      console.warn("Invalid USGS event URL", error);
    }
  }
  return wrapper;
}
