export function createTextTools(i18n) {
  const t = (key) => i18n?.t(key) ?? key;

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

  function localizedProperty(feature, key) {
    const properties = feature.properties ?? {};
    const localizedKey = i18n?.language === "en" ? `${key}_en` : key;
    const value = properties[localizedKey] ?? properties[key];
    return value === null || value === undefined || value === "" ? t("value.unavailable") : String(value);
  }

  return { t, template, locale, formatNumber, formatUtcDate, localizedProperty };
}

export function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function catalogKey(feature) {
  const catalogId = String(feature.properties?.catalog_id ?? feature.id ?? "");
  if (catalogId.startsWith("SA_")) return "SARA";
  if (catalogId.startsWith("ATA_")) return "ATA";
  return String(feature.properties?.catalog_name ?? "").trim();
}

export function missingScientificFields(feature) {
  const properties = feature.properties ?? {};
  return ["reference", "actividad", "confianza", "escala"].filter((key) => {
    const value = properties[key];
    return value === null || value === undefined || String(value).trim() === "";
  });
}
