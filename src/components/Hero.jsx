import PhotoImage from "./PhotoImage.jsx";

export default function Hero({ photo, onViewPortfolio }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">个人摄影</p>
        <h1>我来，我见，我按快门。</h1>
        <p>
          记录偶然遇见的光、人和时间。
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
