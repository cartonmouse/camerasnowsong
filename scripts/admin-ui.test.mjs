import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const adminScript = await readFile("admin/admin.js", "utf8");
const adminHtml = await readFile("admin/index.html", "utf8");
const adminCss = await readFile("admin/admin.css", "utf8");

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
assert.match(adminHtml, /id="save-feedback"/);
assert.match(adminScript, /saveFeedback/);
assert.match(adminScript, /setSaveFeedback/);
assert.match(adminScript, /保存中/);
assert.match(adminScript, /保存成功/);
assert.match(adminCss, /\.save-feedback/);
assert.match(adminScript, /主站数据和发布图已更新/);
assert.match(adminScript, /publishCounts/);
assert.match(adminScript, /正在更新主站数据并生成发布图/);
assert.match(adminScript, /setPublishButtonState/);
assert.match(adminScript, /发布中/);
assert.match(adminScript, /更新主站失败/);
assert.match(adminScript, /缺失源文件/);
assert.match(adminScript, /已清理旧发布图/);
assert.match(adminScript, /finally/);

console.log("admin ui feedback ok");
