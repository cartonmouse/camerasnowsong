import { useMemo, useState } from "react";
import CategoryFilter from "../components/CategoryFilter.jsx";
import PhotoGrid from "../components/PhotoGrid.jsx";
import { getAlbums, getPhotosByAlbum, getPhotosByTopic, getTopics } from "../lib/photos.js";

export default function Portfolio({ photos, onSelectPhoto }) {
  const [view, setView] = useState("topic");
  const [filter, setFilter] = useState("all");
  const topics = useMemo(() => getTopics(photos).map((topic) => ({ id: topic, title: topic })), [photos]);
  const albums = useMemo(() => getAlbums(photos), [photos]);
  const filters = view === "topic" ? topics : albums;
  const visiblePhotos = useMemo(
    () => (view === "topic" ? getPhotosByTopic(photos, filter) : getPhotosByAlbum(photos, filter)),
    [photos, view, filter]
  );

  function changeView(nextView) {
    setView(nextView);
    setFilter("all");
  }

  return (
    <main className="section-shell page-top">
      <div className="section-heading portfolio-heading">
        <p className="eyebrow">作品</p>
        <h1>按题材或相册浏览</h1>
        <p>题材适合快速进入兴趣方向，相册适合保留一次拍摄的完整语境。</p>
      </div>
      <div className="view-toggle" aria-label="作品浏览方式">
        <button className={view === "topic" ? "active" : ""} onClick={() => changeView("topic")}>
          按题材
        </button>
        <button className={view === "album" ? "active" : ""} onClick={() => changeView("album")}>
          按相册
        </button>
      </div>
      <CategoryFilter
        items={[{ id: "all", title: "全部" }, ...filters]}
        selected={filter}
        onSelect={setFilter}
        ariaLabel={view === "topic" ? "题材筛选" : "相册筛选"}
      />
      <PhotoGrid photos={visiblePhotos} onSelect={onSelectPhoto} />
    </main>
  );
}
