export function getLightboxNavigation(photos, photo) {
  const fallback = {
    currentIndex: 0,
    total: 1,
    previous: photo,
    next: photo
  };

  if (!photo || !Array.isArray(photos) || photos.length === 0) {
    return fallback;
  }

  const currentIndex = photos.findIndex((item) => item.id === photo.id);
  if (currentIndex < 0) {
    return fallback;
  }

  const total = photos.length;
  const previousIndex = (currentIndex - 1 + total) % total;
  const nextIndex = (currentIndex + 1) % total;

  return {
    currentIndex,
    total,
    previous: photos[previousIndex],
    next: photos[nextIndex]
  };
}
