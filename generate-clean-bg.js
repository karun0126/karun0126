const sharp = require('sharp');

async function buildCleanBackground() {
  const p = 'C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/';

  // 1. We have figma_home_exported.png (3840x2160)
  // 2. We have portrait.png (1614x2054) which sits at pos (1862, -176) -> top is -176, so we crop top 176 and place at (1862, 0)
  
  // Crop portrait so top starts at 0
  const portraitTrimmed = await sharp(p + 'portrait.png')
    .extract({ left: 0, top: 176, width: 1614, height: 2054 - 176 })
    .toBuffer();

  // Create base 3840x2160 canvas filled with #0a0a0a
  // Composite:
  // - Left side of figma_home_exported up to x = 2200 (so we preserve all the left paper texture, KRXN logo, Karun's pointing arm & head)
  const leftSide = await sharp('public/images/figma_home_exported.png')
    .extract({ left: 0, top: 0, width: 2274, height: 2160 })
    .toBuffer();

  // Background behind right side:
  // Karun's portrait extends to x = 1862 + 1614 = 3476
  // Let's create clean_bg.png
  const cleanBg = await sharp({
    create: {
      width: 3840,
      height: 2160,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 }
    }
  })
  .composite([
    {
      input: portraitTrimmed,
      left: 1862,
      top: 0
    },
    {
      input: leftSide,
      left: 0,
      top: 0
    }
  ])
  .png()
  .toBuffer();

  await sharp(cleanBg)
    .toFile(p + 'hero_clean_bg.png');

  await sharp(cleanBg)
    .resize(1000)
    .toFile(p + 'hero_clean_bg_preview.png');

  // Also test compositing trimmed_hand_posters onto cleanBg
  const fullComposite = await sharp(cleanBg)
    .composite([
      {
        input: p + 'trimmed_hand_posters.png',
        left: 2274,
        top: 0
      }
    ])
    .png()
    .toBuffer();

  await sharp(fullComposite)
    .resize(1000)
    .toFile(p + 'hero_composite_test_preview.png');

  console.log('Build clean background complete!');
}

buildCleanBackground();
