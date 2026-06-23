import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultTopics,
  listAlbums,
  publishSiteData,
  readHomepageConfig,
  saveAlbumMetadata,
  saveHomepageConfig,
  syncAlbums
} from "./admin-core.mjs";

const defaultProjectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const maxBodyBytes = 1024 * 1024;

const staticAssets = new Map([
  ["/admin", { contentType: "text/html; charset=utf-8", fileName: "index.html" }],
  ["/admin/admin.css", { contentType: "text/css; charset=utf-8", fileName: "admin.css" }],
  ["/admin/admin.js", { contentType: "text/javascript; charset=utf-8", fileName: "admin.js" }]
]);

export function createAdminServer({ projectRoot = defaultProjectRoot } = {}) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const pathname = normalizeAdminPath(url.pathname);

      if (request.method === "GET" && staticAssets.has(pathname)) {
        const asset = await readStaticAsset({ projectRoot, asset: staticAssets.get(pathname) });
        return sendText(response, 200, asset);
      }

      if (request.method === "GET" && url.pathname.startsWith("/photos/")) {
        const asset = await readPhotoAsset({ projectRoot, pathname: url.pathname });
        return sendBinary(response, 200, asset);
      }

      if (request.method === "GET" && url.pathname === "/api/albums") {
        return sendJson(response, 200, {
          topics: defaultTopics,
          albums: await listAlbums({ projectRoot })
        });
      }

      if (request.method === "GET" && url.pathname === "/api/homepage") {
        return sendJson(response, 200, await readHomepageConfig({ projectRoot }));
      }

      if (request.method === "PUT" && url.pathname === "/api/homepage") {
        const config = await readJsonBody(request);
        return sendJson(response, 200, await saveHomepageConfig({ projectRoot, config }));
      }

      if (request.method === "PUT" && url.pathname.startsWith("/api/albums/")) {
        const albumId = decodeURIComponent(url.pathname.slice("/api/albums/".length));
        const metadata = await readJsonBody(request);
        const album = await saveAlbumMetadata({ projectRoot, albumId, metadata });
        return sendJson(response, 200, { album });
      }

      if (request.method === "POST" && url.pathname === "/api/sync") {
        const result = await syncAlbums({ projectRoot });
        return sendJson(response, 200, {
          ok: true,
          message: `Synced ${result.photoCount} photos`,
          result
        });
      }

      if (request.method === "POST" && url.pathname === "/api/publish") {
        const result = await publishSiteData({ projectRoot });
        return sendJson(response, 200, {
          ok: true,
          message: `Published ${result.photoCount} photos`,
          result
        });
      }

      if (isKnownRouteWithWrongMethod(url.pathname)) {
        return sendJson(response, 405, { error: "Method not allowed" });
      }

      return sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      return sendJson(response, statusForError(error), { error: error.message });
    }
  });
}

function normalizeAdminPath(pathname) {
  return pathname === "/admin/" ? "/admin" : pathname;
}

async function readStaticAsset({ projectRoot, asset }) {
  return {
    contentType: asset.contentType,
    body: await readFile(path.join(projectRoot, "admin", asset.fileName), "utf8")
  };
}

async function readPhotoAsset({ projectRoot, pathname }) {
  const photosRoot = path.resolve(projectRoot, "public", "photos");
  const relativePath = decodeURIComponent(pathname.slice("/photos/".length));
  const filePath = path.resolve(photosRoot, ...relativePath.split("/"));
  if (!filePath.startsWith(`${photosRoot}${path.sep}`)) {
    const error = new Error("Invalid photo path");
    error.statusCode = 400;
    throw error;
  }

  return {
    contentType: contentTypeForPhoto(filePath),
    body: await readFile(filePath)
  };
}

function contentTypeForPhoto(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "application/octet-stream";
}

function isKnownRouteWithWrongMethod(pathname) {
  return (
    normalizeAdminPath(pathname) === "/admin" ||
    pathname === "/admin/admin.css" ||
    pathname === "/admin/admin.js" ||
    pathname === "/api/albums" ||
    pathname === "/api/homepage" ||
    pathname.startsWith("/api/albums/") ||
    pathname === "/api/sync" ||
    pathname === "/api/publish"
  );
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > maxBodyBytes) {
      const error = new Error("Request body too large");
      error.statusCode = 413;
      throw error;
    }
  }

  try {
    return body.trim() ? JSON.parse(body) : {};
  } catch {
    const error = new Error("Invalid JSON body");
    error.statusCode = 400;
    throw error;
  }
}

function statusForError(error) {
  if (Number.isInteger(error.statusCode)) return error.statusCode;
  if (error.message === "Invalid album id") return 400;
  if (error.code === "ENOENT") return 404;
  return 500;
}

function sendText(response, status, asset) {
  response.writeHead(status, {
    "content-type": asset.contentType,
    "cache-control": "no-store"
  });
  response.end(asset.body);
}

function sendBinary(response, status, asset) {
  response.writeHead(status, {
    "content-type": asset.contentType,
    "cache-control": "no-store"
  });
  response.end(asset.body);
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createAdminServer({ projectRoot: defaultProjectRoot });
  server.listen(4000, "127.0.0.1", () => {
    console.log("Album admin running at http://127.0.0.1:4000/admin");
  });
}
