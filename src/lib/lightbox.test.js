import assert from "node:assert/strict";
import { getLightboxNavigation } from "./lightbox.js";

const photos = [
  { id: "a", title: "A" },
  { id: "b", title: "B" },
  { id: "c", title: "C" }
];

assert.deepEqual(getLightboxNavigation(photos, photos[0]), {
  currentIndex: 0,
  total: 3,
  previous: photos[2],
  next: photos[1]
});

assert.deepEqual(getLightboxNavigation(photos, photos[2]), {
  currentIndex: 2,
  total: 3,
  previous: photos[1],
  next: photos[0]
});

assert.deepEqual(getLightboxNavigation([], photos[0]), {
  currentIndex: 0,
  total: 1,
  previous: photos[0],
  next: photos[0]
});

assert.deepEqual(getLightboxNavigation(photos, { id: "missing", title: "Missing" }), {
  currentIndex: 0,
  total: 1,
  previous: { id: "missing", title: "Missing" },
  next: { id: "missing", title: "Missing" }
});

console.log("lightbox navigation ok");
