import { useEffect } from "react";
import PhotoImage from "./PhotoImage.jsx";
import { getLightboxNavigation } from "../lib/lightbox.js";

export default function PhotoLightbox({ photo, photos = [photo], onClose, onSelectPhoto }) {
  const { currentIndex, total, previous, next } = getLightboxNavigation(photos, photo);
  const canNavigate = total > 1;

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowLeft" && canNavigate) {
        onSelectPhoto(previous);
      }
      if (event.key === "ArrowRight" && canNavigate) {
        onSelectPhoto(next);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canNavigate, next, onClose, onSelectPhoto, previous]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={photo.title}>
      <button className="lightbox-backdrop" onClick={onClose} aria-label="关闭照片详情" />
      <article className="lightbox-panel">
        <button className="close-button" onClick={onClose}>
          关闭
        </button>
        {canNavigate ? (
          <>
            <button className="lightbox-nav lightbox-nav-previous" onClick={() => onSelectPhoto(previous)} aria-label="上一张照片">
              ‹
            </button>
            <button className="lightbox-nav lightbox-nav-next" onClick={() => onSelectPhoto(next)} aria-label="下一张照片">
              ›
            </button>
          </>
        ) : null}
        <PhotoImage photo={photo} />
        <div className="lightbox-copy">
          <p className="lightbox-count">{currentIndex + 1} / {total}</p>
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
