const sharp = require('sharp');
const p = 'C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/';

async function buildPixelPerfectAbout() {
  // 1. Dark base texture for About top 400px:
  // Extract 1600x360 pure dark texture from bottom of Hero (x = 0 to 1600, y = 1800 to 2160)
  const pureDarkSample = await sharp('public/images/figma_home_exported.png')
    .extract({ left: 0, top: 1800, width: 1600, height: 360 })
    .toBuffer();

  // Create a 3840x400 seamless dark strip
  const darkStrip3840 = await sharp(pureDarkSample)
    .resize(3840, 400, { fit: 'fill' })
    .toBuffer();

  // Create 3840x2160 base with #1d1d1d
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

  // 2. Mask slide2_figma_exported with slide2_torn_paper_alpha
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

  // 3. Vector 4: White vertical line continuation
  // node_212_162.png has width: 14, height: 294.
  // We want the line to start at y = 0 and touch the top tip of the star at y = 183.
  const vector4Trimmed = await sharp(p + 'node_212_162.png')
    .extract({ left: 0, top: 111, width: 14, height: 183 })
    .toBuffer();

  // 4. Composite final About:
  const finalAboutBg = await sharp(darkAboutBase)
    .composite([
      { input: vector4Trimmed, left: 1811, top: 0 },
      { input: p + 'node_212_163.png', left: 1727, top: 194 },
      { input: p + 'node_212_164.png', left: 1726, top: 183 },
      { input: creamPaperMasked, left: 0, top: 0 }
    ])
    .png()
    .toBuffer();

  await sharp(finalAboutBg).toFile('public/images/about-bg.png');
  console.log('Saved public/images/about-bg.png');

  // Verify alignment with Hero bottom
  const heroBottom = await sharp('public/images/figma_home_exported.png')
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

  await sharp(stitch).resize(1200).toFile(p + 'aligned_seam_stitch_preview.png');
  console.log('Saved aligned_seam_stitch_preview.png');
}

buildPixelPerfectAbout();
