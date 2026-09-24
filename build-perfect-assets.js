const sharp = require('sharp');
const p = 'C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/';

async function buildAll() {
  console.log('--- 1. BUILDING ABOUT-BG.PNG ---');
  
  // Clean dark texture from Hero (1600x360)
  const pureDarkSample = await sharp('public/images/figma_home_exported.png')
    .extract({ left: 0, top: 1800, width: 1600, height: 360 })
    .toBuffer();

  // Create a 3840x400 seamless dark strip by tiling or mirroring pureDarkSample
  const darkStrip3840 = await sharp(pureDarkSample)
    .resize(3840, 400, { fit: 'fill' })
    .toBuffer();

  // Create 3840x2160 base with #1d1d1d and composite the dark strip at top
  const darkAboutBase = await sharp({
    create: {
      width: 3840,
      height: 2160,
      channels: 4,
      background: { r: 29, g: 29, b: 29, alpha: 1 }
    }
  })
  .composite([
    { input: darkStrip3840, left: 0, top: 0 }
  ])
  .png()
  .toBuffer();

  // Mask slide2_figma_exported with slide2_torn_paper_alpha
  const slide2 = sharp(p + 'slide2_figma_exported.png');
  const { data: slideData, info: slideInfo } = await slide2.raw().toBuffer({ resolveWithObject: true });
  
  const maskData = await sharp(p + 'slide2_torn_paper_alpha.png')
    .resize(3840, 2160, { kernel: 'lanczos3' })
    .toColourspace('b-w')
    .raw()
    .toBuffer();
  
  for (let i = 0; i < maskData.length; i++) {
    slideData[i * 4 + 3] = maskData[i];
  }

  const creamPaperMasked = await sharp(slideData, {
    raw: {
      width: slideInfo.width,
      height: slideInfo.height,
      channels: 4
    }
  })
  .png()
  .toBuffer();

  // Vector 4: White vertical line continuation
  // In node_212_162.png (width: 14, height: 294),
  // Slide 2 top is at y = 0.
  // We want the line to start at y = 0 and go down to the star tip at y = 183.
  // node_212_162 starts at relY_2x = -138 in Slide 2.
  // So at y = 0 in Slide 2, we extract from top: 138 to 138 + 183 = 321 (or max height 294, so height: 294 - 138 = 156).
  const vector4Trimmed = await sharp(p + 'node_212_162.png')
    .extract({ left: 0, top: 110, width: 14, height: 294 - 110 })
    .toBuffer();

  // Composite complete About Background:
  // Base: darkAboutBase
  // Layer 1: vector4Trimmed at left: 1818, top: 0
  // Layer 2: Star 1 fill (node_212_163.png) at left: 1734, top: 194
  // Layer 3: Vector 5 outline (node_212_164.png) at left: 1733, top: 183
  // Layer 4: creamPaperMasked (has transparent top)
  const finalAboutBg = await sharp(darkAboutBase)
    .composite([
      { input: vector4Trimmed, left: 1818, top: 0 },
      { input: p + 'node_212_163.png', left: 1734, top: 194 },
      { input: p + 'node_212_164.png', left: 1733, top: 183 },
      { input: creamPaperMasked, left: 0, top: 0 }
    ])
    .png()
    .toBuffer();

  await sharp(finalAboutBg).toFile('public/images/about-bg.png');
  console.log('Saved public/images/about-bg.png (3840x2160)');

  console.log('\n--- 2. BUILDING HERO-CLEAN-BG.JPG ---');
  // Left side up to x = 2274 contains KRXN, Karun pointing, and "01 ABOUT" + white line!
  const leftSide = await sharp('public/images/figma_home_exported.png')
    .extract({ left: 0, top: 0, width: 2274, height: 2160 })
    .toBuffer();

  // Karun portrait trimmed
  const portraitTrimmed = await sharp(p + 'portrait.png')
    .extract({ left: 0, top: 176, width: 1614, height: 2054 - 176 })
    .toBuffer();

  // Create full dark background (3840x2160) from pureDarkSample
  const fullDarkBg = await sharp(pureDarkSample)
    .resize(3840, 2160, { fit: 'fill' })
    .toBuffer();

  // Right side dark paper texture to blend behind the posters:
  // In Figma, the right side has Rectangle 1 (#181818) and Rectangle 21 (#0e0e0e)
  // Let's create a natural dark background:
  const finalHeroBg = await sharp(fullDarkBg)
    .composite([
      { input: portraitTrimmed, left: 1862, top: 0 },
      { input: leftSide, left: 0, top: 0 }
    ])
    .jpeg({ quality: 96 })
    .toBuffer();

  await sharp(finalHeroBg).toFile('public/images/hero-clean-bg.jpg');
  console.log('Saved public/images/hero-clean-bg.jpg (3840x2160)');

  console.log('\n--- 3. CREATING STITCHED SEAM VERIFICATION ---');
  const heroBottom = await sharp(finalHeroBg)
    .extract({ left: 0, top: 1560, width: 3840, height: 600 })
    .toBuffer();

  const aboutTop = await sharp(finalAboutBg)
    .extract({ left: 0, top: 0, width: 3840, height: 600 })
    .toBuffer();

  const stitch = await sharp({
    create: {
      width: 3840,
      height: 1200,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
  .composite([
    { input: heroBottom, left: 0, top: 0 },
    { input: aboutTop, left: 0, top: 600 }
  ])
  .png()
  .toBuffer();

  await sharp(stitch).resize(1200).toFile(p + 'perfect_seam_stitch_preview.png');
  console.log('Saved perfect_seam_stitch_preview.png');
}

buildAll();
