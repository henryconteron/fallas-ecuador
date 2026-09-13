import tempfile
import unittest
from pathlib import Path

from scripts.catalog_integrity import (
    CATALOG_INPUT_URLS,
    GEM_SOURCE_COMMIT,
    GEM_SOURCE_URL,
    file_fingerprint,
    require_checksum,
)


class CatalogBuildIntegrityTests(unittest.TestCase):
    def test_catalog_input_urls_are_pinned_https_geojson_sources(self):
        self.assertEqual(len(CATALOG_INPUT_URLS), 3)
        for filename, url in CATALOG_INPUT_URLS.items():
            self.assertTrue(filename.endswith(".geojson"))
            self.assertTrue(url.startswith("https://"))
            self.assertNotIn("/main/", url)
            self.assertNotIn("/master/", url)

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
