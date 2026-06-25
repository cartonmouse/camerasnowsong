import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("scripts/photo-sync.mjs")).href;
const {
  collectPhotoRecords,
  createMissingAlbumConfigs,
  createPhotoRecord,
  pruneBlankPhotoConfigs,
  syncPhotoData,
  readExifYear,
  readImageSize
} = await import(moduleUrl);

const shaJin = "\u6c99\u91d1";
const portrait = "\u4eba\u50cf";
const tiananmen = "116\u5929\u5b89\u95e8\u5347\u65d7";
const xingjianya = "1.18\u661f\u89c1\u96c5\uff08\u5df2\u53d1\uff09";
const robin = "2\u77e5\u66f4\u9e1f_\u97f3\u4e50\u53f0";
const finalFolder = "\u7ec8\u7a3f";
const enhanced = "\u5df2\u589e\u5f3a";
const denoise = "\u964d\u566a";
const albumDescription = "\u4e00\u7ec4\u4ee5\u89d2\u8272\u9020\u578b\u4e3a\u4e3b\u7684\u7167\u7247\u3002";
const photoTitle = "\u91cd\u70b9\u7167\u7247";
const photoDescription = "\u8fd9\u5f20\u7167\u7247\u6709\u5355\u72ec\u7684\u4ecb\u7ecd\u3002";
const beijing = "\u5317\u4eac";

const tempRoot = await mkdtemp(path.join(tmpdir(), "photo-sync-"));

try {
  const photosRoot = path.join(tempRoot, "public", "photos");
  await mkdir(path.join(photosRoot, shaJin), { recursive: true });
  await mkdir(path.join(photosRoot, tiananmen, finalFolder), { recursive: true });
  await mkdir(path.join(photosRoot, xingjianya), { recursive: true });
  await mkdir(path.join(photosRoot, robin), { recursive: true });
  await writeFile(
    path.join(photosRoot, shaJin, "album.json"),
    JSON.stringify({
      title: shaJin,
      topics: ["Cosplay", portrait],
      description: albumDescription,
      featured: true,
      cover: `IMG_0661-${enhanced}-NR.jpg`,
      photos: {
        [`IMG_0661-${enhanced}-NR.jpg`]: {
          title: photoTitle,
          description: photoDescription,
          topics: [portrait],
          featured: false,
          star: true,
          location: beijing
        }
      }
    }),
    "utf8"
  );
  const jpeg = Buffer.from([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x11, 0x08,
    0x04, 0x38,
    0x06, 0x54,
    0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
    0xff, 0xd9
  ]);
  await writeFile(path.join(photosRoot, shaJin, `IMG_0661-${enhanced}-NR.jpg`), jpeg);
  await writeFile(
    path.join(photosRoot, tiananmen, finalFolder, `IMG_1885-${enhanced}-${denoise}.jpg`),
    Buffer.from([0xff, 0xd8, 0xff, 0xd9])
  );
  await writeFile(path.join(photosRoot, xingjianya, "IMG_0001.jpg"), jpeg);
  await writeFile(path.join(photosRoot, robin, "IMG_0002.jpg"), jpeg);
  await writeFile(path.join(photosRoot, shaJin, "notes.txt"), "not a photo");

  const first = createPhotoRecord({
    filePath: path.join(photosRoot, shaJin, `IMG_0661-${enhanced}-NR.jpg`),
    photosRoot,
    index: 0,
    year: "2024",
    size: { width: 1620, height: 1080 },
    album: {
      id: shaJin,
      title: shaJin,
      topics: ["Cosplay", portrait],
      description: albumDescription,
      featured: true,
      photos: {
        [`IMG_0661-${enhanced}-NR.jpg`]: {
          title: photoTitle,
          description: photoDescription,
          topics: [portrait],
          featured: false,
          star: true,
          location: beijing
        }
      }
    }
  });
  assert.equal(first.category, shaJin);
  assert.equal(first.album, shaJin);
  assert.equal(first.albumTitle, shaJin);
  assert.deepEqual(first.topics, [portrait]);
  assert.equal(first.albumDescription, albumDescription);
  assert.equal(first.description, photoDescription);
  assert.equal(first.location, beijing);
  assert.equal(first.src, "/photos/%E6%B2%99%E9%87%91/IMG_0661-%E5%B7%B2%E5%A2%9E%E5%BC%BA-NR.jpg");
  assert.equal(first.title, photoTitle);
  assert.equal(first.year, "2024");
  assert.equal(first.width, 1620);
  assert.equal(first.height, 1080);
  assert.equal(first.featured, false);
  assert.equal(first.star, true);

  const nested = createPhotoRecord({
    filePath: path.join(photosRoot, tiananmen, finalFolder, `IMG_1885-${enhanced}-${denoise}.jpg`),
    photosRoot,
    index: 2,
    year: ""
  });
  assert.equal(nested.category, tiananmen);
  assert.deepEqual(nested.topics, []);
  assert.equal(nested.src, "/photos/116%E5%A4%A9%E5%AE%89%E9%97%A8%E5%8D%87%E6%97%97/%E7%BB%88%E7%A8%BF/IMG_1885-%E5%B7%B2%E5%A2%9E%E5%BC%BA-%E9%99%8D%E5%99%AA.jpg");
  assert.equal(nested.featured, false);

  const records = await collectPhotoRecords({ photosRoot });
  assert.equal(records.length, 4);
  assert.deepEqual(records.map((record) => record.category).sort(), [xingjianya, tiananmen, robin, shaJin]);
  const syncedShaJin = records.find((record) => record.album === shaJin);
  assert.deepEqual(syncedShaJin.topics, [portrait]);
  assert.equal(syncedShaJin.title, photoTitle);
  assert.equal(syncedShaJin.description, photoDescription);
  assert.equal(syncedShaJin.isAlbumCover, true);
  assert.equal(syncedShaJin.featured, false);
  assert.equal(syncedShaJin.star, true);

  const projectRoot = path.join(tempRoot, "project");
  const projectPhotosRoot = path.join(projectRoot, "public", "photos", shaJin);
  await mkdir(path.join(projectRoot, "src", "data"), { recursive: true });
  await mkdir(projectPhotosRoot, { recursive: true });
  await writeFile(
    path.join(projectPhotosRoot, "album.json"),
    JSON.stringify({
      title: shaJin,
      topics: [portrait],
      description: albumDescription,
      cover: "IMG_9000.jpg",
      photos: {
        "IMG_9000.jpg": {
          title: photoTitle,
          description: photoDescription,
          star: true
        }
      }
    }),
    "utf8"
  );
  await writeFile(path.join(projectPhotosRoot, "IMG_9000.jpg"), jpeg);
  await writeFile(
    path.join(projectRoot, "public", "photos", "homepage.json"),
    JSON.stringify({
      items: [
        {
          src: "/photos/%E6%B2%99%E9%87%91/IMG_9000.jpg",
          hidden: false
        }
      ],
      limit: 8
    }),
    "utf8"
  );
  const syncResult = await syncPhotoData({ projectRoot });
  const syncedDataPath = path.join(projectRoot, "src", "data", "photos.json");
  const syncedData = JSON.parse(await readFile(syncedDataPath, "utf8"));
  assert.equal(syncResult.records.length, 1);
  assert.equal(syncResult.dataPath, syncedDataPath);
  assert.equal(syncedData.length, 1);
  assert.equal(syncedData[0].album, shaJin);
  assert.equal(syncedData[0].title, photoTitle);
  assert.equal(syncedData[0].src, "/photos/%E6%B2%99%E9%87%91/IMG_9000.jpg");
  assert.equal(syncedData[0].isAlbumCover, true);
  assert.equal(syncedData[0].featured, true);
  assert.equal(syncedData[0].star, true);
  assert.equal(syncedData[0].homeOrder, 0);
  assert.equal(syncedData[0].homeHidden, false);
  assert.equal(syncedData[0].homeLimit, 8);

  assert.equal(readExifYear(Buffer.from([0xff, 0xd8, 0xff, 0xd9])), "");
  assert.deepEqual(readImageSize(jpeg), { width: 1620, height: 1080 });

  await writeFile(path.join(photosRoot, shaJin, "IMG_0704.jpg"), jpeg);
  await createMissingAlbumConfigs({ photosRoot });
  const updatedShaJin = JSON.parse(await readFile(path.join(photosRoot, shaJin, "album.json"), "utf8"));
  assert.equal(updatedShaJin.title, shaJin);
  assert.deepEqual(updatedShaJin.photos[`IMG_0661-${enhanced}-NR.jpg`], {
    title: photoTitle,
    description: photoDescription,
    topics: [portrait],
    featured: false,
    star: true,
    location: beijing
  });
  assert.equal(updatedShaJin.photos["IMG_0704.jpg"], undefined);

  const createdAlbum = JSON.parse(await readFile(path.join(photosRoot, tiananmen, "album.json"), "utf8"));
  assert.equal(createdAlbum.title, tiananmen);
  assert.deepEqual(createdAlbum.topics, ["人文"]);
  assert.equal(createdAlbum.description, `一组关于${tiananmen}的照片。`);
  assert.equal(createdAlbum.featured, true);
  assert.equal(createdAlbum._comment, "photos 只需要填写那些想单独介绍的照片，不需要每张都写。");
  assert.deepEqual(createdAlbum._photoExample, {
    "照片文件名.jpg": {
      title: "",
      description: "",
      topics: [],
      location: "",
      featured: false
    }
  });
  assert.deepEqual(createdAlbum._nestedPhotoExample, {
    "子文件夹/照片文件名.jpg": {
      title: "",
      description: "",
      topics: [],
      location: "",
      featured: false
    }
  });
  assert.deepEqual(createdAlbum.photos, {});

  const createdXingjianya = JSON.parse(await readFile(path.join(photosRoot, xingjianya, "album.json"), "utf8"));
  assert.deepEqual(createdXingjianya.topics, ["Cosplay", portrait]);

  const createdRobin = JSON.parse(await readFile(path.join(photosRoot, robin, "album.json"), "utf8"));
  assert.deepEqual(createdRobin.topics, ["Cosplay", portrait, "人文"]);

  updatedShaJin.photos["IMG_0704.jpg"] = {
    title: "",
    description: "",
    topics: [],
    location: "",
    featured: false,
    star: false
  };
  updatedShaJin.photos["IMG_0707.jpg"] = {
    title: "",
    description: "",
    topics: [portrait],
    location: "",
    featured: false
  };
  await writeFile(path.join(photosRoot, shaJin, "album.json"), JSON.stringify(updatedShaJin, null, 2), "utf8");
  const pruneResult = await pruneBlankPhotoConfigs({ photosRoot });
  const cleanedShaJin = JSON.parse(await readFile(path.join(photosRoot, shaJin, "album.json"), "utf8"));
  assert.deepEqual(pruneResult, { changedAlbums: 1, removedPhotos: 1 });
  assert.equal(cleanedShaJin.photos["IMG_0704.jpg"], undefined);
  assert.equal(cleanedShaJin.photos[`IMG_0661-${enhanced}-NR.jpg`].title, photoTitle);
  assert.deepEqual(cleanedShaJin.photos["IMG_0707.jpg"].topics, [portrait]);

  console.log("photo sync helpers ok");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
