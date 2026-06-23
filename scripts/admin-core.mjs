import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createMissingAlbumConfigs, collectPhotoRecords, syncPhotoData } from "./photo-sync.mjs";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export const defaultTopics = ["风景", "人像", "Cosplay", "城市", "旅行", "舞台", "纪实", "日常", "待分类"];

export function getPhotosRoot(projectRoot) {
  return path.join(projectRoot, "public", "photos");
}

export function getHomepagePath(projectRoot) {
  return path.join(getPhotosRoot(projectRoot), "homepage.json");
}

export function resolveAlbumPath({ photosRoot, albumId }) {
  if (!albumId || albumId.includes("/") || albumId.includes("\\") || albumId === "." || albumId === "..") {
    throw new Error("Invalid album id");
  }

  const root = path.resolve(photosRoot);
  const albumPath = path.resolve(root, albumId);
  if (albumPath !== root && albumPath.startsWith(`${root}${path.sep}`)) {
    return albumPath;
  }
  throw new Error("Invalid album id");
}

export async function listAlbums({ projectRoot }) {
  const photosRoot = getPhotosRoot(projectRoot);
  const entries = await safeReadDir(photosRoot);
  const albums = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    albums.push(await readAlbum({ projectRoot, albumId: entry.name }));
  }

  return albums.sort((a, b) => a.id.localeCompare(b.id, "zh-CN", { numeric: true }));
}

export async function readAlbum({ projectRoot, albumId }) {
  const photosRoot = getPhotosRoot(projectRoot);
  const albumPath = resolveAlbumPath({ photosRoot, albumId });
  const albumJsonPath = path.join(albumPath, "album.json");
  const raw = await readAlbumJson(albumJsonPath);
  const photos = raw.photos && typeof raw.photos === "object" && !Array.isArray(raw.photos) ? raw.photos : {};
  const photoFiles = await collectAlbumImages(albumPath);
  const topics = normalizeTopics(raw.topics);
  const configExists = raw.__exists === true;
  const title = typeof raw.title === "string" ? raw.title : albumId;
  const description = typeof raw.description === "string" ? raw.description : "";
  const featured = typeof raw.featured === "boolean" ? raw.featured : true;
  const cover = stringValue(raw.cover);

  return {
    id: albumId,
    title,
    topics,
    description,
    featured,
    cover,
    photos,
    photoCount: photoFiles.length,
    previewPhotos: photoFiles.map((file) => {
      const photoPath = toAlbumSlashPath(file);
      const photoConfig = getPhotoConfig(photos, photoPath);
      return {
        path: photoPath,
        src: `/photos/${[albumId, ...file.split(path.sep)].map(encodeURIComponent).join("/")}`,
        isCover: photoPath === cover,
        isStar: photoConfig.star === true,
        title: stringValue(photoConfig.title),
        description: stringValue(photoConfig.description),
        location: stringValue(photoConfig.location),
        year: stringValue(photoConfig.year)
      };
    }),
    status: albumStatus({ configExists, topics, description })
  };
}

export async function saveAlbumMetadata({ projectRoot, albumId, metadata }) {
  const photosRoot = getPhotosRoot(projectRoot);
  const albumPath = resolveAlbumPath({ photosRoot, albumId });
  const albumJsonPath = path.join(albumPath, "album.json");
  const existing = await readAlbumJson(albumJsonPath);
  const photoFiles = await collectAlbumImages(albumPath);
  const photos = updatePhotoConfigs({
    photos: existing.photos && typeof existing.photos === "object" && !Array.isArray(existing.photos) ? existing.photos : {},
    photoFiles,
    starredPhotos: metadata.starredPhotos,
    photoDetails: metadata.photoDetails
  });
  const next = {
    ...existing,
    title: stringValue(metadata.title),
    topics: normalizeTopics(metadata.topics),
    description: stringValue(metadata.description),
    featured: metadata.featured !== false,
    cover: stringValue(metadata.cover),
    photos
  };
  delete next.__exists;

  await mkdir(albumPath, { recursive: true });
  await writeFile(albumJsonPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return readAlbum({ projectRoot, albumId });
}

export async function readHomepageConfig({ projectRoot }) {
  try {
    return normalizeHomepageConfig(JSON.parse(await readFile(getHomepagePath(projectRoot), "utf8")));
  } catch (error) {
    if (error.code === "ENOENT") return { items: [], limit: 12 };
    throw new Error(`Invalid homepage config: ${getHomepagePath(projectRoot)}\n${error.message}`);
  }
}

export async function saveHomepageConfig({ projectRoot, config }) {
  const photosRoot = getPhotosRoot(projectRoot);
  await mkdir(photosRoot, { recursive: true });
  const next = normalizeHomepageConfig(config);
  await writeFile(getHomepagePath(projectRoot), `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export async function syncAlbums({ projectRoot }) {
  const photosRoot = getPhotosRoot(projectRoot);
  const templateResult = await createMissingAlbumConfigs({ photosRoot });
  const records = await collectPhotoRecords({ photosRoot });
  return {
    changedAlbums: templateResult.changedAlbums,
    photoCount: records.length
  };
}

export async function publishSiteData({ projectRoot }) {
  const result = await syncPhotoData({ projectRoot });
  return {
    dataPath: result.dataPath,
    photoCount: result.records.length
  };
}

function albumStatus({ configExists, topics, description }) {
  if (!configExists) return "missing-config";
  if (topics.length === 0) return "needs-topics";
  if (!description.trim()) return "needs-description";
  return "configured";
}

async function safeReadDir(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.sort((a, b) => a.name.localeCompare(b.name, "zh-CN", { numeric: true }));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function readAlbumJson(albumJsonPath) {
  try {
    return { ...(JSON.parse(await readFile(albumJsonPath, "utf8")) || {}), __exists: true };
  } catch (error) {
    if (error.code === "ENOENT") return { __exists: false };
    throw new Error(`Invalid album config: ${albumJsonPath}\n${error.message}`);
  }
}

async function collectAlbumImages(albumPath) {
  const files = [];

  async function visit(directory, prefix = "") {
    const entries = await safeReadDir(directory);
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      const relative = prefix ? path.join(prefix, entry.name) : entry.name;
      if (entry.isDirectory()) {
        await visit(fullPath, relative);
      } else if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) {
        files.push(relative);
      }
    }
  }

  await visit(albumPath);
  return files;
}

function normalizeTopics(topics) {
  if (!Array.isArray(topics)) return [];
  return [...new Set(topics.map((topic) => stringValue(topic)).filter(Boolean))];
}

function stringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toAlbumSlashPath(file) {
  return file.split(path.sep).join("/");
}

function normalizeHomepageConfig(config) {
  const items = Array.isArray(config?.items)
    ? config.items
        .map((item) => ({
          src: stringValue(item?.src),
          hidden: item?.hidden === true
        }))
        .filter((item) => item.src.startsWith("/photos/"))
    : [];
  const limit = Number.isInteger(config?.limit) && config.limit > 0 ? Math.min(config.limit, 100) : 12;
  return { items, limit };
}

function getPhotoConfig(photos, photoPath) {
  const basename = path.basename(photoPath);
  return photos[photoPath] || photos[basename] || {};
}

function updatePhotoConfigs({ photos, photoFiles, starredPhotos, photoDetails }) {
  const next = structuredClone(photos);
  const starred = Array.isArray(starredPhotos)
    ? new Set(starredPhotos.map((photoPath) => toAlbumSlashPath(photoPath)).filter(Boolean))
    : null;
  const details = photoDetails && typeof photoDetails === "object" && !Array.isArray(photoDetails) ? photoDetails : {};

  for (const file of photoFiles) {
    const photoPath = toAlbumSlashPath(file);
    const key = next[photoPath] ? photoPath : path.basename(photoPath);
    const existing = next[key] && typeof next[key] === "object" && !Array.isArray(next[key]) ? next[key] : {};
    const updated = { ...existing };
    const incoming = details[photoPath] || details[path.basename(photoPath)];

    if (incoming && typeof incoming === "object" && !Array.isArray(incoming)) {
      assignStringField(updated, "title", incoming.title);
      assignStringField(updated, "description", incoming.description);
      assignStringField(updated, "location", incoming.location);
      assignStringField(updated, "year", incoming.year);
    }

    if (starred?.has(photoPath)) {
      updated.star = true;
    } else if (starred) {
      delete updated.star;
    }

    if (isEmptyPhotoConfig(updated)) {
      delete next[key];
    } else {
      next[key] = updated;
    }
  }

  return next;
}

function assignStringField(target, key, value) {
  const nextValue = stringValue(value);
  if (nextValue) {
    target[key] = nextValue;
  } else {
    delete target[key];
  }
}

function isEmptyPhotoConfig(photoConfig) {
  return Object.values(photoConfig).every((value) => {
    if (Array.isArray(value)) return value.length === 0;
    return value === "" || value === false || value === null || value === undefined;
  });
}
