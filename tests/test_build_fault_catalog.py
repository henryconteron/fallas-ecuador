import tempfile
import unittest
from pathlib import Path

from scripts.catalog_integrity import (
    GEM_SOURCE_COMMIT,
    GEM_SOURCE_URL,
    file_fingerprint,
    require_checksum,
)


class CatalogBuildIntegrityTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
