#!/usr/bin/env python3
"""Build the Ecuador fault catalog from the GEM harmonized GeoJSON.

The script selects SARA and Active Tectonics of the Andes features whose
original geometry intersects Ecuador. Geometries are not clipped or simplified.
geoBoundaries boundaries are used only for spatial selection and province tags.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

from shapely.geometry import shape


GEM_SOURCE_URL = (
    "https://github.com/GEMScienceTools/gem-global-active-faults/"
    "blob/master/geojson/gem_active_faults_harmonized.geojson"
)
GEM_SOURCE_BLOB_SHA = "fb164770b529695544fa864abe2cc9dd8aa5793d"
GEOBOUNDARIES_URL = (
    "https://github.com/wmgeolab/geoBoundaries/tree/9469f09/"
    "releaseData/gbOpen/ECU"
)
EXTRACTION_DATE = "2026-09-10"
ACCEPTED_PREFIXES = ("SA_", "ATA_")

PROVINCE_NAMES = {
    "Sucumbios": "Sucumbíos",
    "Manabi": "Manabí",
    "Bolivar": "Bolívar",
    "Los Rios": "Los Ríos",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gem", required=True, type=Path, help="GEM harmonized GeoJSON")
    parser.add_argument("--countries", required=True, type=Path, help="geoBoundaries Ecuador ADM0 GeoJSON")
    parser.add_argument("--provinces", required=True, type=Path, help="geoBoundaries Ecuador ADM1 GeoJSON")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/geojson/fallas.geojson"),
        help="Output GeoJSON path",
    )
    return parser.parse_args()


def read_geojson(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as source:
        data = json.load(source)
    if data.get("type") != "FeatureCollection" or not isinstance(data.get("features"), list):
        raise ValueError(f"{path} is not a GeoJSON FeatureCollection")
    return data


def cleaned_name(value: Any, catalog_id: str) -> str:
    if not isinstance(value, str) or not value.strip():
        return f"Traza sin nombre ({catalog_id})"
    name = re.sub(r"\s+", " ", value.replace("_", " ")).strip()
    return name.title() if name.isupper() else name


def movement_category(value: Any) -> str:
    movement = str(value or "").lower()
    if "sinistral" in movement:
        return "sinestral"
    if "dextral" in movement:
        return "dextral"
    if "reverse" in movement or "thrust" in movement:
        return "inversa"
    if "normal" in movement:
        return "normal"
    return "desconocido"


def catalog_source(catalog_id: str) -> str:
    if catalog_id.startswith("SA_"):
        return "SARA (Alvarado et al., 2017) vía GEM GAF-DB"
    return "ATA (Veloza et al., 2012) vía GEM GAF-DB"


def catalog_description(catalog_id: str) -> tuple[str, str]:
    catalog = "SARA" if catalog_id.startswith("SA_") else "Active Tectonics of the Andes"
    spanish = (
        f"Traza regional incorporada por GEM GAF-DB desde el catálogo {catalog}. "
        "Consulte la clasificación original y la referencia antes de usarla a escala local."
    )
    english = (
        f"Regional trace incorporated into GEM GAF-DB from the {catalog} catalog. "
        "Check the original classification and reference before using it at local scale."
    )
    return spanish, english


def ecuador_geometry(countries: dict[str, Any]):
    for feature in countries["features"]:
        properties = feature.get("properties") or {}
        if properties.get("shapeISO") == "ECU" or properties.get("shapeName") == "Ecuador":
            return shape(feature["geometry"])
    raise ValueError("Ecuador was not found in the admin-0 boundary file")


def ecuador_provinces(provinces: dict[str, Any]) -> list[tuple[str, Any]]:
    selected = []
    for feature in provinces["features"]:
        properties = feature.get("properties") or {}
        if properties.get("shapeGroup") != "ECU":
            continue
        raw_name = properties.get("shapeName")
        if not raw_name:
            continue
        name = PROVINCE_NAMES.get(raw_name, raw_name)
        selected.append((name, shape(feature["geometry"])))
    if len(selected) != 24:
        raise ValueError(f"Expected 24 Ecuador provinces, found {len(selected)}")
    return selected


def feature_sort_key(feature: dict[str, Any]) -> tuple[str, int]:
    catalog_id = str(feature.get("id", ""))
    prefix, _, number = catalog_id.partition("_")
    return prefix, int(number) if number.isdigit() else 0


def build_catalog(
    gem: dict[str, Any],
    countries: dict[str, Any],
    provinces: dict[str, Any],
) -> dict[str, Any]:
    country = ecuador_geometry(countries)
    province_geometries = ecuador_provinces(provinces)
    output_features = []

    for source_feature in gem["features"]:
        original = source_feature.get("properties") or {}
        catalog_id = str(original.get("catalog_id") or "")
        geometry = source_feature.get("geometry") or {}
        if not catalog_id.startswith(ACCEPTED_PREFIXES):
            continue
        if geometry.get("type") not in {"LineString", "MultiLineString"}:
            continue

        line = shape(geometry)
        if line.is_empty or not line.intersects(country):
            continue

        province_names = sorted(
            {name for name, province in province_geometries if line.intersects(province)},
            key=str.casefold,
        )
        name = cleaned_name(original.get("name"), catalog_id)
        name_en = name if original.get("name") else f"Unnamed trace ({catalog_id})"
        original_movement = original.get("slip_type")
        description, description_en = catalog_description(catalog_id)
        properties = dict(original)
        properties.update(
            {
                "nombre": name,
                "nombre_en": name_en,
                "provincia": ", ".join(province_names) or "Por verificar",
                "provincia_en": ", ".join(province_names) or "To be verified",
                "tipo_movimiento": movement_category(original_movement),
                "movimiento_original": original_movement,
                "movimiento_original_en": original_movement,
                "fuente": catalog_source(catalog_id),
                "fuente_url": GEM_SOURCE_URL,
                "licencia": "CC BY-SA 4.0",
                "descripcion": description,
                "descripcion_en": description_en,
            }
        )
        if original.get("accuracy"):
            properties["escala"] = f"1:{original['accuracy']}"

        output_features.append(
            {
                "type": "Feature",
                "id": catalog_id,
                "properties": properties,
                "geometry": geometry,
            }
        )

    output_features.sort(key=feature_sort_key)
    ids = [feature["id"] for feature in output_features]
    if len(ids) != len(set(ids)):
        raise ValueError("The selected catalog contains duplicate catalog_id values")
    if not output_features:
        raise ValueError("The spatial catalog selection returned no features")

    counts = Counter(
        "SARA" if feature["id"].startswith("SA_") else "Active Tectonics of the Andes"
        for feature in output_features
    )
    return {
        "type": "FeatureCollection",
        "name": "fallas_activas_ecuador_gem",
        "metadata": {
            "generated": EXTRACTION_DATE,
            "source": GEM_SOURCE_URL,
            "source_blob_sha": GEM_SOURCE_BLOB_SHA,
            "license": "CC BY-SA 4.0",
            "selection_boundary": GEOBOUNDARIES_URL,
            "selection_rule": (
                "Original SARA and Active Tectonics of the Andes geometries that intersect "
                "geoBoundaries Ecuador; geometries were not clipped or simplified."
            ),
            "feature_count": len(output_features),
            "catalog_counts": dict(counts),
        },
        "features": output_features,
    }


def main() -> None:
    args = parse_args()
    catalog = build_catalog(
        read_geojson(args.gem),
        read_geojson(args.countries),
        read_geojson(args.provinces),
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="\n") as target:
        json.dump(catalog, target, ensure_ascii=False, indent=2)
        target.write("\n")
    print(f"Wrote {len(catalog['features'])} features to {args.output}")


if __name__ == "__main__":
    main()
