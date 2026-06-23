import PhotoImage from "./PhotoImage.jsx";

export default function Hero({ photo, onViewPortfolio }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">个人摄影</p>
        <h1>安静的画面，认真地收藏。</h1>
        <p>
          一个克制、干净的摄影作品集，用文件夹整理主题，用照片慢慢形成自己的观看档案。
        </p>
        <button className="primary-action" onClick={onViewPortfolio}>
          查看作品
        </button>
      </div>
      {photo ? (
        <div className="hero-frame">
          <PhotoImage photo={photo} />
          <div className="hero-caption">
            <span>{photo.title}</span>
            <span>{photo.location}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
