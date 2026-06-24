export default function PhotoImage({ photo, className = "", variant = "full" }) {
  const imageSrc = variant === "thumb" ? photo.thumb || photo.src : photo.src;
  const width = variant === "thumb" ? photo.thumbWidth || photo.width : photo.width;
  const height = variant === "thumb" ? photo.thumbHeight || photo.height : photo.height;

  if (imageSrc) {
    const src = imageSrc.startsWith("/")
      ? `${import.meta.env.BASE_URL.replace(/\/$/, "")}${imageSrc}`
      : imageSrc;

    return (
      <img
        className={className}
        src={src}
        alt={photo.title}
        width={width || undefined}
        height={height || undefined}
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
