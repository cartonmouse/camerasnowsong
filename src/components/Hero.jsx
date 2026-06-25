import PhotoImage from "./PhotoImage.jsx";
import { getHeroCaption } from "../lib/heroCaption.js";

export default function Hero({ photo, onViewPortfolio }) {
  const caption = getHeroCaption(photo);
  const hasCaption = Boolean(caption.title || caption.location);

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
          {hasCaption ? (
            <div className="hero-caption">
              {caption.title ? <span>{caption.title}</span> : null}
              {caption.location ? <span>{caption.location}</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
