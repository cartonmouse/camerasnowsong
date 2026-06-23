import PhotoImage from "./PhotoImage.jsx";

export default function PhotoLightbox({ photo, onClose }) {
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={photo.title}>
      <button className="lightbox-backdrop" onClick={onClose} aria-label="关闭照片详情" />
      <article className="lightbox-panel">
        <button className="close-button" onClick={onClose}>
          关闭
        </button>
        <PhotoImage photo={photo} />
        <div className="lightbox-copy">
          <p className="eyebrow">{photo.albumTitle || photo.category}</p>
          <h2>{photo.title}</h2>
          {photo.topics?.length ? <p className="topic-list">{photo.topics.join(" / ")}</p> : null}
          {photo.description || photo.albumDescription ? <p>{photo.description || photo.albumDescription}</p> : null}
          <dl>
            <div>
              <dt>年份</dt>
              <dd>{photo.year || "未知"}</dd>
            </div>
            <div>
              <dt>地点</dt>
              <dd>{photo.location || "未标注"}</dd>
            </div>
          </dl>
        </div>
      </article>
    </div>
  );
}
