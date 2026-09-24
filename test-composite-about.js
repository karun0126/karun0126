const sharp = require('sharp');
const p = 'C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/';

async function testCompositeAbout() {
  // 1. We have slide2_figma_exported.png (3840x2160)
  // 2. We have slide2_torn_paper_alpha.png (1920x1080) -> resize to 3840x2160
  const mask2x = await sharp(p + 'slide2_torn_paper_alpha.png')
    .resize(3840, 2160, { kernel: 'lanczos3' })
    .toBuffer();

  // 3. Extract the Star and Vector line from slide2_figma_exported.png
  // In slide2, Star 1 is at pos: (867*2, 91*2) = (1734, 182), size ~ (168, 204)
  // Vector 4 is at pos: (909*2, 0) to (909*2, 156)
  // Let's inspect the star region from slide2_figma_exported.png
  // In slide2_figma_exported.png, the star is red/white, and the line is white!
  
  // 4. Background texture for the dark area:
  // In figma_home_exported.png, the bottom 400px (y = 1760 to 2160) is the dark paper texture
  const heroDarkTexture = await sharp('public/images/figma_home_exported.png')
    .extract({ left: 0, top: 1800, width: 3840, height: 360 })
    .toBuffer();

  // Let's create a dark base for Slide 2
  // The dark base should have dark paper color [29, 29, 29] / texture
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
      input: heroDarkTexture,
      left: 0,
      top: 0
    }
  ])
  .png()
  .toBuffer();

  // In slide2_figma_exported.png:
  // What if we mask slide2_figma_exported with mask2x?
  // But wait! We need the Star and the Line to stay on top of the dark base!
  // Where is the star and line?
  // Let's extract the star and line from slide2_figma_exported:
  // Vector 4 is around x = 1818 (909*2), y from 0 to 182
  // Star is around x = 1734 (867*2), y from 182 to 360
  
  console.log('Testing extraction...');
}

testCompositeAbout();
