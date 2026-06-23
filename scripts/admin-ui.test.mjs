import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const adminScript = await readFile("admin/admin.js", "utf8");

assert.match(adminScript, /正在保存相册信息/);
assert.match(adminScript, /保存中/);
assert.match(adminScript, /保存相册信息/);
assert.match(adminScript, /finally/);
assert.match(adminScript, /置顶/);
assert.match(adminScript, /置底/);
assert.match(adminScript, /direction === "top"/);
assert.match(adminScript, /direction === "bottom"/);
assert.match(adminScript, /data-photo-edit-path/);
assert.match(adminScript, /photoDetails/);
assert.match(adminScript, /photo-title-input/);
assert.match(adminScript, /photo-description-input/);
assert.match(adminScript, /photo-location-input/);
assert.match(adminScript, /photo-year-input/);
assert.doesNotMatch(adminScript, /class="star-badge"/);

console.log("admin ui feedback ok");
