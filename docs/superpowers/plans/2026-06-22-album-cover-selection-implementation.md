# Album Cover Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the local admin page select an album cover and make synced site data mark that cover photo.

**Architecture:** Store `cover` as an album-level `album.json` field. The admin core exposes cover-aware preview objects, the admin UI saves the chosen cover path, and photo sync marks matching records with `isAlbumCover`.

**Tech Stack:** Node.js ESM scripts, plain HTML/CSS/JS admin page, React/Vite frontend, JSON album metadata.

---

### Task 1: Admin Core Cover Metadata

**Files:**
- Modify: `scripts/admin-core.test.mjs`
- Modify: `scripts/admin-core.mjs`

- [ ] Add a failing test that an album with `"cover": "IMG_0661.jpg"` returns `cover`, marks one preview as `isCover`, and preserves `cover` when saving metadata.
- [ ] Run `node scripts/admin-core.test.mjs` and confirm it fails before implementation.
- [ ] Update `readAlbum()` to return `cover` and preview objects `{ path, src, isCover }`.
- [ ] Update `saveAlbumMetadata()` to write `cover` from metadata while preserving `photos`.
- [ ] Run `npm.cmd run test:admin`.

### Task 2: Photo Sync Cover Records

**Files:**
- Modify: `scripts/photo-sync.test.mjs`
- Modify: `scripts/photo-sync.mjs`
- Modify: `src/lib/photos.test.js`
- Modify: `src/lib/photos.js`

- [ ] Add a failing test that a cover path in `album.json` produces a photo record with `isAlbumCover: true`.
- [ ] Add a failing test that `getFeaturedPhotos()` returns album covers before other featured photos.
- [ ] Run `npm.cmd run test:data` and confirm the new tests fail before implementation.
- [ ] Update album normalization and photo record creation to include cover matching.
- [ ] Update `getFeaturedPhotos()` to sort cover records before non-cover records while preserving relative order otherwise.
- [ ] Run `npm.cmd run test:data`.

### Task 3: Admin UI Cover Picker

**Files:**
- Modify: `admin/index.html`
- Modify: `admin/admin.css`
- Modify: `admin/admin.js`

- [ ] Add hidden form state for the selected cover path.
- [ ] Render preview photos as selectable buttons.
- [ ] Add a visible "当前封面" marker for the selected cover.
- [ ] Include `cover` in the album save request body.
- [ ] Run `npm.cmd run test:admin` and `npm.cmd run build`.

### Task 4: Sync to Real Project and Verify

**Files:**
- Copy changed files to `D:\3BUPT\mark'workshop\personal-photography-website-superpowers`.

- [ ] Copy modified files from the workspace copy into the real D drive project.
- [ ] Run `npm.cmd run test:admin` in the D drive project.
- [ ] Run `npm.cmd run test:data` in the D drive project.
- [ ] Run `npm.cmd run build` in the D drive project.
- [ ] Restart the admin service on port 4000 and verify `/admin` returns the cover picker UI.

