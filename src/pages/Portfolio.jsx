import { useMemo, useState } from "react";
import CategoryFilter from "../components/CategoryFilter.jsx";
import PhotoGrid from "../components/PhotoGrid.jsx";
import { getAlbumDetails, getAlbums, getLightboxContextPhotos, getPhotosByAlbum, getPhotosByTopic, getTopics } from "../lib/photos.js";

const ALBUM_PAGE_SIZE = 8;

export default function Portfolio({ photos, onSelectPhoto }) {
  const [view, setView] = useState("album");
  const [filter, setFilter] = useState("all");
  const [albumPage, setAlbumPage] = useState(0);
  const [albumExpanded, setAlbumExpanded] = useState(false);
  const topics = useMemo(() => getTopics(photos).map((topic) => ({ id: topic, title: topic })), [photos]);
  const albums = useMemo(() => getAlbums(photos), [photos]);
  const activeAlbum = useMemo(() => (view === "album" && filter !== "all" ? getAlbumDetails(photos, filter) : null), [photos, view, filter]);
  const visiblePhotos = useMemo(
    () => (view === "topic" ? getPhotosByTopic(photos, filter) : getPhotosByAlbum(photos, filter)),
    [photos, view, filter]
  );

  function changeView(nextView) {
    setView(nextView);
    setFilter("all");
    setAlbumPage(0);
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
      {view === "topic" ? (
        <CategoryFilter
          items={[{ id: "all", title: "全部" }, ...topics]}
          selected={filter}
          onSelect={setFilter}
          ariaLabel="题材筛选"
        />
      ) : null}
      {view === "album" ? (
        <AlbumPicker
          albums={albums}
          selected={filter}
          onSelect={setFilter}
          page={albumPage}
          onPageChange={setAlbumPage}
          expanded={albumExpanded}
          onExpandedChange={setAlbumExpanded}
        />
      ) : null}
      {activeAlbum ? <AlbumFeature album={activeAlbum} onBack={() => setFilter("all")} /> : null}
      <PhotoGrid photos={visiblePhotos} onSelect={selectPhoto} />
    </main>
  );
}

function AlbumPicker({ albums, selected, onSelect, page, onPageChange, expanded, onExpandedChange }) {
  const pageCount = Math.max(1, Math.ceil(albums.length / ALBUM_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visibleAlbums = expanded ? albums : albums.slice(safePage * ALBUM_PAGE_SIZE, safePage * ALBUM_PAGE_SIZE + ALBUM_PAGE_SIZE);

  function movePage(direction) {
    onPageChange((currentPage) => (currentPage + direction + pageCount) % pageCount);
  }

  return (
    <section className="album-picker" aria-label="相册筛选">
      <div className="album-index">
        <button className={`album-entry ${selected === "all" ? "active" : ""}`} type="button" onClick={() => onSelect("all")}>
          全部
        </button>
        {visibleAlbums.map((album) => (
          <button
            key={album.id}
            className={`album-entry ${selected === album.id ? "active" : ""}`}
            type="button"
            onClick={() => onSelect(album.id)}
          >
            <strong>{album.title}</strong>
            <span>{album.photoCount} 张</span>
          </button>
        ))}
      </div>
      {albums.length > ALBUM_PAGE_SIZE ? (
        <div className="album-controls">
          {!expanded ? (
            <>
              <button type="button" onClick={() => movePage(-1)}>
                上一组
              </button>
              <span>
                {safePage + 1} / {pageCount}
              </span>
              <button type="button" onClick={() => movePage(1)}>
                下一组
              </button>
            </>
          ) : null}
          <button type="button" onClick={() => onExpandedChange(!expanded)}>
            {expanded ? "折叠相册" : "展开全部"}
          </button>
        </div>
      ) : null}
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
