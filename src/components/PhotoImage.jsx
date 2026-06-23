export default function PhotoImage({ photo, className = "" }) {
  if (photo.src) {
    return (
      <img
        className={className}
        src={photo.src}
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
