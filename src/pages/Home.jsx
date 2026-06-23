import Hero from "../components/Hero.jsx";
import PhotoGrid from "../components/PhotoGrid.jsx";
import { getFeaturedPhotos } from "../lib/photos.js";

export default function Home({ photos, onNavigate, onSelectPhoto }) {
  const featured = getFeaturedPhotos(photos);

  return (
    <main>
      <Hero photo={featured[0]} onViewPortfolio={() => onNavigate("portfolio")} />
      <section className="section-shell">
        <div className="section-heading">
          <p className="eyebrow">精选</p>
          <h2>近期挑选的照片</h2>
          <p>先用少量作品建立网站的气质，再随着拍摄慢慢扩展。</p>
        </div>
        <PhotoGrid photos={featured} onSelect={onSelectPhoto} />
      </section>
    </main>
  );
}
