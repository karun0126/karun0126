const fs = require('fs');
const sharp = require('sharp');

async function testSharpBadge() {
  const fontBase64 = fs.readFileSync('bohemy_font/Bohemy.ttf').toString('base64');
  
  // In check-baked-to-posters-stitch.png:
  // width: 1500, height: 340 (left: 300 to 1800, top: 1990 in About to 170 in Posters)
  // The seam is at y = 170 in this image.
  // In Posters, "Motion Graphics..." is at y = 205 to 239 (i.e. y = 35 to 69 in Posters, + 170 in stitch).
  // The red line tip in Posters ends at y = 170 + 38 = 208, x = 778 - 300 = 478.
  
  // In About:
  // "Currently Exploring" baseline is around y = 160.
  // The flourish starts around x = 774 - 300 = 474, y = 135 and curves down to meet (478, 208)!
  
  // And the brush stroke texture:
  // Let's extract the brush stroke texture from ref-3840.png and sharpen/denoise it,
  // or use SVG overlay!
  
  const localSvg = `
  <svg width="1500" height="340" xmlns="http://www.w3.org/2000/svg">
    <style>
      @font-face {
        font-family: 'Bohemy';
        src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
      }
      .title {
        font-family: 'Bohemy', cursive;
        font-size: 66px;
        fill: rgb(143, 46, 46);
        letter-spacing: 0.5px;
      }
    </style>
    
    <!-- Red handwriting title -->
    <text x="${430 - 300}" y="152" class="title">Currently Exploring</text>
    
    <!-- Flourish line connecting down to the tip in Posters -->
    <path d="M 475 125 C 485 135, 498 165, 502 170" stroke="rgb(141, 13, 13)" stroke-width="3" stroke-linecap="round" fill="none" />
  </svg>
  `;
  
  const localBadgePng = await sharp(Buffer.from(localSvg)).png().toBuffer();
  
  const comp = await sharp('check-baked-to-posters-stitch.png')
    .composite([
      { input: localBadgePng, left: 0, top: 0 }
    ])
    .png()
    .toBuffer();
    
  await sharp(comp).toFile('check-razor-sharp-preview.png');
  console.log('Saved check-razor-sharp-preview.png');
}

testSharpBadge();
