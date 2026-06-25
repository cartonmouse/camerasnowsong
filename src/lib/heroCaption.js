const FILE_NAME_TITLE_PATTERN = /^(IMG|DSC|DSCF|PXL|DJI|SAM|_MG)[_-]?\d+/i;

export function getHeroCaption(photo) {
  const title = photo?.title?.trim() || "";
  const location = photo?.location?.trim() || "";

  return {
    title: FILE_NAME_TITLE_PATTERN.test(title) ? "" : title,
    location
  };
}
