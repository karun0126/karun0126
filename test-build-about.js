const sharp = require('sharp');
const p = 'C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/';

async function buildAboutBg() {
  // 1. Get the dark background texture from the bottom of Hero (figma_home_exported.png)
  // In figma_home_exported.png, y = 1760 to 2160 (height 400) is the dark textured paper.
  // We can take that 3840x400 texture and use it for the top of About (which needs ~400px of dark background).
  const darkHeroTex = await sharp('public/images/figma_home_exported.png')
    .extract({ left: 0, top: 1760, width: 3840, height: 400 })
    .toBuffer();

  // Create a 3840x2160 dark base filled with #1d1d1d, and composite the darkHeroTex at the top
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
      input: darkHeroTex,
      left: 0,
      top: 0
    }
  ])
  .png()
  .toBuffer();

  // 2. Prepare the cream paper layer from slide2_figma_exported.png masked by slide2_torn_paper_alpha
  // First resize mask to 3840x2160
  const mask2x = await sharp(p + 'slide2_torn_paper_alpha.png')
    .resize(3840, 2160, { kernel: 'lanczos3' })
    .toBuffer();

  // Apply mask to slide2_figma_exported:
  // slide2_figma_exported is 3840x2160. We can replace its alpha channel with mask2x!
  // Wait, sharp doesn't have an inline 'replace alpha', but we can composite with blend: 'dest-in'
  const creamPaperOnly = await sharp(p + 'slide2_figma_exported.png')
    .composite([
      {
        input: mask2x,
        blend: 'dest-in'
      }
    ])
    .png()
    .toBuffer();

  // 3. Composite everything together:
  // Base: darkBase
  // Layer 1: Vector 4 (node_212_162.png) - white line continuation
  // Vector 4 is pos: relX_2x = 1818, relY_2x = -138.
  // Since top is -138, we crop top 138 of node_212_162.png (total height 294, remaining height 156)
  const vector4Trimmed = await sharp(p + 'node_212_162.png')
    .extract({ left: 0, top: 138, width: 14, height: 294 - 138 })
    .toBuffer();

  // Layer 2: Star 1 fill (node_212_163.png) at (1734, 194)
  // Layer 3: Vector 5 outline (node_212_164.png) at (1733, 183)
  // Layer 4: creamPaperOnly (which has transparency above the tear line!)
  // Notice that the bottom points of the star naturally tuck behind or sit over the torn edge, exactly as in Image 1!
  
  const aboutComposited = await sharp(darkBase)
    .composite([
      {
        input: vector4Trimmed,
        left: 1818,
        top: 0
      },
      {
        input: p + 'node_212_163.png',
        left: 1734,
        top: 194
      },
      {
        input: p + 'node_212_164.png',
        left: 1733,
        top: 183
      },
      {
        input: creamPaperOnly,
        left: 0,
        top: 0
      }
    ])
    .png()
    .toBuffer();

  await sharp(aboutComposited).toFile(p + 'test_about_composited.png');
  await sharp(aboutComposited).resize(1000).toFile(p + 'test_about_composited_preview.png');

  // Now create a stitched comparison with the bottom of Hero (figma_home_exported)
  // Hero bottom 600px + About top 600px
  const heroBottom = await sharp('public/images/figma_home_exported.png')
    .extract({ left: 0, top: 1560, width: 3840, height: 600 })
    .toBuffer();

  const aboutTop = await sharp(aboutComposited)
    .extract({ left: 0, top: 0, width: 3840, height: 600 })
    .toBuffer();

  const seamTest = await sharp({
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

  await sharp(seamTest).resize(1200).toFile(p + 'new_seamless_transition_preview.png');
  console.log('Build complete! Saved new_seamless_transition_preview.png');
}

buildAboutBg();
