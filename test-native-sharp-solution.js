const fs = require('fs');
const sharp = require('sharp');

async function testNativeSolution() {
  const fontBase64 = fs.readFileSync('bohemy_font/Bohemy.ttf').toString('base64');
  
  // 1. Posters:
  // posters-slice-pre-seam-fix.jpg is 3842 x 4326.
  // The seam line was at y = 6 (the 3px Figma slice offset).
  // If we extract starting at top = 6, height = 4320:
  // The 1px line artifact at the top is completely gone!
  // And the height is exactly 4320 (2x of 2160).
  const postersNative = await sharp('public/images/posters-slice-pre-seam-fix.jpg')
    .extract({ left: 0, top: 6, width: 3840, height: 4320 })
    .toBuffer();
    
  // 2. About:
  // about-bg-clean-pre-seam-fix.png has clean text area up to y = 1990.
  // about-bg-baked-backup.png has the native crumpled paper texture at y = 1990 to 2160.
  const aboutClean = await sharp('public/images/about-bg-clean-pre-seam-fix.png').raw().toBuffer({ resolveWithObject: true });
  const aboutBaked = await sharp('public/images/about-bg-baked-backup.png').raw().toBuffer({ resolveWithObject: true });
  
  const aW = 3840, aH = 2160;
  const aData = Buffer.from(aboutClean.data);
  
  // Smoothly blend the native crumpled paper texture from aboutBaked into aboutClean
  // between y = 1970 and y = 2010 (over 40px)
  for (let y = 1970; y < aH; y++) {
    let factor = 1.0;
    if (y < 2010) {
      const t = (y - 1970) / (2010 - 1970);
      factor = t * t * (3 - 2 * t);
    }
    // Only blend on the left/middle (x < 2100) where purePaper had flattened it;
    // x > 2100 in aboutClean already has the native collage/blue tape!
    for (let x = 0; x < 2100; x++) {
      let hFactor = 1.0;
      if (x > 1800) {
        const t = (2100 - x) / (2100 - 1800);
        hFactor = t * t * (3 - 2 * t);
      }
      const f = factor * hFactor;
      const idx = (y * aW + x) * 4;
      for (let c = 0; c < 3; c++) {
        aData[idx + c] = Math.round(aData[idx + c] * (1 - f) + aboutBaked.data[idx + c] * f);
      }
    }
  }
  
  // 3. Now render the vector badge onto About:
  // "Currently Exploring" in native Bohemy font at fontSize 66px
  // In Figma: x = 215.25 * 2 = 430.5.
  // Y in Slide 2: -3942 - (-4990) = 1048 * 2 = 2096.
  // Vector 9 flourish:
  // Starts after 'Exploring' around x = 774, y = 2120, slashes down-right towards the tip at (801, 2160)
  // Brush stroke underlay: soft grunge texture under Currently Exploring
  
  const badgeSvg = `
  <svg width="3840" height="2160" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="brushFilter" x="-10%" y="-20%" width="120%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04 0.08" numOctaves="4" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" result="displaced" />
        <feGaussianBlur in="displaced" stdDeviation="5" result="blurred" />
      </filter>
    </defs>
    <style>
      @font-face {
        font-family: 'Bohemy';
        src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
      }
      .badge-title {
        font-family: 'Bohemy', cursive;
        font-size: 68px;
        fill: rgb(155, 45, 45);
        letter-spacing: 0.2px;
      }
    </style>
    
    <!-- Vector 10 Brush Stroke underlay at bottom of About -->
    <g filter="url(#brushFilter)" opacity="0.40">
      <path d="M 380 2135 C 500 2125, 900 2130, 1720 2135" stroke="#827668" stroke-width="80" stroke-linecap="round" fill="none" />
      <path d="M 420 2120 C 700 2118, 1200 2120, 1680 2122" stroke="#685d50" stroke-width="45" stroke-linecap="round" fill="none" />
    </g>
    
    <!-- Ultra-sharp vector red cursive title -->
    <text x="430" y="2138" class="badge-title">Currently Exploring</text>
    
    <!-- Vector 9 flourish line meeting the tip at (801, 2160) -->
    <path d="M 770 2128 C 785 2135, 796 2150, 801 2160" stroke="rgb(155, 30, 30)" stroke-width="3.5" stroke-linecap="round" fill="none" />
    <path d="M 801 2160 L 830 2130" stroke="rgb(155, 30, 30)" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <path d="M 822 2124 L 844 2112" stroke="rgb(155, 30, 30)" stroke-width="2" stroke-linecap="round" fill="none" />
  </svg>
  `;
  
  const badgeLayer = await sharp(Buffer.from(badgeSvg)).png().toBuffer();
  
  const finalAbout = await sharp(aData, { raw: { width: aW, height: aH, channels: 4 } })
    .composite([
      { input: badgeLayer, left: 0, top: 0 }
    ])
    .png()
    .toBuffer();
    
  await sharp(finalAbout).toFile('check-native-about.png');
  await sharp(postersNative).toFile('check-native-posters.jpg');
  console.log('Saved check-native-about.png and check-native-posters.jpg');
  
  // 4. Test stitch bottom 300px of About + top 300px of Posters:
  const cropA = await sharp(finalAbout).extract({ left: 300, top: 1860, width: 1500, height: 300 }).toBuffer();
  const cropP = await sharp(postersNative).extract({ left: 300, top: 0, width: 1500, height: 300 }).toBuffer();
  
  const stitch = await sharp({
    create: {
      width: 1500,
      height: 600,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
  .composite([
    { input: cropA, left: 0, top: 0 },
    { input: cropP, left: 0, top: 300 }
  ])
  .png()
  .toBuffer();
  
  await sharp(stitch).toFile('check-native-stitch.png');
  console.log('Saved check-native-stitch.png!');
}

testNativeSolution();
