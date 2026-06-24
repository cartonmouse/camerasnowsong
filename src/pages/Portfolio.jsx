import { useMemo, useState } from "react";
import CategoryFilter from "../components/CategoryFilter.jsx";
import PhotoGrid from "../components/PhotoGrid.jsx";
import { getAlbumDetails, getAlbums, getLightboxContextPhotos, getPhotosByAlbum, getPhotosByTopic, getTopics } from "../lib/photos.js";

export default function Portfolio({ photos, onSelectPhoto }) {
  const [view, setView] = useState("topic");
  const [filter, setFilter] = useState("all");
  const topics = useMemo(() => getTopics(photos).map((topic) => ({ id: topic, title: topic })), [photos]);
  const albums = useMemo(() => getAlbums(photos), [photos]);
  const filters = view === "topic" ? topics : albums;
  const activeAlbum = useMemo(() => (view === "album" && filter !== "all" ? getAlbumDetails(photos, filter) : null), [photos, view, filter]);
  const visiblePhotos = useMemo(
    () => (view === "topic" ? getPhotosByTopic(photos, filter) : getPhotosByAlbum(photos, filter)),
    [photos, view, filter]
  );

  function changeView(nextView) {
    setView(nextView);
    setFilter("all");
  }

  function selectPhoto(photo) {
    onSelectPhoto(photo, getLightboxContextPhotos(photos, { view, filter, photo }));
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
      {view === "album" && filter === "all" ? <AlbumIndex albums={albums} onSelect={setFilter} /> : null}
      {activeAlbum ? <AlbumFeature album={activeAlbum} onBack={() => setFilter("all")} /> : null}
      <PhotoGrid photos={visiblePhotos} onSelect={selectPhoto} />
    </main>
  );
}

function AlbumIndex({ albums, onSelect }) {
  return (
    <section className="album-index" aria-label="相册入口">
      {albums.map((album) => (
        <button key={album.id} className="album-entry" type="button" onClick={() => onSelect(album.id)}>
          <span className="eyebrow">{album.photoCount} 张照片</span>
          <strong>{album.title}</strong>
          {album.description ? <span>{album.description}</span> : null}
          {album.topics.length ? <small>{album.topics.join(" / ")}</small> : null}
        </button>
      ))}
    </section>
  );
}

function AlbumFeature({ album, onBack }) {
  return (
    <section className="album-feature" aria-label={`${album.title} 相册说明`}>
      <button type="button" onClick={onBack}>
        返回全部作品
      </button>
      <p className="eyebrow">{album.photoCount} 张照片</p>
      <h2>{album.title}</h2>
      {album.description ? <p>{album.description}</p> : null}
      {album.topics.length ? <p className="album-feature-topics">{album.topics.join(" / ")}</p> : null}
    </section>
  );
}
