import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image


module_path = Path(__file__).with_name("photo-publish.py")
spec = importlib.util.spec_from_file_location("photo_publish", module_path)
photo_publish = importlib.util.module_from_spec(spec)
spec.loader.exec_module(photo_publish)


def test_publish_photos():
    with TemporaryDirectory() as temp:
        project_root = Path(temp)
        source_dir = project_root / "public" / "photos" / "album one"
        data_dir = project_root / "src" / "data"
        source_dir.mkdir(parents=True)
        data_dir.mkdir(parents=True)

        source = source_dir / "image one.jpg"
        Image.new("RGB", (1600, 1000), color=(24, 48, 72)).save(source, "JPEG")
        data_path = data_dir / "photos.json"
        data_path.write_text(
            json.dumps(
                [
                    {
                        "id": "photo-test",
                        "title": "Test",
                        "album": "album one",
                        "src": "/photos/album%20one/image%20one.jpg",
                        "width": 1600,
                        "height": 1000
                    },
                    {
                        "id": "remote-test",
                        "title": "Remote",
                        "src": "https://example.com/image.jpg"
                    }
                ],
                ensure_ascii=False,
                indent=2
            )
            + "\n",
            encoding="utf-8"
        )

        result = photo_publish.publish_photos(project_root)
        records = json.loads(data_path.read_text(encoding="utf-8"))

        assert result["counts"]["published"] == 1
        assert result["counts"]["skipped-non-local"] == 1
        assert records[0]["originalSrc"] == "/photos/album%20one/image%20one.jpg"
        assert records[0]["thumb"].endswith("/site-photos/albums/album-one/photo-test-thumb.webp")
        assert records[0]["src"].endswith("/site-photos/albums/album-one/photo-test-large.webp")
        assert records[0]["width"] == 1600
        assert records[0]["height"] == 1000
        assert records[0]["thumbWidth"] == 720
        assert records[0]["thumbHeight"] == 450
        assert (project_root / "public" / "site-photos" / "albums" / "album-one" / "photo-test-thumb.webp").exists()
        assert (project_root / "public" / "site-photos" / "albums" / "album-one" / "photo-test-large.webp").exists()


test_publish_photos()
print("photo publish helpers ok")
