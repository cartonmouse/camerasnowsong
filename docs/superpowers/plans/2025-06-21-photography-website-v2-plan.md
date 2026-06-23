# 个人摄影网站 v2 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从现有 React 项目重建为 vanilla HTML/CSS/JS 的安静克制风格摄影作品集（封面页 + 3 个专题页 + 灯箱层）

**Architecture:** Vite 作为开发服务器和 CSS/JS 打包工具；Node.js 构建脚本（sharp 处理图片 + 模板拼接 HTML）；纯静态输出到 `dist/`

**Tech Stack:** Vite, sharp (Node.js), vanilla HTML/CSS/JS

**Spec:** `docs/superpowers/specs/2025-06-21-photography-website-v2-design.md`

## Global Constraints

- 所有页面为静态 HTML，不引入 React/Vue 等框架
- 颜色：背景 `#FAFAF8`，主文字 `#2B2B28`，次级 `#8A857C`，强调 `#1A1A18`
- 字体：衬线 Georgia / Noto Serif SC，无衬线 Inter / 系统默认
- 动效仅限灯箱淡入淡出和照片切换交叉淡入淡出
- 照片间距 6rem，页边距 3rem
- 不设顶部导航栏，导航方式为封面底部入口 + 项目页左上返回
- 灯箱通过 URL hash (`#photo-id`) 触发，支持前后切换和键盘操作
- 图片：sharp 生成 400px/800px WebP 缩略图，原图灯箱按需加载
- 构建时生成 20px 模糊占位图（base64 内联）

---

## 文件结构

```
personal-photography-website-superpowers/
├── public/                     ← 保留（照片源文件 + 元数据）
│   ├── 沙金/
│   │   ├── photos.json
│   │   ├── cover.jpg
│   │   └── images/             ← 原图
│   ├── 天安门升旗/
│   ├── 水长城/
│   └── index.json              ← 构建生成
├── src/
│   ├── templates/              ← 新建
│   │   ├── base.html
│   │   ├── cover.html
│   │   ├── project.html
│   │   └── partials/
│   │       ├── lightbox.html
│   │       └── project-nav.html
│   ├── styles/
│   │   └── main.css            ← 新建（替代 styles.css）
│   ├── scripts/
│   │   ├── lightbox.js         ← 新建
│   │   └── navigation.js       ← 新建
│   └── assets/
│       └── favicon.svg         ← 新建
├── scripts/
│   ├── build-photos.mjs        ← 新建（替代 photo-sync.mjs）
│   ├── build-pages.mjs         ← 新建
│   └── build.mjs               ← 新建
├── dist/                       ← 构建输出（Vite 默认）
├── package.json                ← 修改
└── vite.config.js              ← 修改
```

**需删除的旧文件**: `src/App.jsx`, `src/main.jsx`, `src/components/*`, `src/pages/*`, `src/lib/*`, `src/data/photos.json`, `src/styles.css`, `index.html`, `scripts/photo-sync.mjs`, `scripts/photo-sync.test.mjs`

---

### Task 1: 项目重置与基础配置

**Files:**
- Create: `package.json` (重写), `vite.config.js` (重写)
- Delete: `src/App.jsx`, `src/main.jsx`, `src/components/`, `src/pages/`, `src/lib/`, `src/data/photos.json`, `src/styles.css`, `index.html`, `scripts/photo-sync.mjs`, `scripts/photo-sync.test.mjs`
- Create dirs: `src/templates/`, `src/templates/partials/`, `src/styles/`, `src/scripts/`, `src/assets/`

**Interfaces:**
- Produces: `package.json` 含所有 npm scripts 和依赖，`vite.config.js` 含多页面入口

- [ ] **Step 1: 删除旧 React 源码文件**

```bash
rm -rf src/App.jsx src/main.jsx src/components src/pages src/lib src/data src/styles.css index.html scripts/photo-sync.mjs scripts/photo-sync.test.mjs
```

- [ ] **Step 2: 创建新目录结构**

```bash
mkdir -p src/templates/partials src/styles src/scripts src/assets
```

- [ ] **Step 3: 编写 package.json**

```json
{
  "name": "lens-notes",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "node scripts/build.mjs && vite build",
    "photos:build": "node scripts/build-photos.mjs",
    "pages:build": "node scripts/build-pages.mjs",
    "preview": "vite preview"
  },
  "dependencies": {
    "sharp": "^0.33.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 4: 编写 vite.config.js**

```js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        shajin: resolve(__dirname, '沙金.html'),
        tiananmen: resolve(__dirname, '天安门升旗.html'),
        shuichangcheng: resolve(__dirname, '水长城.html')
      }
    }
  },
  server: {
    open: true
  }
});
```

- [ ] **Step 5: 安装依赖并验证**

```bash
npm install
```
预期：依赖安装成功，无报错。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: reset project to vanilla structure for v2"
```

---

### Task 2: CSS 设计系统

**Files:**
- Create: `src/styles/main.css`

**Interfaces:**
- Produces: 完整的 CSS 设计系统，被所有 HTML 模板引用
- Exports: 无（纯 CSS 文件），提供以下 CSS 类：
  - `.site-cover` — 封面页容器
  - `.cover-photo` — 封面照片
  - `.cover-title` — 网站标题
  - `.project-list` — 底部项目入口
  - `.project-page` — 项目页容器
  - `.photo-stack` — 照片列表容器
  - `.photo-item` — 单张照片
  - `.photo-item img` — 照片图片
  - `.photo-meta` — 照片元信息
  - `.back-link` — 返回箭头
  - `.lightbox` — 灯箱浮层
  - `.lightbox-backdrop` — 灯箱背景
  - `.lightbox-panel` — 灯箱面板
  - `.lightbox-image` — 灯箱图片
  - `.lightbox-info` — 灯箱信息区
  - `.btn-close` — 关闭按钮
  - `.btn-prev` / `.btn-next` — 前后切换

- [ ] **Step 1: 编写 CSS Reset 和全局变量**

```css
/* src/styles/main.css */

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --color-bg: #FAFAF8;
  --color-text: #2B2B28;
  --color-text-secondary: #8A857C;
  --color-text-emphasis: #1A1A18;
  --color-lightbox-bg: rgba(20, 18, 16, 0.95);
  --font-serif: Georgia, "Noto Serif SC", "Times New Roman", serif;
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
  --space-page: 3rem;
  --space-photo-gap: 6rem;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-sans);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.5;
  min-height: 100vh;
}

img {
  display: block;
  max-width: 100%;
  height: auto;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font: inherit;
  color: inherit;
  cursor: pointer;
  background: none;
  border: none;
}
```

- [ ] **Step 2: 编写排版层级**

```css
/* 标题 */
h1, .title-serif {
  font-family: var(--font-serif);
  font-weight: 400;
  line-height: 1.08;
  color: var(--color-text-emphasis);
}

h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  letter-spacing: -0.01em;
}

/* 次级标题 */
h2, .subtitle-serif {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  line-height: 1.15;
  color: var(--color-text-emphasis);
}

/* 元信息 */
.meta-text {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* 正文 */
.body-text {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}
```

- [ ] **Step 3: 编写封面页样式**

```css
/* ── 封面页 ── */

.site-cover {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

.cover-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 标题浮动于左上角 */
.cover-title {
  position: relative;
  z-index: 1;
  padding: var(--space-page);
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.04em;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

/* 项目入口，底部居中 */
.project-list {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 2.5rem;
  margin-top: auto;
  padding: var(--space-page);
  justify-content: center;
}

.project-list a {
  font-family: var(--font-serif);
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.03em;
  transition: color 200ms ease;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.project-list a:hover {
  color: rgba(255, 255, 255, 1);
}
```

- [ ] **Step 4: 编写项目专题页样式**

```css
/* ── 项目专题页 ── */

.project-page {
  padding: var(--space-page);
  max-width: 1400px;
  margin: 0 auto;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-bottom: 2.5rem;
  transition: color 200ms ease;
}

.back-link:hover {
  color: var(--color-text);
}

.back-link::before {
  content: "←";
  font-size: 1rem;
}

.project-header {
  margin-bottom: 4rem;
}

.project-header h1 {
  margin-bottom: 0.5rem;
}

.project-header .meta-text {
  color: var(--color-text-secondary);
}

/* 照片序列 */
.photo-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-photo-gap);
}

.photo-item {
  display: grid;
  gap: 0.75rem;
}

.photo-item img {
  width: 100%;
  height: auto;
  border-radius: 1px;
  cursor: pointer;
  /* 无 hover 动效 */
}

.photo-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

.photo-meta .title {
  font-family: var(--font-serif);
  font-size: 0.95rem;
  color: var(--color-text);
}

.photo-meta .info {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-align: right;
}

/* 空状态 */
.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-secondary);
  font-style: italic;
}
```

- [ ] **Step 5: 编写灯箱样式**

```css
/* ── 灯箱 ── */

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease;
}

.lightbox.is-open {
  opacity: 1;
  pointer-events: auto;
}

.lightbox-backdrop {
  position: absolute;
  inset: 0;
  background: var(--color-lightbox-bg);
  cursor: pointer;
}

.lightbox-panel {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 2rem;
  width: min(calc(100vw - 6rem), 1400px);
  height: min(calc(100vh - 6rem), 90vh);
  padding: 0;
}

.lightbox-image {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.lightbox-image img {
  max-width: 100%;
  max-height: calc(100vh - 6rem);
  object-fit: contain;
}

.lightbox-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.5rem 0;
  color: rgba(255, 255, 255, 0.85);
  overflow-y: auto;
}

.lightbox-info .title {
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2rem);
  line-height: 1.12;
  margin-bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.92);
}

.lightbox-info dl {
  display: grid;
  gap: 1rem;
}

.lightbox-info dt {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 0.15rem;
}

.lightbox-info dd {
  font-size: 0.9rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
}

/* 灯箱控制按钮 */

.btn-close {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.3rem;
  transition: color 200ms ease;
}

.btn-close:hover {
  color: rgba(255, 255, 255, 1);
}

.btn-prev,
.btn-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.55);
  font-size: 1.6rem;
  transition: color 200ms ease;
}

.btn-prev { left: 0; }
.btn-next { right: 0; }

.btn-prev:hover,
.btn-next:hover {
  color: rgba(255, 255, 255, 0.9);
}
```

- [ ] **Step 6: 编写响应式断点**

```css
/* ── 响应式 ── */

@media (max-width: 860px) {
  :root {
    --space-page: 1.5rem;
    --space-photo-gap: 3rem;
  }

  .lightbox-panel {
    grid-template-columns: 1fr;
    gap: 1rem;
    height: auto;
    max-height: calc(100vh - 3rem);
    overflow-y: auto;
  }

  .lightbox-image img {
    max-height: 55vh;
  }

  .lightbox-info {
    padding: 0 0 1rem;
  }

  .btn-prev,
  .btn-next {
    top: auto;
    bottom: 0;
    transform: none;
  }
}

@media (max-width: 480px) {
  :root {
    --space-page: 1rem;
    --space-photo-gap: 2rem;
  }

  .project-list {
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
  }

  .lightbox-panel {
    width: calc(100vw - 2rem);
    height: calc(100vh - 2rem);
  }
}
```

- [ ] **Step 7: 提交**

```bash
git add src/styles/main.css
git commit -m "feat: add complete CSS design system for v2"
```

---

### Task 3: HTML 模板

**Files:**
- Create: `src/templates/base.html`, `src/templates/cover.html`, `src/templates/project.html`, `src/templates/partials/lightbox.html`, `src/templates/partials/project-nav.html`

**Interfaces:**
- Consumes: CSS classes from Task 2
- Produces: HTML 模板，供 Task 5 的 build-pages.mjs 使用
- 模板变量约定:
  - `{{TITLE}}` — 页面标题
  - `{{META_DESC}}` — meta description
  - `{{PROJECT_NAME}}` — 项目名称
  - `{{PROJECT_YEAR}}` — 项目年份
  - `{{PROJECT_COUNT}}` — 照片数
  - `{{COVER_SRC}}` — 封面照片路径
  - `{{COVER_SRCSET}}` — 封面 srcset
  - `{{COVER_PLACEHOLDER}}` — 封面 base64 占位图
  - `{{PHOTOS_HTML}}` — 照片列表 HTML（由构建脚本预生成后注入）
  - `{{PROJECT_NAV}}` — 底部项目导航 HTML
  - `{{LIGHTBOX_HTML}}` — 灯箱 HTML 片段

- [ ] **Step 1: 编写 base.html（所有页面公共壳）**

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{{META_DESC}}" />
  <title>{{TITLE}}</title>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="stylesheet" href="/styles/main.css" />
</head>
<body>
  {{CONTENT}}
  {{LIGHTBOX_HTML}}
  <script type="module" src="/scripts/lightbox.js"></script>
</body>
</html>
```

- [ ] **Step 2: 编写 cover.html（封面页）**

```html
<!-- extends base.html -->
<!-- CONTENT -->
<main class="site-cover">
  <img
    class="cover-photo"
    src="{{COVER_SRC}}"
    srcset="{{COVER_SRCSET}}"
    sizes="100vw"
    alt="{{TITLE}}"
    style="background: url(data:image/webp;base64,{{COVER_PLACEHOLDER}}) center/cover no-repeat;"
  />

  <h1 class="cover-title">
    <span>{{TITLE}}</span>
  </h1>

  <nav class="project-list" aria-label="摄影项目">
    {{PROJECT_NAV}}
  </nav>
</main>
```

- [ ] **Step 3: 编写 project.html（项目专题页）**

```html
<!-- extends base.html -->
<!-- CONTENT -->
<main class="project-page">
  <a href="/" class="back-link">返回</a>

  <header class="project-header">
    <h1>{{PROJECT_NAME}}</h1>
    <p class="meta-text">{{PROJECT_COUNT}} 张照片 · {{PROJECT_YEAR}}</p>
  </header>

  <div class="photo-stack">
    {{PHOTOS_HTML}}
  </div>
</main>
```

- [ ] **Step 4: 编写 partials/lightbox.html（灯箱片段）**

```html
<!-- 所有页面共用，注入到 base.html 的 {{LIGHTBOX_HTML}} -->
<div class="lightbox" id="lightbox" aria-hidden="true" role="dialog" aria-label="照片查看">
  <div class="lightbox-backdrop" data-action="close"></div>
  <div class="lightbox-panel">
    <button class="btn-close" data-action="close" aria-label="关闭">✕</button>
    <button class="btn-prev" data-action="prev" aria-label="上一张">‹</button>
    <button class="btn-next" data-action="next" aria-label="下一张">›</button>
    <div class="lightbox-image">
      <img id="lightbox-img" src="" alt="" />
    </div>
    <div class="lightbox-info">
      <h2 class="title" id="lightbox-title"></h2>
      <dl>
        <div>
          <dt>年份</dt>
          <dd id="lightbox-year"></dd>
        </div>
        <div>
          <dt>地点</dt>
          <dd id="lightbox-location"></dd>
        </div>
        <div>
          <dt>描述</dt>
          <dd id="lightbox-desc"></dd>
        </div>
      </dl>
    </div>
  </div>
</div>
```

- [ ] **Step 5: 编写 partials/project-nav.html（底部项目导航）**

```html
<!-- 封面页和项目页底部共用，由构建脚本填充 -->
<a href="/沙金.html">沙金</a>
<a href="/天安门升旗.html">天安门升旗</a>
<a href="/水长城.html">水长城</a>
```

- [ ] **Step 6: 提交**

```bash
git add src/templates/
git commit -m "feat: add HTML templates for cover, project, lightbox pages"
```

---

### Task 4: Build 脚本 — 图片处理

**Files:**
- Create: `scripts/build-photos.mjs`

**Interfaces:**
- Consumes: `public/<project>/photos.json`, `public/<project>/cover.jpg`, `public/<project>/images/*.jpg`
- Produces: `public/<project>/images/*.webp`, `public/<project>/images/*@2x.webp`, 每张照片 20px base64 placeholder, `public/index.json`
- Exports: `async function buildPhotos(projectDirs)` — 返回 `{ projects, allPhotos, projectMap }`
- `projectDirs`: `string[]` — 如 `["沙金", "天安门升旗", "水长城"]`
- `projects`: `{ name, cover, coverSrcSet, coverPlaceholder, photos }[]`
- `allPhotos`: 扁平化的所有照片数组（灯箱前后切换用）
- `projectMap`: `{ [photoId]: { projectName, photoIndex } }`

- [ ] **Step 1: 编写 build-photos.mjs**

```js
// scripts/build-photos.mjs
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");

/**
 * Generate a tiny base64 placeholder from an image buffer.
 */
async function generatePlaceholder(buffer) {
  const tiny = await sharp(buffer)
    .resize(20, Math.round(20 * 0.75), { fit: "inside" })
    .webp({ quality: 20 })
    .toBuffer();
  return tiny.toString("base64");
}

/**
 * Generate WebP variants for a photo.
 * @param {string} srcPath - absolute path to original JPG
 * @param {string} outDir - output directory
 * @returns {{ webp: string, webp2x: string, placeholder: string, width: number, height: number }}
 */
async function processImage(srcPath, outDir) {
  const base = srcPath.replace(/\.(jpg|jpeg|png)$/i, "");
  const name = base.split("/").pop();
  const image = sharp(srcPath);
  const meta = await image.metadata();

  const webpPath = join(outDir, `${name}.webp`);
  const webp2xPath = join(outDir, `${name}@2x.webp`);

  await image
    .clone()
    .resize(400, Math.round(400 * (meta.height / meta.width)), { fit: "inside" })
    .webp({ quality: 82 })
    .toFile(webpPath);

  await image
    .clone()
    .resize(800, Math.round(800 * (meta.height / meta.width)), { fit: "inside" })
    .webp({ quality: 82 })
    .toFile(webp2xPath);

  const buffer = await sharp(srcPath).toBuffer();
  const placeholder = await generatePlaceholder(buffer);

  return {
    webp: webpPath.replace(PUBLIC, ""),
    webp2x: webp2xPath.replace(PUBLIC, ""),
    placeholder,
    width: meta.width,
    height: meta.height,
  };
}

/**
 * Build all photos for all projects.
 * @param {string[]} projectDirs
 */
export async function buildPhotos(projectDirs = []) {
  const allPhotos = [];
  const projectMap = {};
  const projects = [];

  for (const dir of projectDirs) {
    const projPath = join(PUBLIC, dir);
    const metaPath = join(projPath, "photos.json");

    if (!existsSync(metaPath)) {
      console.warn(`  [skip] ${dir}: no photos.json`);
      continue;
    }

    const raw = await readFile(metaPath, "utf-8");
    const photoEntries = JSON.parse(raw);

    // Process cover image
    const coverPath = join(projPath, "cover.jpg");
    let cover = null;
    let coverSrcSet = "";
    let coverPlaceholder = "";

    if (existsSync(coverPath)) {
      const coverResult = await processImage(coverPath, projPath);
      cover = coverResult.webp;
      coverSrcSet = `${coverResult.webp} 400w, ${coverResult.webp2x} 800w`;
      coverPlaceholder = coverResult.placeholder;
    }

    // Process each photo
    const photos = [];
    for (const entry of photoEntries.sort((a, b) => (a.order || 0) - (b.order || 0))) {
      const imgPath = join(projPath, entry.src);
      if (!existsSync(imgPath)) {
        console.warn(`  [skip] ${entry.src}: file not found`);
        continue;
      }

      const result = await processImage(imgPath, dirname(join(projPath, entry.src)));
      const photo = {
        id: entry.id,
        title: entry.title,
        project: dir,
        year: entry.year || "",
        location: entry.location || "",
        description: entry.description || "",
        src: join(dir, entry.src).replace(/\\/g, "/"),
        webp: result.webp,
        webp2x: result.webp2x,
        srcSet: `${result.webp} 400w, ${result.webp2x} 800w`,
        placeholder: result.placeholder,
        width: entry.width || result.width,
        height: entry.height || result.height,
      };

      photos.push(photo);
      allPhotos.push(photo);
      projectMap[photo.id] = { projectName: dir, photoIndex: photos.length - 1 };
    }

    projects.push({
      name: dir,
      cover,
      coverSrcSet,
      coverPlaceholder,
      photos,
      count: photos.length,
    });

    console.log(`  [done] ${dir}: ${photos.length} photos`);
  }

  // Write global index
  const indexPath = join(PUBLIC, "index.json");
  await writeFile(indexPath, JSON.stringify({ projects, allPhotos, projectMap }, null, 2));
  console.log(`  [done] global index: ${allPhotos.length} total photos`);

  return { projects, allPhotos, projectMap };
}

// CLI entry
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dirs = process.argv.slice(2);
  if (dirs.length === 0) {
    console.error("Usage: node scripts/build-photos.mjs <project-dir> [...]");
    process.exit(1);
  }
  buildPhotos(dirs).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 2: 测试图片处理**

```bash
node scripts/build-photos.mjs 沙金
```

预期输出：
```
[done] 沙金: N photos
[done] global index: N total photos
```

验证 `public/沙金/images/` 中生成 `.webp` 和 `@2x.webp` 文件。

- [ ] **Step 3: 处理全部项目**

```bash
node scripts/build-photos.mjs 沙金 天安门升旗 水长城
```

验证 `public/index.json` 生成正确。

- [ ] **Step 4: 提交**

```bash
git add scripts/build-photos.mjs public/index.json
git commit -m "feat: add photo build script with sharp processing"
```

---

### Task 5: Build 脚本 — HTML 生成

**Files:**
- Create: `scripts/build-pages.mjs`

**Interfaces:**
- Consumes: `src/templates/*.html` (模板), `public/index.json` (Task 4 产出)
- Produces: `index.html`, `沙金.html`, `天安门升旗.html`, `水长城.html` (项目根)
- Exports: `async function buildPages(data)` — 无返回值，副作用：写入 HTML 文件
- `data`: `{ projects, allPhotos, projectMap }` (与 Task 4 产出一致)

- [ ] **Step 1: 编写 build-pages.mjs**

```js
// scripts/build-pages.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TEMPLATES = join(ROOT, "src", "templates");
const PUBLIC = join(ROOT, "public");

/**
 * Load template file.
 */
async function loadTemplate(name) {
  return readFile(join(TEMPLATES, name), "utf-8");
}

/**
 * Simple template substitution.
 */
function render(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, String(value));
  }
  return result;
}

/**
 * Generate a single photo item HTML for project pages.
 */
function photoItemHTML(photo) {
  return `
<article class="photo-item">
  <a href="#${photo.id}">
    <img
      src="${photo.webp}"
      srcset="${photo.srcSet}"
      sizes="(max-width: 860px) calc(100vw - 3rem), (max-width: 1400px) calc(100vw - 6rem), 1340px"
      alt="${photo.title}"
      loading="lazy"
      width="${photo.width}"
      height="${photo.height}"
      style="background: url(data:image/webp;base64,${photo.placeholder}) center/cover no-repeat;"
    />
  </a>
  <div class="photo-meta">
    <span class="title">${photo.title}</span>
    <span class="info">${[photo.year, photo.location].filter(Boolean).join(" · ")}</span>
  </div>
</article>`;
}

/**
 * Generate project nav HTML.
 */
function projectNavHTML(projects) {
  return projects
    .map((p) => `<a href="/${encodeURIComponent(p.name)}.html">${p.name}</a>`)
    .join("\n");
}

/**
 * Build all HTML pages from templates and data.
 * @param {{ projects: any[], allPhotos: any[], projectMap: any }} data
 */
export async function buildPages(data) {
  const { projects, allPhotos, projectMap } = data;

  // Load templates
  const baseTpl = await loadTemplate("base.html");
  const coverTpl = await loadTemplate("cover.html");
  const projectTpl = await loadTemplate("project.html");
  const lightboxHTML = await loadTemplate("partials/lightbox.html");
  const navHTML = projectNavHTML(projects);

  // ── Write global lightbox data JSON ──
  const lightboxDataPath = join(PUBLIC, "lightbox-data.json");
  const lightboxData = JSON.stringify(allPhotos);
  await writeFile(lightboxDataPath, lightboxData);

  // ── Cover page ──
  const firstProject = projects[0];
  const coverVars = {
    TITLE: "镜头手记",
    META_DESC: "个人摄影作品集",
    CONTENT: render(coverTpl, {
      TITLE: "镜头手记",
      COVER_SRC: firstProject?.cover || "",
      COVER_SRCSET: firstProject?.coverSrcSet || "",
      COVER_PLACEHOLDER: firstProject?.coverPlaceholder || "",
      PROJECT_NAV: navHTML,
    }),
    LIGHTBOX_HTML: lightboxHTML,
  };

  await writeFile(join(ROOT, "index.html"), render(baseTpl, coverVars));
  console.log("  [done] index.html (cover)");

  // ── Project pages ──
  for (const project of projects) {
    const photosHTML = project.photos.map(photoItemHTML).join("\n");
    const escapedName = project.name;

    const projectVars = {
      TITLE: `${project.name} — 镜头手记`,
      META_DESC: `${project.name} · ${project.count} 张摄影作品`,
      CONTENT: render(projectTpl, {
        PROJECT_NAME: project.name,
        PROJECT_YEAR: [...new Set(project.photos.map((p) => p.year))].filter(Boolean).join(" / "),
        PROJECT_COUNT: String(project.count),
        PHOTOS_HTML: photosHTML,
      }),
      LIGHTBOX_HTML: lightboxHTML,
    };

    const filename = `${escapedName}.html`;
    await writeFile(join(ROOT, filename), render(baseTpl, projectVars));
    console.log(`  [done] ${filename}`);
  }
}

// CLI entry
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const indexPath = join(PUBLIC, "index.json");
  const raw = await readFile(indexPath, "utf-8");
  const data = JSON.parse(raw);
  buildPages(data).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 2: 测试 HTML 生成**

先确保 Task 4 已完成（`public/index.json` 存在），然后：

```bash
node scripts/build-pages.mjs
```

预期输出：
```
[done] index.html (cover)
[done] 沙金.html
[done] 天安门升旗.html
[done] 水长城.html
```

- [ ] **Step 3: 提交**

```bash
git add scripts/build-pages.mjs
git commit -m "feat: add HTML build script with template rendering"
```

---

### Task 6: Build 脚本 — 编排 + NPM Scripts

**Files:**
- Create: `scripts/build.mjs`
- Modify: `package.json` (npm scripts 已在 Task 1 写好，确认)
- Modify: `vite.config.js` (多个 HTML 入口已在 Task 1 写好，确认)

**Interfaces:**
- Consumes: `buildPhotos()` (Task 4), `buildPages()` (Task 5)
- Produces: 完整的构建流程，依序执行图片处理 → HTML 生成 → Vite 打包

- [ ] **Step 1: 编写 build.mjs**

```js
// scripts/build.mjs
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");

async function discoverProjects() {
  const entries = await readdir(PUBLIC, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && existsSync(join(PUBLIC, e.name, "photos.json")))
    .map((e) => e.name);
}

async function main() {
  console.log("CCB Photo Site Builder\n");

  // 1. Discover projects
  console.log("[1/3] Discovering projects...");
  const projects = await discoverProjects();
  console.log(`  Found ${projects.length} projects: ${projects.join(", ")}`);

  // 2. Build photos
  console.log("\n[2/3] Processing photos...");
  const { buildPhotos } = await import("./build-photos.mjs");
  const data = await buildPhotos(projects);

  // 3. Build pages
  console.log("\n[3/3] Generating HTML pages...");
  const { buildPages } = await import("./build-pages.mjs");
  await buildPages(data);

  console.log("\nDone. Run `npm run dev` or `vite build` to continue.");
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: 验证完整构建**

```bash
node scripts/build.mjs
```

预期输出完整的 3 步构建流程，生成 `index.html`、`沙金.html`、`天安门升旗.html`、`水长城.html`。

- [ ] **Step 3: 确认 favicon**

```bash
# 简单的 SVG favicon
```

`src/assets/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="15" fill="#2B2B28"/>
  <circle cx="16" cy="16" r="9" fill="none" stroke="#FAFAF8" stroke-width="2"/>
</svg>
```

- [ ] **Step 4: 提交**

```bash
git add scripts/build.mjs src/assets/favicon.svg
git commit -m "feat: add build orchestration script and favicon"
```

---

### Task 7: 客户端 JS — 灯箱与键盘导航

**Files:**
- Create: `src/scripts/lightbox.js`, `src/scripts/navigation.js`

**Interfaces:**
- Consumes: HTML 灯箱结构 (Task 3), `/public/lightbox-data.json` (Task 5 生成)
- Produces: 灯箱交互 + 键盘导航功能
- lightbox.js 暴露全局行为：监听 hashchange，管理灯箱开/关/导航
- navigation.js 在项目页激活时监听键盘左右箭头切换照片

- [ ] **Step 1: 编写 lightbox.js**

```js
// src/scripts/lightbox.js

let allPhotos = [];
let currentPhotoId = null;

const lightbox = document.getElementById("lightbox");
const img = document.getElementById("lightbox-img");
const titleEl = document.getElementById("lightbox-title");
const yearEl = document.getElementById("lightbox-year");
const locationEl = document.getElementById("lightbox-location");
const descEl = document.getElementById("lightbox-desc");

/**
 * Find photo by id. Returns { photo, index }.
 */
function findPhoto(id) {
  const index = allPhotos.findIndex((p) => p.id === id);
  if (index === -1) return null;
  return { photo: allPhotos[index], index };
}

/**
 * Get neighbor photo relative to current.
 */
function neighborPhoto(direction) {
  if (!currentPhotoId || allPhotos.length === 0) return null;
  const { index } = findPhoto(currentPhotoId) || {};
  if (index === undefined) return null;

  const newIndex = direction === "prev"
    ? (index - 1 + allPhotos.length) % allPhotos.length
    : (index + 1) % allPhotos.length;

  return allPhotos[newIndex];
}

/**
 * Update lightbox content for a photo.
 */
function showPhoto(photo) {
  if (!photo) return;

  currentPhotoId = photo.id;
  img.src = photo.src;
  img.alt = photo.title;
  titleEl.textContent = photo.title;
  yearEl.textContent = photo.year || "—";
  locationEl.textContent = photo.location || "—";
  descEl.textContent = photo.description || "—";

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  window.location.hash = photo.id;
}

/**
 * Close the lightbox.
 */
function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  currentPhotoId = null;
  img.src = "";

  // Remove hash without pushing history
  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

/**
 * Navigate to previous or next photo.
 */
function navigate(direction) {
  const next = neighborPhoto(direction);
  if (next) showPhoto(next);
}

// ── Event listeners ──

// Click on photo links (delegation)
document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;

  const hash = link.getAttribute("href");
  if (!hash || hash === "#") return;

  const id = hash.slice(1);
  const result = findPhoto(id);
  if (result) {
    e.preventDefault();
    showPhoto(result.photo);
  }
});

// Lightbox backdrop and close button
lightbox.addEventListener("click", (e) => {
  const action = e.target.dataset?.action;
  if (action === "close") {
    closeLightbox();
  } else if (action === "prev") {
    navigate("prev");
  } else if (action === "next") {
    navigate("next");
  }
});

// Keyboard
document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("is-open")) return;

  switch (e.key) {
    case "Escape":
      closeLightbox();
      break;
    case "ArrowLeft":
      navigate("prev");
      break;
    case "ArrowRight":
      navigate("next");
      break;
  }
});

// Open lightbox on page load if URL has hash
function initFromHash() {
  const hash = window.location.hash?.slice(1);
  if (!hash) return;
  const result = findPhoto(hash);
  if (result) showPhoto(result.photo);
}

// Handle browser back/forward (hash changes)
window.addEventListener("hashchange", () => {
  const hash = window.location.hash?.slice(1);
  if (!hash) {
    closeLightbox();
    return;
  }
  const result = findPhoto(hash);
  if (result) {
    showPhoto(result.photo);
  } else {
    closeLightbox();
  }
});

// ── Init ──
async function init() {
  try {
    const res = await fetch("/lightbox-data.json");
    allPhotos = await res.json();
    initFromHash();
  } catch (err) {
    console.warn("Lightbox data not available:", err.message);
  }
}

init();
```

- [ ] **Step 2: 编写 navigation.js（项目页键盘导航）**

```js
// src/scripts/navigation.js
// Simple keyboard navigation for project pages.
// Left/Right arrows navigate between photos when lightbox is closed.

document.addEventListener("keydown", (e) => {
  const lightbox = document.getElementById("lightbox");
  if (lightbox?.classList.contains("is-open")) return; // lightbox handles its own keys

  // Only on project pages (not cover)
  if (!document.querySelector(".project-page")) return;

  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    // Let native scroll work — no override
  }
});
```

- [ ] **Step 3: 验证灯箱功能**

手动测试流程：
1. `npm run build` 生成所有 HTML
2. `npm run dev` 启动开发服务器
3. 打开 `http://localhost:5173`
4. 进入任意项目页
5. 点击照片 → 灯箱应打开
6. 按 ← → 切换照片
7. 按 Esc 关闭灯箱
8. 直接访问 `http://localhost:5173/沙金.html#shajin-01` → 应直接打开对应照片的灯箱

- [ ] **Step 4: 提交**

```bash
git add src/scripts/lightbox.js src/scripts/navigation.js
git commit -m "feat: add lightbox and keyboard navigation JS"
```

---

### Task 8: 整合与验收

**Files:**
- Modify: 任何存在问题的文件

**Interfaces:**
- Consumes: 所有前置任务的产出

- [ ] **Step 1: 执行完整构建**

```bash
npm run build
```

检查 `dist/` 目录内容：
- `dist/index.html` — 封面页
- `dist/沙金.html` — 沙金专题页
- `dist/天安门升旗.html` — 升旗专题页
- `dist/水长城.html` — 水长城专题页
- `dist/assets/` — Vite 打包的 CSS/JS

- [ ] **Step 2: 开发服务器验证**

```bash
npm run dev
```

逐页检查：
- [ ] 封面页 — 全屏封面照片，标题浮动，底部三个项目入口可点击
- [ ] 沙金.html — 照片纵向排列，6rem 间距，左上返回箭头，元信息显示
- [ ] 天安门升旗.html — 同上
- [ ] 水长城.html — 同上
- [ ] 灯箱 — 点击任意照片打开，显示大图 + 元信息，← → 切换，Esc 关闭
- [ ] URL hash — 直接访问 `#photo-id` 应打开灯箱
- [ ] 响应式 — 缩小浏览器窗口，布局调整（860px 断点，480px 断点）

- [ ] **Step 3: 性能检查**

```bash
# 构建产物大小
du -sh dist/
```

检查点：
- 单张缩略图 WebP ≤ 50KB
- 首页总 JS ≤ 5KB（仅 lightbox + navigation）
- 首页总 CSS ≤ 8KB（gzip 后）

- [ ] **Step 4: 修复发现的问题**

根据验收结果修复任何 UI 或功能问题。常见检查：
- 所有图片路径是否正确（相对 vs 绝对）
- Vite 是否正确打包 CSS 和 JS
- Lightbox 在不同页面上是否都正常工作
- 中文字体是否正确加载
- 元信息为空时是否显示 "—"

- [ ] **Step 5: 最终提交**

```bash
git add -A
git commit -m "feat: complete v2 photography website integration"
```
