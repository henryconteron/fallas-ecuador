import tempfile
import unittest
import json
from pathlib import Path

from scripts.catalog_integrity import (
    CATALOG_INPUT_URLS,
    GEM_SOURCE_COMMIT,
    GEM_SOURCE_URL,
    PINNED_INPUT_SHA256,
    file_fingerprint,
    reference_scope,
    require_checksum,
)


class CatalogBuildIntegrityTests(unittest.TestCase):
    def test_fault_schema_declares_citation_scope(self):
        root = Path(__file__).resolve().parents[1]
        schema = json.loads((root / "data/schemas/fallas.schema.json").read_text(encoding="utf-8"))
        self.assertEqual(schema["$schema"], "https://json-schema.org/draft/2020-12/schema")
        required = schema["$defs"]["faultFeature"]["properties"]["properties"]["required"]
        self.assertIn("reference_scope", required)
        self.assertEqual(
            schema["$defs"]["faultFeature"]["properties"]["properties"]["properties"]["reference_scope"]["enum"],
            ["individual", "catalog_only"],
        )

    def test_reference_scope_never_invents_a_citation(self):
        self.assertEqual(reference_scope({"reference": "Author et al., 2020"}), "individual")
        self.assertEqual(reference_scope({"reference": "  "}), "catalog_only")
        self.assertEqual(reference_scope({}), "catalog_only")

    def test_catalog_input_urls_are_pinned_https_geojson_sources(self):
        self.assertEqual(len(CATALOG_INPUT_URLS), 3)
        self.assertEqual(set(CATALOG_INPUT_URLS), set(PINNED_INPUT_SHA256))
        for filename, url in CATALOG_INPUT_URLS.items():
            self.assertTrue(filename.endswith(".geojson"))
            self.assertTrue(url.startswith("https://"))
            self.assertNotIn("/main/", url)
            self.assertNotIn("/master/", url)
            self.assertRegex(PINNED_INPUT_SHA256[filename], r"^[a-f\d]{64}$")

    def test_source_url_is_pinned_to_declared_commit(self):
        self.assertIn(GEM_SOURCE_COMMIT, GEM_SOURCE_URL)
        self.assertNotIn("/master/", GEM_SOURCE_URL)

    def test_git_blob_fingerprint_matches_git_algorithm(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.txt"
            path.write_bytes(b"hello\n")
            fingerprint = file_fingerprint(path)
        self.assertEqual(
            fingerprint["git_blob_sha1"],
            "ce013625030ba8dba906f756967f9e9ca394464a",
        )

    def test_checksum_mismatch_stops_the_build(self):
        with self.assertRaisesRegex(ValueError, "checksum mismatch"):
            require_checksum("test", "actual", "expected")

    def test_geojson_fingerprint_is_independent_of_line_endings(self):
        with tempfile.TemporaryDirectory() as directory:
            lf_path = Path(directory) / "lf.geojson"
            crlf_path = Path(directory) / "crlf.geojson"
            lf_path.write_bytes(b'{\n  "type": "FeatureCollection"\n}\n')
            crlf_path.write_bytes(b'{\r\n  "type": "FeatureCollection"\r\n}\r\n')

            lf_fingerprint = file_fingerprint(lf_path)
            crlf_fingerprint = file_fingerprint(crlf_path)

        self.assertEqual(lf_fingerprint["size_bytes"], crlf_fingerprint["size_bytes"])
        self.assertEqual(lf_fingerprint["sha256"], crlf_fingerprint["sha256"])
        self.assertEqual(lf_fingerprint["git_blob_sha1"], crlf_fingerprint["git_blob_sha1"])


if __name__ == "__main__":
    unittest.main()
