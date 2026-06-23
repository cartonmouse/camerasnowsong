# Local Album Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only album management page for editing album-level metadata and syncing the photography website without manually editing `album.json`.

**Architecture:** Add a small Node HTTP server on `127.0.0.1:4000` that serves a static admin page and JSON APIs. Keep the public portfolio on Vite `5173`; the admin server reads/writes `public/photos/<album>/album.json` and reuses the existing photo sync logic.

**Tech Stack:** Node.js ESM, built-in `node:http`, built-in `node:fs/promises`, existing React/Vite public website, browser-native HTML/CSS/JS for the admin page.

---

## File Structure

- Create `scripts/admin-core.mjs`
  - Pure file/data functions for scanning albums, reading configs, saving metadata, and syncing photos.
- Create `scripts/admin-core.test.mjs`
  - Tests for filesystem behavior using temporary directories.
- Create `scripts/admin-server.mjs`
  - Local HTTP server for `/admin`, `/api/albums`, `/api/albums/:albumId`, and `/api/sync`.
- Create `scripts/admin-server.test.mjs`
  - Tests for HTTP routing and method behavior using temporary directories.
- Create `admin/index.html`
  - Local admin UI shell.
- Create `admin/admin.css`
  - Work-focused local admin styles.
- Create `admin/admin.js`
  - Browser UI logic for listing albums, editing metadata, saving, and syncing.
- Modify `scripts/photo-sync.mjs`
  - Export a reusable `syncPhotoData({ projectRoot })` helper so admin sync can call it directly.
- Modify `scripts/photo-sync.test.mjs`
  - Add coverage for `syncPhotoData`.
- Modify `package.json`
  - Add `admin` and expanded admin tests.
- Modify `README.md`
  - Document local admin workflow.

---

### Task 1: Extract Reusable Photo Sync Helper

**Files:**
- Modify: `scripts/photo-sync.mjs`
- Modify: `scripts/photo-sync.test.mjs`

- [ ] **Step 1: Write the failing test**

Append this assertion block near the end of `scripts/photo-sync.test.mjs`, before `console.log("photo sync helpers ok");`:

```js
  const dataPath = path.join(tempRoot, "src", "data", "photos.json");
  await mkdir(path.dirname(dataPath), { recursive: true });
  const syncResult = await syncPhotoData({ projectRoot: tempRoot });
  const syncedRecords = JSON.parse(await readFile(dataPath, "utf8"));
  assert.equal(syncResult.count, 4);
  assert.equal(path.basename(syncResult.dataPath), "photos.json");
  assert.equal(syncedRecords.length, 4);
```

Update the import at the top of `scripts/photo-sync.test.mjs`:

```js
const {
  collectPhotoRecords,
  createMissingAlbumConfigs,
  createPhotoRecord,
  pruneBlankPhotoConfigs,
  readExifYear,
  readImageSize,
  syncPhotoData
} = await import(moduleUrl);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd run test:data
```

Expected: FAIL with `syncPhotoData is not a function`.

- [ ] **Step 3: Implement minimal sync helper**

In `scripts/photo-sync.mjs`, add this exported function above `main()`:

```js
export async function syncPhotoData({ projectRoot }) {
  const photosRoot = path.join(projectRoot, "public", "photos");
  const dataPath = path.join(projectRoot, "src", "data", "photos.json");
  const records = await collectPhotoRecords({ photosRoot });
  await writeFile(dataPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  return { count: records.length, dataPath };
}
```

Then replace the sync part of `main()` with:

```js
  const result = await syncPhotoData({ projectRoot });
  console.log(`Synced ${result.count} photos to ${path.relative(projectRoot, result.dataPath)}`);
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm.cmd run test:data
```

Expected: `photo helpers ok`, `photo sync helpers ok`, `layout rules ok`.

---

### Task 2: Add Admin Core File Logic

**Files:**
- Create: `scripts/admin-core.mjs`
- Create: `scripts/admin-core.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing admin core test**

Create `scripts/admin-core.test.mjs`:

```js
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("scripts/admin-core.mjs")).href;
const {
  listAlbums,
  readAlbum,
  saveAlbumMetadata,
  resolveAlbumPath,
  syncAlbums
} = await import(moduleUrl);

const tempRoot = await mkdtemp(path.join(tmpdir(), "album-admin-"));
const photosRoot = path.join(tempRoot, "public", "photos");

const shaJin = "\u6c99\u91d1";
const newAlbum = "1.18\u661f\u89c1\u96c5\uff08\u5df2\u53d1\uff09";

try {
  await mkdir(path.join(photosRoot, shaJin), { recursive: true });
  await mkdir(path.join(photosRoot, newAlbum), { recursive: true });
  await mkdir(path.join(tempRoot, "src", "data"), { recursive: true });

  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  await writeFile(path.join(photosRoot, shaJin, "IMG_0661.jpg"), jpeg);
  await writeFile(path.join(photosRoot, newAlbum, "IMG_0001.jpg"), jpeg);
  await writeFile(
    path.join(photosRoot, shaJin, "album.json"),
    JSON.stringify({
      title: shaJin,
      topics: ["Cosplay"],
      description: "\u89d2\u8272\u9020\u578b\u7167\u7247\u3002",
      featured: true,
      photos: {
        "IMG_0661.jpg": {
          title: "\u5927\u9009\u83b7\u80dc\uff01",
          description: "\u5728\u65b0\u7684\u7ade\u9009\u5f53\u4e2d\uff0c\u6211\u80dc\u5229\u4e86\uff01"
        }
      }
    }),
    "utf8"
  );

  const albums = await listAlbums({ projectRoot: tempRoot });
  assert.equal(albums.length, 2);
  const configured = albums.find((album) => album.id === shaJin);
  assert.equal(configured.status, "configured");
  assert.equal(configured.imageCount, 1);
  assert.equal(configured.previewImages.length, 1);

  const missing = albums.find((album) => album.id === newAlbum);
  assert.equal(missing.status, "missing-config");
  assert.equal(missing.title, newAlbum);
  assert.deepEqual(missing.topics, []);

  const readConfigured = await readAlbum({ projectRoot: tempRoot, albumId: shaJin });
  assert.equal(readConfigured.title, shaJin);
  assert.deepEqual(readConfigured.topics, ["Cosplay"]);

  await saveAlbumMetadata({
    projectRoot: tempRoot,
    albumId: shaJin,
    metadata: {
      title: "\u6c99\u91d1\u7cbe\u9009",
      topics: ["Cosplay", "\u4eba\u50cf"],
      description: "\u4e00\u7ec4\u89d2\u8272\u9020\u578b\u4f5c\u54c1\u3002",
      featured: false
    }
  });
  const saved = JSON.parse(await readFile(path.join(photosRoot, shaJin, "album.json"), "utf8"));
  assert.equal(saved.title, "\u6c99\u91d1\u7cbe\u9009");
  assert.deepEqual(saved.topics, ["Cosplay", "\u4eba\u50cf"]);
  assert.equal(saved.featured, false);
  assert.equal(saved.photos["IMG_0661.jpg"].title, "\u5927\u9009\u83b7\u80dc\uff01");

  await saveAlbumMetadata({
    projectRoot: tempRoot,
    albumId: newAlbum,
    metadata: {
      title: newAlbum,
      topics: ["Cosplay", "\u4eba\u50cf"],
      description: "\u4e00\u7ec4\u661f\u89c1\u96c5\u89d2\u8272\u7167\u7247\u3002",
      featured: true
    }
  });
  const created = JSON.parse(await readFile(path.join(photosRoot, newAlbum, "album.json"), "utf8"));
  assert.equal(created.title, newAlbum);
  assert.deepEqual(created.photos, {});

  assert.throws(() => resolveAlbumPath({ photosRoot, albumId: "../evil" }), /Invalid album id/);

  const syncResult = await syncAlbums({ projectRoot: tempRoot });
  assert.equal(syncResult.count, 2);

  console.log("admin core helpers ok");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node scripts/admin-core.test.mjs
```

Expected: FAIL because `scripts/admin-core.mjs` does not exist.

- [ ] **Step 3: Implement admin core**

Create `scripts/admin-core.mjs`:

```js
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { syncPhotoData } from "./photo-sync.mjs";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
export const defaultTopics = ["风景", "人像", "Cosplay", "城市", "旅行", "舞台", "纪实", "日常", "待分类"];

export function resolveAlbumPath({ photosRoot, albumId }) {
  if (!albumId || albumId.includes("/") || albumId.includes("\\") || albumId.includes("..")) {
    throw new Error("Invalid album id");
  }
  const resolved = path.resolve(photosRoot, albumId);
  const root = path.resolve(photosRoot);
  if (!resolved.startsWith(root + path.sep)) {
    throw new Error("Invalid album id");
  }
  return resolved;
}

export async function listAlbums({ projectRoot }) {
  const photosRoot = path.join(projectRoot, "public", "photos");
  const entries = await readdir(photosRoot, { withFileTypes: true });
  const albums = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "zh-CN", { numeric: true }))) {
    if (!entry.isDirectory()) continue;
    albums.push(await readAlbum({ projectRoot, albumId: entry.name }));
  }
  return albums;
}

export async function readAlbum({ projectRoot, albumId }) {
  const photosRoot = path.join(projectRoot, "public", "photos");
  const albumPath = resolveAlbumPath({ photosRoot, albumId });
  const images = await collectAlbumImages(albumPath);
  const configPath = path.join(albumPath, "album.json");
  const config = await readAlbumConfig(configPath);
  const hasConfig = Boolean(config);
  const normalized = normalizeAlbumConfig(albumId, config || {});
  return {
    id: albumId,
    title: normalized.title,
    topics: normalized.topics,
    description: normalized.description,
    featured: normalized.featured,
    imageCount: images.length,
    status: getAlbumStatus({ hasConfig, config: normalized }),
    previewImages: images.slice(0, 6).map((relativePath) => toPublicPhotoPath(path.join(albumId, relativePath)))
  };
}

export async function saveAlbumMetadata({ projectRoot, albumId, metadata }) {
  const photosRoot = path.join(projectRoot, "public", "photos");
  const albumPath = resolveAlbumPath({ photosRoot, albumId });
  const configPath = path.join(albumPath, "album.json");
  const existing = (await readAlbumConfig(configPath)) || {};
  const next = {
    ...existing,
    title: String(metadata.title || albumId).trim() || albumId,
    topics: Array.isArray(metadata.topics) ? metadata.topics.filter(Boolean) : [],
    description: String(metadata.description || ""),
    featured: Boolean(metadata.featured),
    photos: existing.photos && typeof existing.photos === "object" && !Array.isArray(existing.photos) ? existing.photos : {}
  };
  await writeFile(configPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return readAlbum({ projectRoot, albumId });
}

export async function syncAlbums({ projectRoot }) {
  return syncPhotoData({ projectRoot });
}

async function readAlbumConfig(configPath) {
  try {
    return JSON.parse(await readFile(configPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new Error(`Invalid album config: ${configPath}\n${error.message}`);
  }
}

function normalizeAlbumConfig(albumId, config) {
  return {
    title: config.title || albumId,
    topics: Array.isArray(config.topics) ? config.topics.filter(Boolean) : [],
    description: typeof config.description === "string" ? config.description : "",
    featured: config.featured !== false
  };
}

function getAlbumStatus({ hasConfig, config }) {
  if (!hasConfig) return "missing-config";
  if (!config.topics.length) return "needs-topics";
  if (!config.description.trim()) return "needs-description";
  return "configured";
}

async function collectAlbumImages(albumPath) {
  const files = [];
  async function visit(directory, prefix = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name, "zh-CN", { numeric: true }));
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      const relativePath = prefix ? path.join(prefix, entry.name) : entry.name;
      if (entry.isDirectory()) {
        await visit(fullPath, relativePath);
      } else if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) {
        files.push(relativePath);
      }
    }
  }
  await visit(albumPath);
  return files;
}

function toPublicPhotoPath(relativePath) {
  return `/photos/${relativePath
    .split(path.sep)
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}
```

- [ ] **Step 4: Add test command**

Modify `package.json`:

```json
"test:admin": "node scripts/admin-core.test.mjs"
```

Keep `test:data` unchanged for now.

- [ ] **Step 5: Run tests**

Run:

```powershell
npm.cmd run test:admin
npm.cmd run test:data
```

Expected:

```text
admin core helpers ok
photo helpers ok
photo sync helpers ok
layout rules ok
```

---

### Task 3: Add Local Admin HTTP Server

**Files:**
- Create: `scripts/admin-server.mjs`
- Create: `scripts/admin-server.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing server test**

Create `scripts/admin-server.test.mjs`:

```js
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("scripts/admin-server.mjs")).href;
const { createAdminServer } = await import(moduleUrl);

const tempRoot = await mkdtemp(path.join(tmpdir(), "album-admin-server-"));

try {
  await mkdir(path.join(tempRoot, "public", "photos", "相册A"), { recursive: true });
  await mkdir(path.join(tempRoot, "src", "data"), { recursive: true });
  await writeFile(path.join(tempRoot, "public", "photos", "相册A", "IMG_0001.jpg"), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));

  const server = createAdminServer({ projectRoot: tempRoot });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    const html = await fetch(`${base}/admin`);
    assert.equal(html.status, 200);
    assert.match(await html.text(), /album-admin-root/);

    const albums = await fetch(`${base}/api/albums`);
    assert.equal(albums.status, 200);
    const albumsJson = await albums.json();
    assert.equal(albumsJson.albums.length, 1);
    assert.equal(albumsJson.topics.includes("待分类"), true);

    const save = await fetch(`${base}/api/albums/${encodeURIComponent("相册A")}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "相册A",
        topics: ["待分类"],
        description: "第一组测试照片。",
        featured: true
      })
    });
    assert.equal(save.status, 200);
    const savedJson = await save.json();
    assert.equal(savedJson.album.status, "configured");

    const bad = await fetch(`${base}/api/albums/${encodeURIComponent("../evil")}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "bad", topics: [], description: "", featured: false })
    });
    assert.equal(bad.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log("admin server ok");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node scripts/admin-server.test.mjs
```

Expected: FAIL because `scripts/admin-server.mjs` does not exist.

- [ ] **Step 3: Implement admin server**

Create `scripts/admin-server.mjs`:

```js
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultTopics, listAlbums, saveAlbumMetadata, syncAlbums } from "./admin-core.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adminRoot = path.join(projectRoot, "admin");

export function createAdminServer({ projectRoot: root = projectRoot } = {}) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      if (request.method === "GET" && (url.pathname === "/admin" || url.pathname === "/admin/")) {
        return serveFile(response, path.join(adminRoot, "index.html"), "text/html; charset=utf-8");
      }
      if (request.method === "GET" && url.pathname.startsWith("/admin/")) {
        return serveAdminAsset(response, url.pathname);
      }
      if (request.method === "GET" && url.pathname === "/api/albums") {
        return sendJson(response, 200, { topics: defaultTopics, albums: await listAlbums({ projectRoot: root }) });
      }
      if (request.method === "PUT" && url.pathname.startsWith("/api/albums/")) {
        const albumId = decodeURIComponent(url.pathname.replace("/api/albums/", ""));
        const body = await readJsonBody(request);
        const album = await saveAlbumMetadata({ projectRoot: root, albumId, metadata: body });
        return sendJson(response, 200, { album });
      }
      if (request.method === "POST" && url.pathname === "/api/sync") {
        const result = await syncAlbums({ projectRoot: root });
        return sendJson(response, 200, { ok: true, message: `Synced ${result.count} photos`, result });
      }
      return sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      const status = /Invalid album id|Invalid JSON/.test(error.message) ? 400 : 500;
      return sendJson(response, status, { error: error.message });
    }
  });
}

async function serveAdminAsset(response, pathname) {
  const fileName = pathname.replace("/admin/", "");
  const allowed = new Map([
    ["admin.css", "text/css; charset=utf-8"],
    ["admin.js", "text/javascript; charset=utf-8"]
  ]);
  if (!allowed.has(fileName)) {
    return sendJson(response, 404, { error: "Not found" });
  }
  return serveFile(response, path.join(adminRoot, fileName), allowed.get(fileName));
}

async function serveFile(response, filePath, contentType) {
  const content = await readFile(filePath);
  response.writeHead(200, { "content-type": contentType });
  response.end(content);
}

async function readJsonBody(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
  }
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createAdminServer({ projectRoot });
  server.listen(4000, "127.0.0.1", () => {
    console.log("Album admin running at http://127.0.0.1:4000/admin");
  });
}
```

- [ ] **Step 4: Add npm scripts**

Modify `package.json`:

```json
"admin": "node scripts/admin-server.mjs",
"test:admin": "node scripts/admin-core.test.mjs && node scripts/admin-server.test.mjs"
```

- [ ] **Step 5: Run server tests**

Run:

```powershell
npm.cmd run test:admin
```

Expected:

```text
admin core helpers ok
admin server ok
```

---

### Task 4: Add Admin Static UI

**Files:**
- Create: `admin/index.html`
- Create: `admin/admin.css`
- Create: `admin/admin.js`

- [ ] **Step 1: Create the HTML shell**

Create `admin/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>照片相册管理</title>
    <link rel="stylesheet" href="/admin/admin.css" />
  </head>
  <body>
    <main id="album-admin-root" class="admin-shell">
      <aside class="album-sidebar">
        <div class="sidebar-header">
          <p>本地管理</p>
          <h1>相册</h1>
        </div>
        <div id="album-list" class="album-list"></div>
      </aside>
      <section class="album-editor">
        <header class="editor-header">
          <div>
            <p id="album-status" class="status-text">请选择相册</p>
            <h2 id="album-heading">照片相册管理</h2>
          </div>
          <button id="sync-button" type="button">同步网站</button>
        </header>

        <form id="album-form" class="editor-form">
          <label>
            相册标题
            <input id="title-input" name="title" type="text" />
          </label>

          <fieldset>
            <legend>题材</legend>
            <div id="topic-options" class="topic-options"></div>
            <label class="custom-topic">
              新增题材
              <input id="custom-topic-input" type="text" placeholder="输入后回车添加" />
            </label>
          </fieldset>

          <label>
            相册描述
            <textarea id="description-input" name="description" rows="5"></textarea>
          </label>

          <label class="featured-row">
            <input id="featured-input" name="featured" type="checkbox" />
            参与首页精选
          </label>

          <section>
            <h3>预览</h3>
            <div id="preview-strip" class="preview-strip"></div>
          </section>

          <div class="form-actions">
            <button id="save-button" type="submit">保存相册</button>
            <p id="message" class="message"></p>
          </div>
        </form>
      </section>
    </main>
    <script type="module" src="/admin/admin.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Add work-focused CSS**

Create `admin/admin.css`:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: #25221e;
  background: #f4f0e8;
  font-family: Arial, "Microsoft YaHei", sans-serif;
}

button,
input,
textarea {
  font: inherit;
}

.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 320px 1fr;
}

.album-sidebar {
  border-right: 1px solid #ded7cb;
  background: #ebe5da;
  padding: 24px;
}

.sidebar-header p,
.status-text {
  margin: 0 0 6px;
  color: #756d61;
  font-size: 13px;
}

.sidebar-header h1,
.editor-header h2 {
  margin: 0;
}

.album-list {
  margin-top: 24px;
  display: grid;
  gap: 8px;
}

.album-item {
  width: 100%;
  border: 1px solid #d3cabe;
  background: #f8f4ed;
  padding: 12px;
  text-align: left;
  cursor: pointer;
}

.album-item.active {
  border-color: #25221e;
  background: #ffffff;
}

.album-item strong {
  display: block;
  margin-bottom: 6px;
}

.album-meta {
  color: #756d61;
  font-size: 13px;
}

.album-editor {
  padding: 32px;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.editor-header button,
.form-actions button {
  border: 0;
  background: #25221e;
  color: #ffffff;
  padding: 10px 14px;
  cursor: pointer;
}

.editor-form {
  max-width: 900px;
  display: grid;
  gap: 22px;
}

label,
fieldset {
  display: grid;
  gap: 8px;
  border: 0;
  padding: 0;
  margin: 0;
}

input[type="text"],
textarea {
  width: 100%;
  border: 1px solid #d3cabe;
  background: #fffdf8;
  padding: 10px;
}

.topic-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #d3cabe;
  background: #fffdf8;
  padding: 8px 10px;
}

.featured-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.preview-strip img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: #ddd6ca;
}

.message {
  min-height: 20px;
  color: #756d61;
}
```

- [ ] **Step 3: Add browser UI logic**

Create `admin/admin.js`:

```js
const state = {
  albums: [],
  topics: [],
  selectedAlbumId: ""
};

const elements = {
  albumList: document.querySelector("#album-list"),
  form: document.querySelector("#album-form"),
  heading: document.querySelector("#album-heading"),
  status: document.querySelector("#album-status"),
  title: document.querySelector("#title-input"),
  topics: document.querySelector("#topic-options"),
  customTopic: document.querySelector("#custom-topic-input"),
  description: document.querySelector("#description-input"),
  featured: document.querySelector("#featured-input"),
  previews: document.querySelector("#preview-strip"),
  message: document.querySelector("#message"),
  sync: document.querySelector("#sync-button")
};

await loadAlbums();

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveSelectedAlbum();
});

elements.sync.addEventListener("click", async () => {
  setMessage("正在同步...");
  const response = await fetch("/api/sync", { method: "POST" });
  const data = await response.json();
  setMessage(data.message || "同步完成");
});

elements.customTopic.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const topic = elements.customTopic.value.trim();
  if (!topic || state.topics.includes(topic)) return;
  state.topics.push(topic);
  elements.customTopic.value = "";
  renderTopicOptions(getSelectedAlbum(), topic);
});

async function loadAlbums() {
  const response = await fetch("/api/albums");
  const data = await response.json();
  state.albums = data.albums;
  state.topics = data.topics;
  state.selectedAlbumId = state.albums[0]?.id || "";
  renderAlbumList();
  renderEditor();
}

function renderAlbumList() {
  elements.albumList.innerHTML = "";
  for (const album of state.albums) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `album-item${album.id === state.selectedAlbumId ? " active" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(album.title)}</strong>
      <span class="album-meta">${album.imageCount} 张 · ${statusLabel(album.status)}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedAlbumId = album.id;
      renderAlbumList();
      renderEditor();
    });
    elements.albumList.append(button);
  }
}

function renderEditor() {
  const album = getSelectedAlbum();
  if (!album) return;
  elements.heading.textContent = album.title;
  elements.status.textContent = `${statusLabel(album.status)} · ${album.imageCount} 张照片`;
  elements.title.value = album.title;
  elements.description.value = album.description || "";
  elements.featured.checked = album.featured !== false;
  renderTopicOptions(album);
  renderPreviews(album);
}

function renderTopicOptions(album, forceCheckedTopic = "") {
  const selected = new Set(album?.topics || []);
  if (forceCheckedTopic) selected.add(forceCheckedTopic);
  elements.topics.innerHTML = "";
  for (const topic of state.topics) {
    const label = document.createElement("label");
    label.className = "topic-option";
    label.innerHTML = `<input type="checkbox" value="${escapeHtml(topic)}" ${selected.has(topic) ? "checked" : ""} /> ${escapeHtml(topic)}`;
    elements.topics.append(label);
  }
}

function renderPreviews(album) {
  elements.previews.innerHTML = "";
  for (const src of album.previewImages || []) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = album.title;
    elements.previews.append(img);
  }
}

async function saveSelectedAlbum() {
  const album = getSelectedAlbum();
  if (!album) return;
  const topics = [...elements.topics.querySelectorAll("input:checked")].map((input) => input.value);
  setMessage("正在保存...");
  const response = await fetch(`/api/albums/${encodeURIComponent(album.id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: elements.title.value,
      topics,
      description: elements.description.value,
      featured: elements.featured.checked
    })
  });
  const data = await response.json();
  if (!response.ok) {
    setMessage(data.error || "保存失败");
    return;
  }
  const index = state.albums.findIndex((item) => item.id === album.id);
  state.albums[index] = data.album;
  setMessage("已保存");
  renderAlbumList();
  renderEditor();
}

function getSelectedAlbum() {
  return state.albums.find((album) => album.id === state.selectedAlbumId);
}

function setMessage(message) {
  elements.message.textContent = message;
}

function statusLabel(status) {
  return {
    "missing-config": "缺少配置",
    "needs-topics": "需要题材",
    "needs-description": "需要描述",
    configured: "已配置"
  }[status] || status;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
```

- [ ] **Step 4: Run server test again**

Run:

```powershell
npm.cmd run test:admin
```

Expected: `admin core helpers ok` and `admin server ok`.

---

### Task 5: Manual Local Admin Verification

**Files:**
- No new files.

- [ ] **Step 1: Start admin server**

Run in the project root:

```powershell
npm.cmd run admin
```

Expected terminal output:

```text
Album admin running at http://127.0.0.1:4000/admin
```

- [ ] **Step 2: Open admin page**

Open:

```text
http://localhost:4000/admin
```

Expected:

- Album list appears.
- Existing albums are visible.
- Each album shows image count and status.

- [ ] **Step 3: Edit an album**

Pick an album and set:

```text
title: Keep current title
topics: Cosplay, 人像
description: 本地管理工具测试描述。
featured: checked
```

Click `保存相册`.

Expected:

- UI shows `已保存`.
- `public/photos/<album>/album.json` contains the edited fields.
- Existing `photos` object remains present if it existed before.

- [ ] **Step 4: Sync website**

Click `同步网站`.

Expected:

- UI shows `Synced <number> photos`.
- `src/data/photos.json` updates.

- [ ] **Step 5: Verify public site**

Open:

```text
http://localhost:5173/
```

Expected:

- Edited album appears under selected topics.

---

### Task 6: README Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add local admin section**

Add this section after the local run section:

```markdown
## 本地相册管理工具

第一版本地管理工具只管理相册级信息：标题、题材、描述和是否参与精选。

启动：

```bash
npm.cmd run admin
```

打开：

```text
http://localhost:4000/admin
```

常用流程：

1. 把新照片文件夹放入 `public/photos/`。
2. 打开本地管理工具。
3. 选择相册并填写标题、题材和描述。
4. 点击“保存相册”。
5. 点击“同步网站”。
6. 回到 `http://localhost:5173/` 查看前台效果。

注意：这个工具只绑定本机使用，不是公网后台。
```
```

- [ ] **Step 2: Run documentation sanity check**

Run:

```powershell
@'
from pathlib import Path
s = Path("README.md").read_text(encoding="utf-8")
assert "本地相册管理工具" in s
assert "http://localhost:4000/admin" in s
assert "\ufffd" not in s
print("readme ok")
'@ | python -
```

Expected: `readme ok`.

---

### Task 7: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run all automated tests**

Run:

```powershell
npm.cmd run test:admin
npm.cmd run test:data
```

Expected:

```text
admin core helpers ok
admin server ok
photo helpers ok
photo sync helpers ok
layout rules ok
```

- [ ] **Step 2: Run production build**

Run:

```powershell
npm.cmd run build
```

Expected: Vite build succeeds.

- [ ] **Step 3: Verify admin server starts**

Run:

```powershell
npm.cmd run admin
```

Open:

```text
http://localhost:4000/admin
```

Expected: Admin page loads.

- [ ] **Step 4: Stop admin server**

Press:

```text
Ctrl+C
```

Expected: server stops cleanly.

