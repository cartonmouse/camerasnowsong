import PhotoImage from "./PhotoImage.jsx";

export default function PhotoGrid({ photos, onSelect }) {
  if (photos.length === 0) {
    return <p className="empty-state">这个分类下暂时还没有照片。</p>;
  }

  return (
    <div className="photo-grid">
      {photos.map((photo) => (
        <button
          key={photo.id}
          className="photo-card"
          onClick={() => onSelect(photo, photos)}
        >
          <PhotoImage photo={photo} />
          <span className="photo-meta">
            <span>{photo.title}</span>
            <span>{photo.year}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
