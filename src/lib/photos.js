export const preferredTopics = ["风景", "人像", "Cosplay", "城市", "旅行", "舞台", "纪实", "日常"];

export function getTopics(photos) {
  const found = new Set();
  for (const photo of photos) {
    for (const topic of photo.topics || []) {
      if (topic) found.add(topic);
    }
  }

  const preferred = preferredTopics.filter((topic) => found.has(topic));
  const extras = [...found].filter((topic) => !preferredTopics.includes(topic)).sort((a, b) => a.localeCompare(b, "zh-CN"));
  return [...preferred, ...extras];
}

export function getAlbums(photos) {
  const albums = new Map();
  for (const photo of photos) {
    const id = photo.album || photo.category;
    const title = photo.albumTitle || photo.category || id;
    if (id && !albums.has(id)) {
      albums.set(id, { id, title });
    }
  }
  return [...albums.values()];
}

export function getFeaturedPhotos(photos) {
  const starred = photos.filter((photo) => photo.star && !photo.homeHidden);
  if (starred.length > 0) {
    const limit = photos.find((photo) => Number.isInteger(photo.homeLimit))?.homeLimit || 12;
    return starred
      .map((photo, index) => ({ photo, index }))
      .sort((a, b) => {
        const aOrder = Number.isInteger(a.photo.homeOrder) ? a.photo.homeOrder : Number.MAX_SAFE_INTEGER;
        const bOrder = Number.isInteger(b.photo.homeOrder) ? b.photo.homeOrder : Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.index - b.index;
      })
      .map((item) => item.photo)
      .slice(0, limit);
  }
  return photos.filter((photo) => photo.featured).slice(0, 12);
}

export function getPhotosByTopic(photos, topic) {
  if (!topic || topic === "all") {
    return photos;
  }
  return photos.filter((photo) => (photo.topics || []).includes(topic));
}

export function getPhotosByAlbum(photos, album) {
  if (!album || album === "all") {
    return photos;
  }
  return photos.filter((photo) => (photo.album || photo.category) === album);
}
