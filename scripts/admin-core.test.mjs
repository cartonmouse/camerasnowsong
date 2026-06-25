import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  listAlbums,
  readAlbum,
  readHomepageConfig,
  saveHomepageConfig,
  saveAlbumMetadata,
  resolveAlbumPath,
  syncAlbums,
  defaultTopics
} from "./admin-core.mjs";

const tempRoot = await mkdtemp(path.join(tmpdir(), "album-admin-"));
const landscape = "\u98ce\u666f";
const shaJin = "\u6c99\u91d1";
const portrait = "\u4eba\u50cf";

try {
  const photosRoot = path.join(tempRoot, "public", "photos");
  await mkdir(path.join(photosRoot, "131\u6c34\u957f\u57ce"), { recursive: true });
  await mkdir(path.join(photosRoot, shaJin), { recursive: true });
  await writeFile(path.join(photosRoot, "131\u6c34\u957f\u57ce", "IMG_0001.jpg"), Buffer.from([1]));
  await writeFile(path.join(photosRoot, shaJin, "IMG_0661.jpg"), Buffer.from([1]));
  await writeFile(
    path.join(photosRoot, shaJin, "album.json"),
    JSON.stringify(
      {
        title: shaJin,
        topics: ["Cosplay", portrait],
        description: "\u4e00\u7ec4\u89d2\u8272\u7167\u7247\u3002",
        featured: true,
        cover: "IMG_0661.jpg",
        photos: {
          "IMG_0661.jpg": {
            title: "\u5927\u9009\u83b7\u80dc\uff01",
            description: "\u5728\u65b0\u7684\u7ade\u9009\u5f53\u4e2d\uff0c\u6211\u80dc\u5229\u4e86\uff01",
            star: true
          }
        }
      },
      null,
      2
    ),
    "utf8"
  );

  assert.ok(defaultTopics.includes(landscape));

  assert.equal(resolveAlbumPath({ photosRoot, albumId: shaJin }), path.join(photosRoot, shaJin));
  assert.throws(() => resolveAlbumPath({ photosRoot, albumId: "../outside" }), /Invalid album id/);

  const albumsBeforeTemplate = await listAlbums({ projectRoot: tempRoot });
  assert.deepEqual(
    albumsBeforeTemplate.map((album) => ({ id: album.id, status: album.status, photoCount: album.photoCount })),
    [
      { id: "131\u6c34\u957f\u57ce", status: "missing-config", photoCount: 1 },
      { id: shaJin, status: "configured", photoCount: 1 }
    ]
  );

  const shaJinAlbum = await readAlbum({ projectRoot: tempRoot, albumId: shaJin });
  assert.equal(shaJinAlbum.title, shaJin);
  assert.deepEqual(shaJinAlbum.topics, ["Cosplay", portrait]);
  assert.equal(shaJinAlbum.photoCount, 1);
  assert.equal(shaJinAlbum.cover, "IMG_0661.jpg");
  assert.deepEqual(shaJinAlbum.previewPhotos[0], {
    path: "IMG_0661.jpg",
    src: "/photos/%E6%B2%99%E9%87%91/IMG_0661.jpg",
    isCover: true,
    isStar: true,
    title: "\u5927\u9009\u83b7\u80dc\uff01",
    description: "\u5728\u65b0\u7684\u7ade\u9009\u5f53\u4e2d\uff0c\u6211\u80dc\u5229\u4e86\uff01",
    location: "",
    year: ""
  });
  assert.equal(shaJinAlbum.photos["IMG_0661.jpg"].title, "\u5927\u9009\u83b7\u80dc\uff01");

  await saveAlbumMetadata({
    projectRoot: tempRoot,
    albumId: shaJin,
    metadata: {
      title: "\u6c99\u91d1\u7cbe\u9009",
      topics: ["Cosplay", "\u821e\u53f0"],
      description: "\u66f4\u65b0\u540e\u7684\u76f8\u518c\u4ecb\u7ecd\u3002",
      featured: false,
      cover: "IMG_0661.jpg",
      starredPhotos: []
    }
  });
  const saved = JSON.parse(await readFile(path.join(photosRoot, shaJin, "album.json"), "utf8"));
  assert.equal(saved.title, "\u6c99\u91d1\u7cbe\u9009");
  assert.deepEqual(saved.topics, ["Cosplay", "\u821e\u53f0"]);
  assert.equal(saved.featured, false);
  assert.equal(saved.cover, "IMG_0661.jpg");
  assert.equal(saved.photos["IMG_0661.jpg"].title, "\u5927\u9009\u83b7\u80dc\uff01");
  assert.equal(saved.photos["IMG_0661.jpg"].star, undefined);

  await saveAlbumMetadata({
    projectRoot: tempRoot,
    albumId: shaJin,
    metadata: {
      title: "\u6c99\u91d1\u7cbe\u9009",
      topics: ["Cosplay", "\u821e\u53f0"],
      description: "\u66f4\u65b0\u540e\u7684\u76f8\u518c\u4ecb\u7ecd\u3002",
      featured: false,
      cover: "IMG_0661.jpg",
      starredPhotos: ["IMG_0661.jpg"]
    }
  });
  const savedWithStar = JSON.parse(await readFile(path.join(photosRoot, shaJin, "album.json"), "utf8"));
  assert.equal(savedWithStar.photos["IMG_0661.jpg"].star, true);

  await saveAlbumMetadata({
    projectRoot: tempRoot,
    albumId: shaJin,
    metadata: {
      title: "\u6c99\u91d1\u7cbe\u9009",
      topics: ["Cosplay", "\u821e\u53f0"],
      description: "\u66f4\u65b0\u540e\u7684\u76f8\u518c\u4ecb\u7ecd\u3002",
      featured: false,
      cover: "IMG_0661.jpg",
      starredPhotos: ["IMG_0661.jpg"],
      photoDetails: {
        "IMG_0661.jpg": {
          title: "\u5927\u9009\u83b7\u80dc\uff01",
          description: "\u5728\u65b0\u7684\u7ade\u9009\u5f53\u4e2d\uff0c\u6211\u80dc\u5229\u4e86\uff01",
          location: "\u4f1a\u573a",
          year: "2024"
        }
      }
    }
  });
  const savedWithDetails = JSON.parse(await readFile(path.join(photosRoot, shaJin, "album.json"), "utf8"));
  assert.deepEqual(savedWithDetails.photos["IMG_0661.jpg"], {
    title: "\u5927\u9009\u83b7\u80dc\uff01",
    description: "\u5728\u65b0\u7684\u7ade\u9009\u5f53\u4e2d\uff0c\u6211\u80dc\u5229\u4e86\uff01",
    star: true,
    location: "\u4f1a\u573a",
    year: "2024"
  });
  const albumWithDetails = await readAlbum({ projectRoot: tempRoot, albumId: shaJin });
  assert.equal(albumWithDetails.previewPhotos[0].title, "\u5927\u9009\u83b7\u80dc\uff01");
  assert.equal(albumWithDetails.previewPhotos[0].description, "\u5728\u65b0\u7684\u7ade\u9009\u5f53\u4e2d\uff0c\u6211\u80dc\u5229\u4e86\uff01");
  assert.equal(albumWithDetails.previewPhotos[0].location, "\u4f1a\u573a");
  assert.equal(albumWithDetails.previewPhotos[0].year, "2024");

  await saveAlbumMetadata({
    projectRoot: tempRoot,
    albumId: shaJin,
    metadata: {
      title: "\u6c99\u91d1\u7cbe\u9009",
      topics: ["Cosplay", "\u821e\u53f0"],
      description: "\u66f4\u65b0\u540e\u7684\u76f8\u518c\u4ecb\u7ecd\u3002",
      featured: false,
      cover: "IMG_0661.jpg",
      starredPhotos: [],
      photoDetails: {
        "IMG_0661.jpg": {
          title: "",
          description: "",
          location: "",
          year: ""
        }
      }
    }
  });
  const savedWithoutDetails = JSON.parse(await readFile(path.join(photosRoot, shaJin, "album.json"), "utf8"));
  assert.equal(savedWithoutDetails.photos["IMG_0661.jpg"], undefined);

  const homepageBefore = await readHomepageConfig({ projectRoot: tempRoot });
  assert.deepEqual(homepageBefore, { items: [], limit: 12 });

  await saveHomepageConfig({
    projectRoot: tempRoot,
    config: {
      items: [
        {
          src: "/photos/%E6%B2%99%E9%87%91/IMG_0661.jpg",
          hidden: false
        }
      ],
      limit: 6
    }
  });
  const homepageAfter = await readHomepageConfig({ projectRoot: tempRoot });
  assert.deepEqual(homepageAfter, {
    items: [
      {
        src: "/photos/%E6%B2%99%E9%87%91/IMG_0661.jpg",
        hidden: false
      }
    ],
    limit: 6
  });

  const syncResult = await syncAlbums({ projectRoot: tempRoot });
  assert.equal(syncResult.changedAlbums, 1);
  assert.equal(syncResult.photoCount, 2);
  const created = await readAlbum({ projectRoot: tempRoot, albumId: "131\u6c34\u957f\u57ce" });
  assert.equal(created.title, "131\u6c34\u957f\u57ce");
  assert.ok(created.topics.includes(landscape));
  assert.equal(created.status, "configured");

  await saveAlbumMetadata({
    projectRoot: tempRoot,
    albumId: "131\u6c34\u957f\u57ce",
    metadata: {
      title: "",
      topics: [],
      description: "",
      featured: true
    }
  });
  const needsInfo = await readAlbum({ projectRoot: tempRoot, albumId: "131\u6c34\u957f\u57ce" });
  assert.equal(needsInfo.status, "needs-topics");

  console.log("admin core ok");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
