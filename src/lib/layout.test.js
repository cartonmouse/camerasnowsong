import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const photoGridSource = readFileSync("src/components/PhotoGrid.jsx", "utf8");
const portfolioSource = readFileSync("src/pages/Portfolio.jsx", "utf8");
const appSource = readFileSync("src/App.jsx", "utf8");
const styles = readFileSync("src/styles.css", "utf8");

assert.equal(
  photoGridSource.includes("wide"),
  false,
  "PhotoGrid should not assign forced wide layout classes to real photos"
);

const realImageRule = styles.match(/\.photo-card img\s*\{[^}]+\}/s)?.[0] || "";
assert.match(realImageRule, /height:\s*auto;/, "real photos should keep intrinsic aspect ratio");
assert.doesNotMatch(realImageRule, /aspect-ratio:/, "real photos should not be forced into a fixed aspect ratio");

const photoCardRule = styles.match(/\.photo-card\s*\{[^}]+\}/s)?.[0] || "";
assert.match(photoCardRule, /align-self:\s*center;/, "photo cards should be vertically centered within tall grid rows");

const heroImageRule = styles.match(/\.hero-frame img\s*\{[^}]+\}/s)?.[0] || "";
assert.match(heroImageRule, /height:\s*auto;/, "hero photo should keep its intrinsic aspect ratio");
assert.doesNotMatch(heroImageRule, /min-height:/, "hero photo should not be stretched by placeholder sizing");

const heroRule = styles.match(/\.hero\s*\{[^}]+\}/s)?.[0] || "";
assert.match(heroRule, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(300px,\s*1fr\);/, "hero text and image should have balanced desktop columns");

const heroHeadingRule = styles.match(/\.hero-copy h1\s*\{[^}]+\}/s)?.[0] || "";
assert.match(heroHeadingRule, /max-width:\s*100%;/, "hero heading should stay inside the text column");
assert.doesNotMatch(heroHeadingRule, /100vw/, "hero heading should not size itself from the whole viewport");
assert.match(heroHeadingRule, /font-size:\s*clamp\(2\.8rem,\s*3\.8vw,\s*4\.2rem\);/, "single-line hero heading should stay small enough to avoid the image column");

const photoGridRule = styles.match(/\.photo-grid\s*\{[^}]+\}/s)?.[0] || "";
assert.match(photoGridRule, /display:\s*grid;/, "photo grid should use row-major grid ordering");
assert.match(photoGridRule, /grid-template-columns:/, "photo grid should define responsive columns");
assert.doesNotMatch(styles, /column-count:/, "photo grid should not use column-count masonry ordering");

assert.match(portfolioSource, /useState\("album"\)/, "portfolio should open in album view by default");

const footerSource = readFileSync("src/components/Footer.jsx", "utf8");
assert.match(appSource, /<Footer \/>/, "site should render a footer on every page");
assert.match(footerSource, /All photographs and text are reserved/, "footer should include a concise copyright notice");
assert.match(footerSource, /未经许可/, "footer should tell visitors reuse requires permission");

const lightboxImageRule = styles.match(/\.lightbox-panel img\s*\{[^}]+\}/s)?.[0] || "";
assert.match(lightboxImageRule, /width:\s*auto;/, "opened photos should keep natural width when constrained by viewport");
assert.match(lightboxImageRule, /height:\s*auto;/, "opened photos should keep natural height when constrained by viewport");
assert.match(lightboxImageRule, /max-height:/, "opened photos should fit within the viewport height");
assert.match(lightboxImageRule, /object-fit:\s*contain;/, "opened photos should show the complete image without cropping");
assert.match(lightboxImageRule, /background:\s*#ddd8ce;/, "opened photo letterbox background should use a neutral gallery wall color");
assert.match(lightboxImageRule, /box-shadow:/, "opened photo should have subtle depth against the gallery wall background");

const lightboxPanelRule = styles.match(/\.lightbox-panel\s*\{[^}]+\}/s)?.[0] || "";
assert.match(
  lightboxPanelRule,
  /max-height:\s*calc\(100dvh\s*-/,
  "opened photos should use the visible viewport height for the lightbox"
);

const lightboxCopyRule = styles.match(/\.lightbox-copy\s*\{[^}]+\}/s)?.[0] || "";
assert.match(lightboxCopyRule, /overflow:\s*auto;/, "opened photo details should scroll instead of being clipped");

const mobileRules = styles.match(/@media \(max-width: 860px\)\s*\{[\s\S]+?\n\}/)?.[0] || "";
const mobileLightboxPanelRule = mobileRules.match(/\.lightbox-panel\s*\{[^}]+\}/s)?.[0] || "";
assert.doesNotMatch(mobileLightboxPanelRule, /(^|\n)\s*height\s*:/, "mobile lightbox panel should not force a fixed height");
assert.match(mobileRules, /\.lightbox-copy\s*\{[^}]*max-height:\s*none;/s, "mobile lightbox copy should sit below the photo");

const photoImageSource = readFileSync("src/components/PhotoImage.jsx", "utf8");
assert.match(photoImageSource, /width=\{width \|\| undefined\}/, "photo images should include width to reserve layout space");
assert.match(photoImageSource, /height=\{height \|\| undefined\}/, "photo images should include height to reserve layout space");
assert.match(photoImageSource, /loading="lazy"/, "photo images should lazy-load instead of all loading at once");
assert.match(photoImageSource, /decoding="async"/, "photo images should decode asynchronously");

console.log("layout rules ok");
