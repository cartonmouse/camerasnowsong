import assert from "node:assert/strict";
import {
  getAlbums,
  getFeaturedPhotos,
  getPhotosByAlbum,
  getPhotosByTopic,
  getTopics
} from "./photos.js";

const photos = [
  {
    id: "a",
    title: "A",
    src: "/photos/a.jpg",
    album: "sha-jin",
    albumTitle: "沙金",
    topics: ["Cosplay", "人像"],
    featured: true,
    star: true
  },
  {
    id: "b",
    title: "B",
    src: "/photos/b.jpg",
    album: "great-wall",
    albumTitle: "水长城",
    topics: ["风景", "旅行"],
    featured: false
  },
  {
    id: "c",
    title: "C",
    src: "/photos/c.jpg",
    album: "sha-jin",
    albumTitle: "沙金",
    topics: ["Cosplay", "舞台"],
    featured: true,
    isAlbumCover: true
  },
  {
    id: "d",
    title: "D",
    src: "/photos/d.jpg",
    album: "daily",
    albumTitle: "日常练习",
    topics: ["街拍"],
    featured: false
  }
];

const orderedPhotos = photos.map((photo) => ({ ...photo }));
orderedPhotos[0].homeOrder = 1;
orderedPhotos[0].homeLimit = 1;
orderedPhotos[2].star = true;
orderedPhotos[2].homeOrder = 0;
orderedPhotos[2].homeLimit = 1;
orderedPhotos[3].star = true;
orderedPhotos[3].homeOrder = 2;
orderedPhotos[3].homeHidden = true;

assert.deepEqual(getTopics(photos), ["风景", "人像", "Cosplay", "旅行", "舞台", "街拍"]);
assert.deepEqual(getAlbums(photos), [
  { id: "sha-jin", title: "沙金" },
  { id: "great-wall", title: "水长城" },
  { id: "daily", title: "日常练习" }
]);
assert.deepEqual(getFeaturedPhotos(photos).map((photo) => photo.id), ["a"]);
assert.deepEqual(getFeaturedPhotos(orderedPhotos).map((photo) => photo.id), ["c"]);
assert.deepEqual(
  getFeaturedPhotos(photos.map(({ star, ...photo }) => photo)).map((photo) => photo.id),
  ["a", "c"]
);
assert.deepEqual(getPhotosByTopic(photos, "Cosplay").map((photo) => photo.id), ["a", "c"]);
assert.deepEqual(getPhotosByTopic(photos, "all").map((photo) => photo.id), ["a", "b", "c", "d"]);
assert.deepEqual(getPhotosByAlbum(photos, "sha-jin").map((photo) => photo.id), ["a", "c"]);
assert.deepEqual(getPhotosByAlbum(photos, "all").map((photo) => photo.id), ["a", "b", "c", "d"]);

console.log("photo helpers ok");
