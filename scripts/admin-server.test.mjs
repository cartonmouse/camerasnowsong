import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createAdminServer } from "./admin-server.mjs";

const tempRoot = await mkdtemp(path.join(tmpdir(), "album-admin-server-"));
const albumId = "\u76f8\u518cA";

try {
  const photosRoot = path.join(tempRoot, "public", "photos");
  await mkdir(path.join(photosRoot, albumId), { recursive: true });
  await mkdir(path.join(tempRoot, "src", "data"), { recursive: true });
  await mkdir(path.join(tempRoot, "admin"), { recursive: true });
  await writeFile(path.join(photosRoot, albumId, "IMG_0001.jpg"), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
  await writeFile(path.join(tempRoot, "admin", "index.html"), "<title>照片相册管理</title>", "utf8");
  await writeFile(path.join(tempRoot, "admin", "admin.css"), "body { color: #25231f; }", "utf8");
  await writeFile(path.join(tempRoot, "admin", "admin.js"), "console.log('admin page');", "utf8");

  const server = createAdminServer({ projectRoot: tempRoot });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const html = await fetch(`${base}/admin`);
    assert.equal(html.status, 200);
    assert.match(html.headers.get("content-type"), /text\/html/);
    assert.match(await html.text(), /照片相册管理/);

    const css = await fetch(`${base}/admin/admin.css`);
    assert.equal(css.status, 200);
    assert.match(css.headers.get("content-type"), /text\/css/);

    const js = await fetch(`${base}/admin/admin.js`);
    assert.equal(js.status, 200);
    assert.match(js.headers.get("content-type"), /javascript/);

    const photo = await fetch(`${base}/photos/${encodeURIComponent(albumId)}/IMG_0001.jpg`);
    assert.equal(photo.status, 200);
    assert.match(photo.headers.get("content-type"), /image\/jpeg/);
    assert.deepEqual([...new Uint8Array(await photo.arrayBuffer())], [0xff, 0xd8, 0xff, 0xd9]);

    const albums = await fetch(`${base}/api/albums`);
    assert.equal(albums.status, 200);
    assert.match(albums.headers.get("content-type"), /application\/json/);
    const albumsJson = await albums.json();
    assert.equal(albumsJson.albums.length, 1);
    assert.equal(albumsJson.albums[0].id, albumId);
    assert.equal(albumsJson.albums[0].status, "missing-config");
    assert.ok(albumsJson.topics.includes("\u5f85\u5206\u7c7b"));

    const save = await fetch(`${base}/api/albums/${encodeURIComponent(albumId)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "\u76f8\u518cA\u7cbe\u9009",
        topics: ["\u5f85\u5206\u7c7b"],
        description: "\u4e00\u7ec4\u672c\u5730\u7ba1\u7406\u6d4b\u8bd5\u7167\u7247\u3002",
        featured: true
      })
    });
    assert.equal(save.status, 200);
    const savedJson = await save.json();
    assert.equal(savedJson.album.status, "configured");
    assert.equal(savedJson.album.title, "\u76f8\u518cA\u7cbe\u9009");

    const savedConfig = JSON.parse(await readFile(path.join(photosRoot, albumId, "album.json"), "utf8"));
    assert.equal(savedConfig.description, "\u4e00\u7ec4\u672c\u5730\u7ba1\u7406\u6d4b\u8bd5\u7167\u7247\u3002");

    const homepage = await fetch(`${base}/api/homepage`);
    assert.equal(homepage.status, 200);
    assert.deepEqual(await homepage.json(), { items: [], limit: 12 });

    const saveHomepage = await fetch(`${base}/api/homepage`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            src: `/photos/${encodeURIComponent(albumId)}/IMG_0001.jpg`,
            hidden: false
          }
        ],
        limit: 5
      })
    });
    assert.equal(saveHomepage.status, 200);
    const savedHomepageJson = await saveHomepage.json();
    assert.equal(savedHomepageJson.limit, 5);
    assert.equal(savedHomepageJson.items[0].src, `/photos/${encodeURIComponent(albumId)}/IMG_0001.jpg`);

    const sync = await fetch(`${base}/api/sync`, { method: "POST" });
    assert.equal(sync.status, 200);
    const syncJson = await sync.json();
    assert.equal(syncJson.ok, true);
    assert.equal(syncJson.result.photoCount, 1);

    const publish = await fetch(`${base}/api/publish`, { method: "POST" });
    assert.equal(publish.status, 200);
    const publishJson = await publish.json();
    assert.equal(publishJson.ok, true);
    assert.equal(publishJson.result.photoCount, 1);
    const publishedData = JSON.parse(await readFile(path.join(tempRoot, "src", "data", "photos.json"), "utf8"));
    assert.equal(publishedData.length, 1);
    assert.equal(publishedData[0].album, albumId);

    const invalidJson = await fetch(`${base}/api/albums/${encodeURIComponent(albumId)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "{"
    });
    assert.equal(invalidJson.status, 400);

    const invalidAlbum = await fetch(`${base}/api/albums/${encodeURIComponent("../evil")}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "bad", topics: [], description: "", featured: false })
    });
    assert.equal(invalidAlbum.status, 400);

    const missing = await fetch(`${base}/api/nope`);
    assert.equal(missing.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log("admin server ok");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
