#!/usr/bin/env python3
"""Download the pinned source inputs needed to rebuild the fault catalog.

The inputs are placed under data/raw/, which is intentionally ignored by Git.
This script does not alter the published catalog; run build_fault_catalog.py
after reviewing the downloaded inputs and their fingerprints.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.request import Request, urlopen

from catalog_integrity import CATALOG_INPUT_URLS, file_fingerprint


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/raw/catalog-inputs"),
        help="Ignored local directory for downloaded GeoJSON inputs",
    )
    parser.add_argument("--overwrite", action="store_true", help="Replace existing input files")
    parser.add_argument("--timeout", type=float, default=60, help="Network timeout in seconds")
    return parser.parse_args()


def download_json(url: str, destination: Path, timeout: float) -> None:
    request = Request(url, headers={"User-Agent": "Ecuador-Vivo-catalog-rebuild/1.0"})
    with urlopen(request, timeout=timeout) as response:
        content = response.read()
    try:
        json.loads(content.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ValueError(f"{url} did not return valid GeoJSON") from error
    temporary = destination.with_suffix(f"{destination.suffix}.part")
    temporary.write_bytes(content)
    temporary.replace(destination)


def main() -> None:
    args = parse_args()
    if args.timeout <= 0:
        raise ValueError("--timeout must be positive")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for filename, url in CATALOG_INPUT_URLS.items():
        destination = args.output_dir / filename
        if destination.exists() and not args.overwrite:
            print(f"Keeping existing {destination}")
        else:
            print(f"Downloading {filename} from its pinned source revision")
            download_json(url, destination, args.timeout)
        fingerprint = file_fingerprint(destination)
        print(f"Verified JSON: {destination} · SHA-256 {fingerprint['sha256']}")


if __name__ == "__main__":
    main()
