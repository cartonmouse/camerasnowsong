import { useState } from "react";
import Header from "./components/Header.jsx";
import PhotoLightbox from "./components/PhotoLightbox.jsx";
import Home from "./pages/Home.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import About from "./pages/About.jsx";
import photos from "./data/photos.json";

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  function navigate(nextPage) {
    setPage(nextPage);
    setSelectedPhoto(null);
  }

  return (
    <>
      <Header currentPage={page} onNavigate={navigate} />
      {page === "home" ? (
        <Home photos={photos} onNavigate={navigate} onSelectPhoto={setSelectedPhoto} />
      ) : null}
      {page === "portfolio" ? <Portfolio photos={photos} onSelectPhoto={setSelectedPhoto} /> : null}
      {page === "about" ? <About /> : null}
      {selectedPhoto ? <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} /> : null}
    </>
  );
}

