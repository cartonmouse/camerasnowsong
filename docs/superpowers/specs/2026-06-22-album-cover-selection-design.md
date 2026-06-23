# Album Cover Selection Design

## Goal

Add a local-only album cover selection workflow so the user can choose the strongest representative photo for each album from the admin page.

## Scope

This feature adds one album-level field:

```json
{
  "cover": "IMG_0726-已增强-NR.jpg"
}
```

The field is stored in each album's `album.json`. It is a path relative to that album folder. If the photo is inside a subfolder, the value uses forward slashes:

```json
{
  "cover": "终稿/IMG_1885-已增强-降噪.jpg"
}
```

## Admin Experience

The admin page will show album preview photos as selectable cover candidates. The current cover is visually marked. Clicking a candidate sets `cover` in the form state. Clicking "保存相册信息" saves `cover` together with title, topics, description, and featured.

The existing "扫描" and "更新主站" buttons keep their current responsibilities.

## Data Flow

1. Admin reads album data from `scripts/admin-core.mjs`.
2. `readAlbum()` returns `cover` and preview photo objects containing `path`, `src`, and `isCover`.
3. `saveAlbumMetadata()` writes `cover` into `album.json` and preserves the existing `photos` object.
4. `photo-sync.mjs` reads `cover` and marks the matching generated photo record with `isAlbumCover: true`.
5. `getFeaturedPhotos()` sorts album covers before other featured photos, so the home page can prefer chosen covers while keeping the existing photo grid behavior.

## Non-Goals

- No photo upload.
- No drag sorting.
- No crop/focal-point editor.
- No full single-photo metadata editor.
- No database.

## Testing

Tests should verify:

- Admin core reads and saves `cover`.
- Saving album metadata preserves `photos`.
- Photo sync marks the matching photo as `isAlbumCover`.
- Featured photos prioritize cover records.
- Existing admin, data, layout, and build commands still pass.

