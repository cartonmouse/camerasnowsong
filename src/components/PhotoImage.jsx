export default function PhotoImage({ photo, className = "" }) {
  if (photo.src) {
    const src = photo.src.startsWith("/")
      ? `${import.meta.env.BASE_URL.replace(/\/$/, "")}${photo.src}`
      : photo.src;

    return (
      <img
        className={className}
        src={src}
        alt={photo.title}
        width={photo.width || undefined}
        height={photo.height || undefined}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className={`photo-placeholder tone-${photo.tone || "graphite"} ${className}`} role="img" aria-label={photo.title}>
      <span>{photo.title}</span>
    </div>
  );
}
