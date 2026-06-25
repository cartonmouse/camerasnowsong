import { useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import PhotoLightbox from "./components/PhotoLightbox.jsx";
import Home from "./pages/Home.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import About from "./pages/About.jsx";
import photos from "./data/photos.json";

export default function App() {
  const [page, setPage] = useState("home");
  const [lightboxState, setLightboxState] = useState(null);

  function navigate(nextPage) {
    setPage(nextPage);
    setLightboxState(null);
  }

  function openLightbox(photo, contextPhotos) {
    setLightboxState({
      photo,
      photos: contextPhotos?.length ? contextPhotos : [photo]
    });
  }

  function showLightboxPhoto(photo) {
    setLightboxState((current) => ({
      photo,
      photos: current?.photos?.length ? current.photos : [photo]
    }));
  }

  return (
    <>
      <Header currentPage={page} onNavigate={navigate} />
      {page === "home" ? (
        <Home photos={photos} onNavigate={navigate} onSelectPhoto={openLightbox} />
      ) : null}
      {page === "portfolio" ? <Portfolio photos={photos} onSelectPhoto={openLightbox} /> : null}
      {page === "about" ? <About /> : null}
      <Footer />
      {lightboxState ? (
        <PhotoLightbox
          photo={lightboxState.photo}
          photos={lightboxState.photos}
          onClose={() => setLightboxState(null)}
          onSelectPhoto={showLightboxPhoto}
        />
      ) : null}
    </>
  );
}
