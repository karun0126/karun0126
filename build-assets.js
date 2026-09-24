const sharp = require('sharp');
const fs = require('fs');

async function buildAssets() {
  const p = 'C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/';

  // 1. Hand + Posters Collage:
  // Source: trimmed_hand_posters.png (1566x2160 with alpha)
  // Let's copy it to public/images/hand-posters-collage.png
  await sharp(p + 'trimmed_hand_posters.png')
    .png({ quality: 95, compressionLevel: 8 })
    .toFile('public/images/hand-posters-collage.png');
  console.log('Saved public/images/hand-posters-collage.png');

  // 2. Clean Hero Background:
  // Source: hero_clean_bg.png (3840x2160)
  // Save as high-quality jpg for fast loading and crisp visuals
  await sharp(p + 'hero_clean_bg.png')
    .jpeg({ quality: 94, chromaSubsampling: '4:4:4' })
    .toFile('public/images/hero-clean-bg.jpg');
  console.log('Saved public/images/hero-clean-bg.jpg');

  // Verify dimensions
  const metaHand = await sharp('public/images/hand-posters-collage.png').metadata();
  const metaBg = await sharp('public/images/hero-clean-bg.jpg').metadata();
  console.log('Hand meta:', metaHand.width, 'x', metaHand.height, 'alpha:', metaHand.hasAlpha);
  console.log('Bg meta:', metaBg.width, 'x', metaBg.height);
}

buildAssets();
