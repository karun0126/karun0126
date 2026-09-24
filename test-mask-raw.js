const sharp = require('sharp');
const p = 'C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/';

async function testMaskWithRaw() {
  const slide2 = sharp(p + 'slide2_figma_exported.png');
  const { data: slideData, info: slideInfo } = await slide2.raw().toBuffer({ resolveWithObject: true });
  
  // Resize mask to 3840x2160 raw buffer (1 channel)
  const maskData = await sharp(p + 'slide2_torn_paper_alpha.png')
    .resize(3840, 2160, { kernel: 'lanczos3' })
    .toColourspace('b-w')
    .raw()
    .toBuffer();

  console.log('slideData length:', slideData.length, 'maskData length:', maskData.length);
  
  // Replace alpha channel of slideData with maskData
  for (let i = 0; i < maskData.length; i++) {
    slideData[i * 4 + 3] = maskData[i];
  }

  // Save masked cream paper
  const creamPaperMasked = await sharp(slideData, {
    raw: {
      width: slideInfo.width,
      height: slideInfo.height,
      channels: 4
    }
  })
  .png()
  .toBuffer();

  await sharp(creamPaperMasked).resize(1000).toFile(p + 'cream_paper_masked_preview.png');
  console.log('Saved cream_paper_masked_preview.png');

  // Now composite:
  // Base: dark base texture from bottom of Hero
  // Hero dark texture at bottom: y = 1760 to 2160
  const heroDarkTex = await sharp('public/images/figma_home_exported.png')
    .extract({ left: 0, top: 1760, width: 3840, height: 400 })
    .toBuffer();

  // Create a 3840x2160 base filled with #1d1d1d
  const darkBase = await sharp({
    create: {
      width: 3840,
      height: 2160,
      channels: 4,
      background: { r: 29, g: 29, b: 29, alpha: 1 }
    }
  })
  .composite([
    {
      input: heroDarkTex,
      left: 0,
      top: 0
    }
  ])
  .png()
  .toBuffer();

  // Crop vector 4 (top 138 cut off)
  const vector4Trimmed = await sharp(p + 'node_212_162.png')
    .extract({ left: 0, top: 138, width: 14, height: 294 - 138 })
    .toBuffer();

  // Composite: darkBase + vector4Trimmed + star fill + star outline + creamPaperMasked
  const finalAbout = await sharp(darkBase)
    .composite([
      { input: vector4Trimmed, left: 1818, top: 0 },
      { input: p + 'node_212_163.png', left: 1734, top: 194 },
      { input: p + 'node_212_164.png', left: 1733, top: 183 },
      { input: creamPaperMasked, left: 0, top: 0 }
    ])
    .png()
    .toBuffer();

  await sharp(finalAbout).toFile(p + 'final_about_bg.png');
  await sharp(finalAbout).resize(1000).toFile(p + 'final_about_bg_preview.png');

  // Stitch test with Hero bottom
  const heroBottom = await sharp('public/images/figma_home_exported.png')
    .extract({ left: 0, top: 1560, width: 3840, height: 600 })
    .toBuffer();

  const aboutTop = await sharp(finalAbout)
    .extract({ left: 0, top: 0, width: 3840, height: 600 })
    .toBuffer();

  const seamStitch = await sharp({
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

  await sharp(seamStitch).resize(1200).toFile(p + 'final_seamless_stitch_preview.png');
  console.log('Saved final_seamless_stitch_preview.png');
}

testMaskWithRaw();
