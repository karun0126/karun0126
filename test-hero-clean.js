const sharp = require('sharp');
const p = 'C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/';

async function testProperCleanBg() {
  // 1. In figma_home_exported.png (3840x2160):
  // Left side up to x = 2274 has Karun's head, pointing arm, KRXN logo, and bottom "01 ABOUT" + white line!
  // Notice that "01 ABOUT" is at x = 1742 to 1980 (which is < 2274)!
  // So the leftSide slice (0 to 2274) ALREADY contains "01 ABOUT" and the white line perfectly!
  const leftSide = await sharp('public/images/figma_home_exported.png')
    .extract({ left: 0, top: 0, width: 2274, height: 2160 })
    .toBuffer();

  // 2. Karun's portrait trimmed (top 176 cropped)
  const portraitTrimmed = await sharp(p + 'portrait.png')
    .extract({ left: 0, top: 176, width: 1614, height: 2054 - 176 })
    .toBuffer();

  // 3. Dark paper background for the entire canvas:
  // We can take the dark paper texture from figma_home_exported.png:
  // In figma_home_exported: x = 0 to 1800, y = 1600 to 2160 is pure dark paper texture.
  const darkPaperSample = await sharp('public/images/figma_home_exported.png')
    .extract({ left: 0, top: 1600, width: 2000, height: 560 })
    .toBuffer();

  // Resize dark paper texture to cover 3840x2160
  const fullDarkBg = await sharp(darkPaperSample)
    .resize(3840, 2160, { fit: 'fill' })
    .modulate({ brightness: 0.95 }) // slightly darker tone
    .toBuffer();

  // Composite base:
  // Layer 0: fullDarkBg
  // Layer 1: portraitTrimmed at (1862, 0)
  // Layer 2: leftSide at (0, 0)
  // Layer 3: Bottom seam preservation:
  // To ensure the dark texture at the bottom right (y = 1760 to 2160) blends naturally,
  // we let the dark texture flow smoothly to the right edge.
  
  const cleanHero = await sharp(fullDarkBg)
    .composite([
      { input: portraitTrimmed, left: 1862, top: 0 },
      { input: leftSide, left: 0, top: 0 }
    ])
    .jpeg({ quality: 95 })
    .toBuffer();

  await sharp(cleanHero).toFile(p + 'new_hero_clean_bg.jpg');
  await sharp(cleanHero).resize(1000).toFile(p + 'new_hero_clean_bg_preview.jpg');

  console.log('Saved new_hero_clean_bg.jpg and preview');
}

testProperCleanBg();
