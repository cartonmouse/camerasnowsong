const state = {
  albums: [],
  selectedId: "",
  mode: "album",
  homepage: { items: [], limit: 12 },
  topics: ["风景", "人像", "Cosplay", "城市", "旅行", "舞台", "纪实", "日常", "待分类"]
};

const elements = {
  status: document.querySelector("#status-line"),
  list: document.querySelector("#album-list"),
  form: document.querySelector("#album-form"),
  albumId: document.querySelector("#album-id"),
  albumModeButton: document.querySelector("#album-mode-button"),
  homeModeButton: document.querySelector("#home-mode-button"),
  editorTitle: document.querySelector("#editor-title"),
  title: document.querySelector("#title"),
  description: document.querySelector("#description"),
  featured: document.querySelector("#featured"),
  cover: document.querySelector("#cover"),
  topicGrid: document.querySelector("#topic-grid"),
  customTopic: document.querySelector("#custom-topic"),
  addTopic: document.querySelector("#add-topic"),
  previews: document.querySelector("#preview-strip"),
  homeManager: document.querySelector("#home-manager"),
  homePhotoGrid: document.querySelector("#home-photo-grid"),
  homeLimit: document.querySelector("#home-limit"),
  homepageSaveButton: document.querySelector("#homepage-save-button"),
  syncButton: document.querySelector("#sync-button"),
  publishButton: document.querySelector("#publish-button")
};

await loadAlbums();

elements.list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-album-id]");
  if (!button) return;
  selectAlbum(button.dataset.albumId);
  setMode("album");
});

elements.albumModeButton.addEventListener("click", () => setMode("album"));
elements.homeModeButton.addEventListener("click", () => setMode("home"));
elements.homepageSaveButton.addEventListener("click", async () => {
  await saveHomepageOrder();
});

elements.addTopic.addEventListener("click", () => {
  const topic = elements.customTopic.value.trim();
  if (!topic) return;
  if (!state.topics.includes(topic)) {
    state.topics.push(topic);
  }
  const current = selectedAlbum();
  current.topics = [...new Set([...(current.topics || []), topic])];
  elements.customTopic.value = "";
  renderEditor(current);
});

elements.previews.addEventListener("click", (event) => {
  const button = event.target.closest("[data-star-path]");
  if (!button) return;
  const album = selectedAlbum();
  if (!album) return;
  const photo = (album.previewPhotos || []).find((item) => item.path === button.dataset.starPath);
  if (!photo) return;
  photo.isStar = !photo.isStar;
  renderEditor(album);
  renderHomeManager();
  setStatus(photo.isStar ? "已标记为首页照片，保存相册信息后生效。" : "已取消首页标记，保存相册信息后生效。");
});

elements.syncButton.addEventListener("click", async () => {
  await postJson("/api/sync", {});
  await loadAlbums();
  setStatus("已扫描照片文件夹，并补齐缺失的 album.json。");
});

elements.publishButton.addEventListener("click", async () => {
  const data = await postJson("/api/publish", {});
  setStatus(`主站数据已更新，共 ${data.result.photoCount} 张照片。刷新主站即可看到最新内容。`);
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const album = selectedAlbum();
  if (!album) return;
  const submitButton = event.submitter || elements.form.querySelector('button[type="submit"]');
  const topics = [...elements.topicGrid.querySelectorAll("input:checked")].map((input) => input.value);
  album.title = elements.title.value;
  album.description = elements.description.value;
  album.featured = elements.featured.checked;
  album.cover = elements.cover.value;
  album.topics = topics;
  setSubmitButtonState(submitButton, true);
  setStatus("正在保存相册信息...");
  try {
    const saved = await saveAlbum(album);
    selectAlbum(saved.id);
    renderHomeManager();
    setStatus("相册信息已保存。点击“更新主站”后，主网页会读取最新 Star 设置。");
  } catch (error) {
    setStatus(`保存失败：${error.message}`);
  } finally {
    setSubmitButtonState(submitButton, false);
  }
});

elements.homePhotoGrid.addEventListener("click", async (event) => {
  const moveButton = event.target.closest("[data-home-move]");
  if (moveButton) {
    moveHomepagePhoto(moveButton.dataset.homeSrc, moveButton.dataset.homeMove);
    return;
  }

  const hiddenButton = event.target.closest("[data-home-toggle-hidden]");
  if (hiddenButton) {
    toggleHomepageHidden(hiddenButton.dataset.homeToggleHidden);
    return;
  }

  const button = event.target.closest("[data-home-unstar]");
  if (!button) return;
  const album = state.albums.find((item) => item.id === button.dataset.albumId);
  if (!album) return;
  const photo = (album.previewPhotos || []).find((item) => item.path === button.dataset.homeUnstar);
  if (!photo) return;
  photo.isStar = false;
  state.homepage.items = state.homepage.items.filter((item) => item.src !== photo.src);
  await saveAlbum(album);
  renderEditor(selectedAlbum());
  renderHomeManager();
  await saveHomepageOrder({ silent: true });
  setStatus("已从首页照片中移除，并写回 album.json。点击“更新主站”后，主网页会同步变化。");
});

async function loadAlbums() {
  setStatus("正在读取相册...");
  const [data, homepage] = await Promise.all([fetchJson("/api/albums"), fetchJson("/api/homepage")]);
  state.albums = data.albums || [];
  state.homepage = homepage || { items: [], limit: 12 };
  elements.homeLimit.value = state.homepage.limit || 12;
  for (const album of state.albums) {
    for (const topic of album.topics || []) {
      if (!state.topics.includes(topic)) state.topics.push(topic);
    }
  }
  renderAlbumList();
  selectAlbum(state.selectedId || state.albums[0]?.id || "");
  renderHomeManager();
  setStatus(`共 ${state.albums.length} 个相册。`);
}

function renderAlbumList() {
  elements.list.innerHTML = state.albums
    .map((album) => {
      const statusText = statusLabel(album.status);
      return `<button class="album-item ${album.id === state.selectedId ? "active" : ""}" type="button" data-album-id="${escapeHtml(album.id)}">
        <strong>${escapeHtml(album.title || album.id)}</strong>
        <span>${album.photoCount} 张照片 · ${statusText}</span>
      </button>`;
    })
    .join("");
}

function selectAlbum(albumId) {
  state.selectedId = albumId;
  renderAlbumList();
  renderEditor(selectedAlbum());
}

function setMode(mode) {
  state.mode = mode;
  elements.albumModeButton.classList.toggle("active", mode === "album");
  elements.homeModeButton.classList.toggle("active", mode === "home");
  elements.list.classList.toggle("hidden", mode !== "album");
  elements.form.classList.toggle("hidden", mode !== "album");
  elements.homeManager.classList.toggle("hidden", mode !== "home");
  if (mode === "home") {
    renderHomeManager();
  }
}

function renderEditor(album) {
  if (!album) {
    elements.albumId.textContent = "未选择";
    elements.editorTitle.textContent = "选择一个相册";
    elements.form.querySelectorAll("input, textarea, button").forEach((element) => {
      if (element.id !== "sync-button") element.disabled = true;
    });
    return;
  }

  elements.form.querySelectorAll("input, textarea, button").forEach((element) => {
    element.disabled = false;
  });
  elements.albumId.textContent = album.id;
  elements.editorTitle.textContent = album.title || album.id;
  elements.title.value = album.title || "";
  elements.description.value = album.description || "";
  elements.featured.checked = album.featured !== false;
  elements.cover.value = album.cover || "";
  renderTopics(album.topics || []);
  elements.previews.innerHTML = (album.previewPhotos || [])
    .map((photo) => {
      const isCover = photo.path === (album.cover || "");
      const isStar = photo.isStar === true;
      return `<button class="photo-option ${isStar ? "active" : ""}" type="button" data-star-path="${escapeHtml(photo.path)}" title="${isStar ? "取消首页展示" : "设为首页展示"}">
        <img src="${photo.src}" alt="${escapeHtml(album.title || album.id)}" loading="lazy" />
        ${isCover ? '<span class="cover-badge">相册封面</span>' : ""}
        <span class="star-badge">${isStar ? "首页展示" : "设为首页"}</span>
      </button>`;
    })
    .join("");
}

function renderHomeManager() {
  const starred = orderedHomepagePhotos();

  elements.homePhotoGrid.innerHTML =
    starred.length > 0
      ? starred
          .map(
            (photo, index) => `<article class="home-photo-card ${photo.hidden ? "is-hidden" : ""}">
              <img src="${photo.src}" alt="${escapeHtml(photo.albumTitle)}" loading="lazy" />
              <div class="home-photo-card-body">
                <strong>${index + 1}. ${escapeHtml(photo.path)}</strong>
                <span>${escapeHtml(photo.albumTitle)}</span>
                <div class="home-photo-controls">
                  <button class="secondary-button" type="button" data-home-src="${escapeHtml(photo.src)}" data-home-move="top" ${index === 0 ? "disabled" : ""}>置顶</button>
                  <button class="secondary-button" type="button" data-home-src="${escapeHtml(photo.src)}" data-home-move="up" ${index === 0 ? "disabled" : ""}>上移</button>
                  <button class="secondary-button" type="button" data-home-src="${escapeHtml(photo.src)}" data-home-move="down" ${index === starred.length - 1 ? "disabled" : ""}>下移</button>
                  <button class="secondary-button" type="button" data-home-src="${escapeHtml(photo.src)}" data-home-move="bottom" ${index === starred.length - 1 ? "disabled" : ""}>置底</button>
                  <button class="secondary-button" type="button" data-home-toggle-hidden="${escapeHtml(photo.src)}">${photo.hidden ? "显示" : "隐藏"}</button>
                  <button class="secondary-button" type="button" data-album-id="${escapeHtml(photo.albumId)}" data-home-unstar="${escapeHtml(photo.path)}">取消首页展示</button>
                </div>
              </div>
            </article>`
          )
          .join("")
      : '<p class="helper-text">还没有 Star 照片。回到相册管理，点击照片上的“设为首页”。</p>';
}

function starredHomepagePhotos() {
  return state.albums.flatMap((album) =>
    (album.previewPhotos || [])
      .filter((photo) => photo.isStar)
      .map((photo) => ({ ...photo, albumId: album.id, albumTitle: album.title || album.id }))
  );
}

function orderedHomepagePhotos() {
  const starred = starredHomepagePhotos();
  const bySrc = new Map(starred.map((photo) => [photo.src, photo]));
  const configured = (state.homepage.items || [])
    .map((item) => {
      const photo = bySrc.get(item.src);
      if (!photo) return null;
      bySrc.delete(item.src);
      return { ...photo, hidden: item.hidden === true };
    })
    .filter(Boolean);
  const remaining = [...bySrc.values()].map((photo) => ({ ...photo, hidden: false }));
  return [...configured, ...remaining];
}

function setHomepageItemsFromOrdered(ordered) {
  state.homepage.items = ordered.map((photo) => ({
    src: photo.src,
    hidden: photo.hidden === true
  }));
}

function moveHomepagePhoto(src, direction) {
  const ordered = orderedHomepagePhotos();
  const index = ordered.findIndex((photo) => photo.src === src);
  if (index < 0) return;
  if (direction === "top") {
    const [photo] = ordered.splice(index, 1);
    ordered.unshift(photo);
    setHomepageItemsFromOrdered(ordered);
    renderHomeManager();
    setStatus("已移到最前，点击“保存首页顺序”后生效。");
    return;
  }
  if (direction === "bottom") {
    const [photo] = ordered.splice(index, 1);
    ordered.push(photo);
    setHomepageItemsFromOrdered(ordered);
    renderHomeManager();
    setStatus("已移到最后，点击“保存首页顺序”后生效。");
    return;
  }
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ordered.length) return;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  setHomepageItemsFromOrdered(ordered);
  renderHomeManager();
  setStatus("首页顺序已调整，点击“保存首页顺序”后生效。");
}

function toggleHomepageHidden(src) {
  const ordered = orderedHomepagePhotos();
  const photo = ordered.find((item) => item.src === src);
  if (!photo) return;
  photo.hidden = !photo.hidden;
  setHomepageItemsFromOrdered(ordered);
  renderHomeManager();
  setStatus(photo.hidden ? "已暂时隐藏这张首页照片，保存首页顺序后生效。" : "已恢复这张首页照片，保存首页顺序后生效。");
}

async function saveHomepageOrder(options = {}) {
  const ordered = orderedHomepagePhotos();
  setHomepageItemsFromOrdered(ordered);
  const limit = Number.parseInt(elements.homeLimit.value, 10);
  state.homepage.limit = Number.isInteger(limit) && limit > 0 ? limit : 12;
  elements.homepageSaveButton.disabled = true;
  elements.homepageSaveButton.textContent = "保存中...";
  if (!options.silent) setStatus("正在保存首页顺序...");
  try {
    state.homepage = await putJson("/api/homepage", state.homepage);
    elements.homeLimit.value = state.homepage.limit || 12;
    renderHomeManager();
    if (!options.silent) setStatus("首页顺序已保存。点击“更新主站”后，主网页会按新顺序展示。");
  } catch (error) {
    setStatus(`首页顺序保存失败：${error.message}`);
  } finally {
    elements.homepageSaveButton.disabled = false;
    elements.homepageSaveButton.textContent = "保存首页顺序";
  }
}

async function saveAlbum(album) {
  const saved = await putJson(`/api/albums/${encodeURIComponent(album.id)}`, {
    title: album.title || "",
    description: album.description || "",
    featured: album.featured !== false,
    cover: album.cover || "",
    topics: album.topics || [],
    starredPhotos: (album.previewPhotos || []).filter((photo) => photo.isStar).map((photo) => photo.path)
  });
  state.albums = state.albums.map((item) => (item.id === saved.id ? saved : item));
  return saved;
}

function renderTopics(selectedTopics) {
  const selected = new Set(selectedTopics);
  elements.topicGrid.innerHTML = state.topics
    .map(
      (topic) => `<label class="topic-chip">
        <input type="checkbox" value="${escapeHtml(topic)}" ${selected.has(topic) ? "checked" : ""} />
        <span>${escapeHtml(topic)}</span>
      </label>`
    )
    .join("");
}

function selectedAlbum() {
  return state.albums.find((album) => album.id === state.selectedId);
}

function statusLabel(status) {
  return {
    "missing-config": "未生成配置",
    "needs-topics": "需要题材",
    "needs-description": "需要描述",
    configured: "已配置"
  }[status] || "待检查";
}

function setStatus(message) {
  elements.status.textContent = message;
}

function setSubmitButtonState(button, isSaving) {
  if (!button) return;
  button.disabled = isSaving;
  button.textContent = isSaving ? "保存中..." : "保存相册信息";
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function putJson(url, body) {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
