"""Version pins and checksum helpers for the scientific fault catalog."""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any


GEM_SOURCE_COMMIT = "850fd05b48841eb806d61a37043b5567f5bb99dd"
GEM_SOURCE_BLOB_SHA = "fb164770b529695544fa864abe2cc9dd8aa5793d"
GEM_SOURCE_URL = (
    "https://github.com/GEMScienceTools/gem-global-active-faults/"
    f"blob/{GEM_SOURCE_COMMIT}/geojson/gem_active_faults_harmonized.geojson"
)

# SHA-256 fingerprints captured from the immutable source revisions below.
# Update these together with the source URLs only after reviewing a new build.
PINNED_INPUT_SHA256 = {
    "gem_active_faults_harmonized.geojson": "37babb516edfac22b5ae91744495d8546b3ae4676b4d4f68cc77da8222df20e1",
    "geoBoundaries-ECU-ADM0.geojson": "523cf48366449bb98d562f61e05ef0a3de9afb82f8c3be7b7409a29d508b1fbf",
    "geoBoundaries-ECU-ADM1.geojson": "8b0083c7f7ba221600dfa13c5e2cb75ac25c697ead5bf5f16f0a6b1434d358d7",
}

# Download endpoints are deliberately immutable: each path includes the source
# revision used by the catalog build. Raw inputs belong in data/raw/ and are
# ignored by Git; the public repository only carries the derived Ecuador subset
# and its fingerprints.
CATALOG_INPUT_URLS = {
    "gem_active_faults_harmonized.geojson": (
        "https://raw.githubusercontent.com/GEMScienceTools/gem-global-active-faults/"
        f"{GEM_SOURCE_COMMIT}/geojson/gem_active_faults_harmonized.geojson"
    ),
    "geoBoundaries-ECU-ADM0.geojson": (
        "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/"
        "9469f09/releaseData/gbOpen/ECU/ADM0/geoBoundaries-ECU-ADM0.geojson"
    ),
    "geoBoundaries-ECU-ADM1.geojson": (
        "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/"
        "9469f09/releaseData/gbOpen/ECU/ADM1/geoBoundaries-ECU-ADM1.geojson"
    ),
}


def reference_scope(properties: dict[str, Any]) -> str:
    """Describe citation coverage without inventing a record-level source."""
    reference = properties.get("reference")
    return "individual" if reference is not None and str(reference).strip() else "catalog_only"


def file_fingerprint(path: Path) -> dict[str, Any]:
    content = path.read_bytes()
    if path.suffix.casefold() in {".json", ".geojson"}:
        # Git may check text files out as CRLF on Windows and LF in CI. Hash the
        # repository's canonical text representation so both environments agree.
        content = content.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    git_header = f"blob {len(content)}\0".encode()
    return {
        "filename": path.name,
        "size_bytes": len(content),
        "sha256": hashlib.sha256(content).hexdigest(),
        "git_blob_sha1": hashlib.sha1(git_header + content).hexdigest(),
    }


def require_checksum(label: str, actual: str, expected: str | None) -> None:
    if expected and actual.casefold() != expected.casefold():
        raise ValueError(f"{label} checksum mismatch: expected {expected}, found {actual}")
