import assert from "node:assert/strict";
import { getHeroCaption } from "./heroCaption.js";

assert.deepEqual(getHeroCaption({ title: "IMG_0325", location: "" }), {
  title: "",
  location: ""
});

assert.deepEqual(getHeroCaption({ title: "DSC_0001", location: "北京" }), {
  title: "",
  location: "北京"
});

assert.deepEqual(getHeroCaption({ title: "角楼晚照", location: "北京" }), {
  title: "角楼晚照",
  location: "北京"
});

console.log("hero caption helpers ok");
