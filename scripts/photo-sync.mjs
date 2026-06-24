import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const blankPhotoConfig = {
  title: "",
  description: "",
  topics: [],
  location: "",
  featured: false
};
const albumTemplateHints = {
  _comment: "photos 只需要填写那些想单独介绍的照片，不需要每张都写。",
  _photoExample: {
    "照片文件名.jpg": { ...blankPhotoConfig }
  },
  _nestedPhotoExample: {
    "子文件夹/照片文件名.jpg": { ...blankPhotoConfig }
  }
};

export async function collectPhotoRecords({ photosRoot }) {
  const files = await collectImageFiles(photosRoot);
  const records = [];
  const categoryCounts = new Map();
  const albumCache = new Map();

  for (const filePath of files) {
    const buffer = await readFile(filePath);
    const relativePath = path.relative(photosRoot, filePath);
    const category = relativePath.split(path.sep)[0] || "未分类";
    const categoryIndex = categoryCounts.get(category) || 0;
    categoryCounts.set(category, categoryIndex + 1);
    const album = await getAlbumConfig({ photosRoot, albumId: category, cache: albumCache });
    records.push(
      createPhotoRecord({
        filePath,
        photosRoot,
        index: records.length,
        categoryIndex,
        year: readExifYear(buffer),
        size: readImageSize(buffer),
        album
      })
    );
  }

  return records;
}

async function getAlbumConfig({ photosRoot, albumId, cache }) {
  if (cache.has(albumId)) {
    return cache.get(albumId);
  }

  const albumPath = path.join(photosRoot, albumId, "album.json");
  let parsed = {};
  try {
    parsed = JSON.parse(await readFile(albumPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw new Error(`Invalid album config: ${albumPath}\n${error.message}`);
    }
  }

  const album = normalizeAlbumConfig(albumId, parsed);
  cache.set(albumId, album);
  return album;
}

export async function createMissingAlbumConfigs({ photosRoot }) {
  const files = await collectImageFiles(photosRoot);
  const albumIds = new Set();

  for (const filePath of files) {
    const relativePath = path.relative(photosRoot, filePath);
    const parts = relativePath.split(path.sep);
    const albumId = parts[0];
    if (!albumId || parts.length < 2) continue;
    albumIds.add(albumId);
  }

  let changedAlbums = 0;

  for (const albumId of albumIds) {
    const albumPath = path.join(photosRoot, albumId, "album.json");
    if (await albumConfigExists(albumPath)) continue;

    const next = createAlbumTemplate(albumId);
    await mkdir(path.dirname(albumPath), { recursive: true });
    await writeFile(albumPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    changedAlbums += 1;
  }

  return { changedAlbums };
}

export async function pruneBlankPhotoConfigs({ photosRoot }) {
  const albumPaths = await collectAlbumConfigFiles(photosRoot);
  let changedAlbums = 0;
  let removedPhotos = 0;

  for (const albumPath of albumPaths) {
    const album = await readAlbumConfigFile(albumPath);
    if (!album.photos || typeof album.photos !== "object" || Array.isArray(album.photos)) continue;

    const nextPhotos = {};
    let albumChanged = false;
    for (const [photoKey, photoConfig] of Object.entries(album.photos)) {
      if (isBlankPhotoConfig(photoConfig)) {
        albumChanged = true;
        removedPhotos += 1;
      } else {
        nextPhotos[photoKey] = photoConfig;
      }
    }

    if (albumChanged) {
      await writeFile(albumPath, `${JSON.stringify({ ...album, photos: nextPhotos }, null, 2)}\n`, "utf8");
      changedAlbums += 1;
    }
  }

  return { changedAlbums, removedPhotos };
}

export async function syncPhotoData({ projectRoot, createTemplates = false, cleanBlankPhotos = false }) {
  const photosRoot = path.join(projectRoot, "public", "photos");

  if (createTemplates) {
    return createMissingAlbumConfigs({ photosRoot });
  }

  if (cleanBlankPhotos) {
    return pruneBlankPhotoConfigs({ photosRoot });
  }

  const dataPath = path.join(projectRoot, "src", "data", "photos.json");
  const homepage = await readHomepageConfig(photosRoot);
  const records = applyHomepageConfig(await collectPhotoRecords({ photosRoot }), homepage);
  await writeFile(dataPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  return { dataPath, records };
}

async function readHomepageConfig(photosRoot) {
  try {
    const parsed = JSON.parse(await readFile(path.join(photosRoot, "homepage.json"), "utf8"));
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      limit: Number.isInteger(parsed.limit) ? parsed.limit : 12
    };
  } catch (error) {
    if (error.code === "ENOENT") return { items: [], limit: 12 };
    throw error;
  }
}

function applyHomepageConfig(records, homepage) {
  const orderBySrc = new Map();
  for (const [index, item] of homepage.items.entries()) {
    if (!item || typeof item.src !== "string") continue;
    orderBySrc.set(item.src, {
      homeOrder: index,
      homeHidden: item.hidden === true
    });
  }

  return records.map((record) => {
    const homepageItem = orderBySrc.get(record.src);
    if (!homepageItem) {
      return {
        ...record,
        homeLimit: homepage.limit
      };
    }
    return {
      ...record,
      homeOrder: homepageItem.homeOrder,
      homeHidden: homepageItem.homeHidden,
      homeLimit: homepage.limit
    };
  });
}

async function albumConfigExists(albumPath) {
  try {
    await readFile(albumPath, "utf8");
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function createAlbumTemplate(albumId) {
  return {
    title: albumId,
    topics: inferAlbumTopics(albumId),
    description: `一组关于${albumId}的照片。`,
    featured: true,
    ...albumTemplateHints,
    photos: {}
  };
}

function inferAlbumTopics(albumId) {
  const text = albumId.toLowerCase();
  const topics = [];
  const rules = [
    ["Cosplay", /cos|cosplay|漫展|角色|沙金|星见雅|知更鸟/i],
    ["风景", /风景|山|水|湖|海|长城|自然/i],
    ["人像", /人像|写真|肖像|星见雅|知更鸟|沙金/i],
    ["城市", /城市|北京|上海|广州|深圳|天安门/i],
    ["旅行", /旅行|旅拍|长城|水长城/i],
    ["舞台", /舞台|演出|表演|live|音乐/i],
    ["纪实", /纪实|记录|升旗|现场/i],
    ["日常", /日常|生活|随拍/i]
  ];

  for (const [topic, pattern] of rules) {
    if (pattern.test(text) && !topics.includes(topic)) {
      topics.push(topic);
    }
  }

  return topics;
}

function isBlankPhotoConfig(photoConfig) {
  if (!photoConfig || typeof photoConfig !== "object" || Array.isArray(photoConfig)) {
    return false;
  }

  const meaningfulKeys = Object.entries(photoConfig).filter(([key, value]) => {
    if (key === "featured") {
      return value === true;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== "" && value !== false && value !== null && value !== undefined;
  });

  return meaningfulKeys.length === 0;
}

async function collectAlbumConfigFiles(photosRoot) {
  const albumPaths = [];
  const entries = await readdir(photosRoot, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name, "zh-CN", { numeric: true }));

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const albumPath = path.join(photosRoot, entry.name, "album.json");
      if (await albumConfigExists(albumPath)) {
        albumPaths.push(albumPath);
      }
    }
  }

  return albumPaths;
}

async function readAlbumConfigFile(albumPath) {
  try {
    return JSON.parse(await readFile(albumPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw new Error(`Invalid album config: ${albumPath}\n${error.message}`);
  }
}

function normalizeAlbumConfig(albumId, parsed) {
  const topics = Array.isArray(parsed.topics) ? parsed.topics.filter(Boolean) : [];
  return {
    id: albumId,
    title: parsed.title || albumId,
    topics,
    description: parsed.description || "",
    featured: parsed.featured !== false,
    cover: typeof parsed.cover === "string" ? parsed.cover.trim() : "",
    photos: parsed.photos && typeof parsed.photos === "object" ? parsed.photos : {}
  };
}

async function collectImageFiles(root) {
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name, "zh-CN", { numeric: true }));

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(fullPath);
      } else if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  }

  await visit(root);
  return files;
}

export function createPhotoRecord({ filePath, photosRoot, index, categoryIndex = index, year, size = {}, album }) {
  const relativePath = path.relative(photosRoot, filePath);
  const parts = relativePath.split(path.sep);
  const albumId = parts[0] || "未分类";
  const albumConfig = album || normalizeAlbumConfig(albumId, {});
  const photoConfig = getPhotoConfig(albumConfig, parts.slice(1));
  const title = photoConfig.title || cleanTitle(path.basename(filePath, path.extname(filePath)));
  const id = createId(relativePath);
  const topics = Array.isArray(photoConfig.topics) && photoConfig.topics.length > 0 ? photoConfig.topics : albumConfig.topics;
  const albumRelativePath = parts.slice(1).join("/");
  const isAlbumCover = Boolean(albumConfig.cover && albumConfig.cover === albumRelativePath);
  const featured = typeof photoConfig.featured === "boolean" ? photoConfig.featured : albumConfig.featured && categoryIndex < 2;
  const star = photoConfig.star === true;

  return {
    id,
    title,
    src: toPublicPhotoPath(relativePath),
    category: albumConfig.title,
    album: albumConfig.id,
    albumTitle: albumConfig.title,
    topics,
    albumDescription: albumConfig.description,
    isAlbumCover,
    featured,
    star,
    year: photoConfig.year || year,
    width: size.width || undefined,
    height: size.height || undefined,
    location: photoConfig.location || "",
    description: photoConfig.description || "",
    tone: photoConfig.tone || toneForIndex(index)
  };
}

function getPhotoConfig(albumConfig, albumRelativeParts) {
  const photos = albumConfig.photos || {};
  const slashPath = albumRelativeParts.join("/");
  const basename = albumRelativeParts[albumRelativeParts.length - 1] || "";
  return photos[slashPath] || photos[basename] || {};
}

export function readImageSize(buffer) {
  if (buffer.length < 12) return {};
  if (buffer.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))) {
    return readJpegSize(buffer);
  }
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return readWebpSize(buffer);
  }
  return {};
}

function readJpegSize(buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length && buffer[offset] === 0xff) {
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }
    offset += 2 + length;
  }
  return {};
}

function readWebpSize(buffer) {
  const chunk = buffer.subarray(12, 16).toString("ascii");
  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3)
    };
  }
  if (chunk === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    };
  }
  if (chunk === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1
    };
  }
  return {};
}

function cleanTitle(name) {
  return name
    .replace(/[-_ ]*(已增强|降噪|NR)(?=[-_ ]|$)/gi, "")
    .replace(/[-_ ]+/g, "_")
    .replace(/_+$/g, "")
    .trim();
}

function createId(relativePath) {
  const hash = createHash("sha1").update(relativePath).digest("hex").slice(0, 10);
  return `photo-${hash}`;
}

function toPublicPhotoPath(relativePath) {
  return `/photos/${relativePath
    .split(path.sep)
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

function toneForIndex(index) {
  const tones = ["graphite", "sage", "warm", "blue", "clay", "mono"];
  return tones[index % tones.length];
}

export function readExifYear(buffer) {
  const date = readExifDateTimeOriginal(buffer);
  const match = date.match(/^(\d{4})[:\-]/);
  return match ? match[1] : "";
}

function readExifDateTimeOriginal(buffer) {
  let offset = 2;
  while (offset + 4 < buffer.length && buffer[offset] === 0xff) {
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker === 0xe1 && buffer.subarray(offset + 4, offset + 10).toString("ascii") === "Exif\0\0") {
      return readDateFromTiff(buffer.subarray(offset + 10, offset + 2 + length));
    }
    offset += 2 + length;
  }
  return "";
}

function readDateFromTiff(tiff) {
  if (tiff.length < 8) return "";
  const littleEndian = tiff.subarray(0, 2).toString("ascii") === "II";
  const readUInt16 = (offset) => (littleEndian ? tiff.readUInt16LE(offset) : tiff.readUInt16BE(offset));
  const readUInt32 = (offset) => (littleEndian ? tiff.readUInt32LE(offset) : tiff.readUInt32BE(offset));
  const firstIfdOffset = readUInt32(4);
  const exifIfdOffset = findIfdValueOffset(tiff, firstIfdOffset, 0x8769, readUInt16, readUInt32);
  if (!exifIfdOffset) return "";
  const dateOffset = findIfdValueOffset(tiff, exifIfdOffset, 0x9003, readUInt16, readUInt32);
  if (!dateOffset || dateOffset >= tiff.length) return "";
  return tiff.subarray(dateOffset, dateOffset + 20).toString("ascii").replace(/\0.*/, "").trim();
}

function findIfdValueOffset(tiff, ifdOffset, tag, readUInt16, readUInt32) {
  if (ifdOffset + 2 > tiff.length) return 0;
  const entryCount = readUInt16(ifdOffset);
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (entryOffset + 12 > tiff.length) return 0;
    if (readUInt16(entryOffset) === tag) {
      return readUInt32(entryOffset + 8);
    }
  }
  return 0;
}

async function main() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  if (process.argv.includes("--templates")) {
    const result = await syncPhotoData({ projectRoot, createTemplates: true });
    console.log(`Created ${result.changedAlbums} missing album configs`);
    return;
  }
  if (process.argv.includes("--clean")) {
    const result = await syncPhotoData({ projectRoot, cleanBlankPhotos: true });
    console.log(`Cleaned ${result.removedPhotos} blank photo configs from ${result.changedAlbums} albums`);
    return;
  }

  const { dataPath, records } = await syncPhotoData({ projectRoot });
  console.log(`Synced ${records.length} photos to ${path.relative(projectRoot, dataPath)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
