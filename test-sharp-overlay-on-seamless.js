const fs = require('fs');
const sharp = require('sharp');

async function testSharpOverlayOnSeamless() {
  const fontBase64 = fs.readFileSync('bohemy_font/Bohemy.ttf').toString('base64');
  
  // 1. We have final-seamless-verification.png (or the full seamless base)
  // Let's take the seamless base (which had zero line, complete badge and matching folds)
  // And sharpen the text:
  
  // Let's create an ultra-sharp SVG for "Currently Exploring":
  // In 3840 space, Currently Exploring:
  // x = 432, y = baseline ~176 (in the 500px stitch)
  // In check-ref-currently-exploring-raw, let's find the exact position and color:
  const textSvg = `
  <svg width="3840" height="500" xmlns="http://www.w3.org/2000/svg">
    <style>
      @font-face {
        font-family: 'Bohemy';
        src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
      }
      .sharp-title {
        font-family: 'Bohemy', cursive;
        font-size: 66px;
        fill: rgb(155, 42, 42);
        letter-spacing: 0.3px;
      }
    </style>
    
    <!-- Ultra-sharp vector text overlaid right over the base text -->
    <text x="435" y="174" class="sharp-title">Currently Exploring</text>
    
    <!-- Ultra-sharp flourish underline -->
    <path d="M 768 168 C 785 178, 804 200, 810 216" stroke="rgb(155, 30, 30)" stroke-width="3.5" stroke-linecap="round" fill="none" />
    <path d="M 810 216 L 848 174" stroke="rgb(155, 30, 30)" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 838 166 L 866 150" stroke="rgb(155, 30, 30)" stroke-width="2.5" stroke-linecap="round" fill="none" />
  </svg>
  `;
  
  const textLayer = await sharp(Buffer.from(textSvg)).png().toBuffer();
  
  // Also extract the native, 100% crisp "Motion Graphics..." from posters-slice-pre-seam-fix.jpg:
  // In posters-slice-pre-seam-fix.jpg:
  // "Motion Graphics..." is at left: 420, top: 30, width: 1100, height: 45
  // Let's extract only the dark text pixels (mask) so we preserve crisp edges:
  const nativeText = await sharp('public/images/posters-slice-pre-seam-fix.jpg')
    .extract({ left: 420, top: 32, width: 1100, height: 42 })
    .toBuffer();
    
  // Check position in the 500px stitch (where Posters starts at y = 250):
  // Posters top is at y = 250.
  // In posters, Motion Graphics is at y = 35.
  // So in stitch, it is at y = 250 + 35 = 285!
  // In final-seamless-verification, let's see where Motion Graphics was:
  // In final-seamless-verification, Motion Graphics was at y = 226 in ref-3840 (so y = 250 + 52 = 302 or similar).
  
  console.log('Testing alignment...');
}

testSharpOverlayOnSeamless();
