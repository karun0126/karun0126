const fs = require('fs');
const sharp = require('sharp');

async function testPerfectQualityTransition() {
  const fontBase64 = fs.readFileSync('bohemy_font/Bohemy.ttf').toString('base64');
  
  // 1. POSTERS:
  // Use posters-slice-pre-seam-fix.jpg (native 3842 x 4326)
  const postersOrig = await sharp('public/images/posters-slice-pre-seam-fix.jpg').raw().toBuffer({ resolveWithObject: true });
  const pW = postersOrig.info.width, pH = postersOrig.info.height;
  const pData = Buffer.from(postersOrig.data);
  
  // Clean up the 1px line artifact at row 6:
  for (let x = 0; x < pW; x++) {
    const topIdx = (4 * pW + x) * postersOrig.info.channels;
    const botIdx = (8 * pW + x) * postersOrig.info.channels;
    for (let y = 5; y <= 7; y++) {
      const t = (y - 4) / (8 - 4);
      const idx = (y * pW + x) * postersOrig.info.channels;
      for (let c = 0; c < 3; c++) {
        pData[idx + c] = Math.round(pData[topIdx + c] * (1 - t) + pData[botIdx + c] * t);
      }
    }
  }
  
  // 2. ABOUT:
  // Start from about-bg-clean-pre-seam-fix.png (native clean text area)
  // and restore native crumpled paper texture at y = 1980 to 2160 (x < 2100) from about-bg-baked-backup.png:
  const aboutClean = await sharp('public/images/about-bg-clean-pre-seam-fix.png').raw().toBuffer({ resolveWithObject: true });
  const aboutBaked = await sharp('public/images/about-bg-baked-backup.png').raw().toBuffer({ resolveWithObject: true });
  
  const aW = 3840, aH = 2160;
  const aData = Buffer.from(aboutClean.data);
  
  for (let y = 1980; y < aH; y++) {
    let factor = 1.0;
    if (y < 2020) {
      const t = (y - 1980) / (2020 - 1980);
      factor = t * t * (3 - 2 * t);
    }
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
  
  // 3. Smooth natural brush stroke darkening in About (Vector 10):
  // Centered around y = 2140, spanning x = 360 to 1750.
  // Smooth cosine/Gaussian falloff with no hard edges at all:
  for (let y = 2060; y < aH; y++) {
    // Vertical falloff: 0 at 2060, max at 2140-2160
    const vy = Math.min(1.0, (y - 2060) / (2140 - 2060));
    const vFactor = vy * vy * (3 - 2 * vy);
    
    for (let x = 360; x < 1760; x++) {
      // Horizontal falloff: smooth at ends
      let hFactor = 1.0;
      if (x < 500) {
        const t = (x - 360) / (500 - 360);
        hFactor = t * t * (3 - 2 * t);
      } else if (x > 1620) {
        const t = (1760 - x) / (1760 - 1620);
        hFactor = t * t * (3 - 2 * t);
      }
      
      const darkFactor = vFactor * hFactor * 0.16; // 16% darkening, matching Figma overlay
      const idx = (y * aW + x) * 4;
      for (let c = 0; c < 3; c++) {
        aData[idx + c] = Math.round(aData[idx + c] * (1 - darkFactor));
      }
    }
  }
  
  // 4. Smooth brightness match at the seam:
  // At row 2159 of About, match row 0 of Posters smoothly:
  for (let y = 2145; y < aH; y++) {
    const t = (y - 2145) / (aH - 2145);
    const weight = t * 0.40;
    const pY = aH - 1 - y;
    for (let x = 0; x < aW; x++) {
      const aIdx = (y * aW + x) * 4;
      const pIdx = (pY * pW + x) * postersOrig.info.channels;
      for (let c = 0; c < 3; c++) {
        aData[aIdx + c] = Math.round(aData[aIdx + c] * (1 - weight) + pData[pIdx + c] * weight);
      }
    }
  }
  
  // 5. VECTOR SVG OVERLAY FOR TEXT & FLOURISH:
  // "Currently Exploring" in Bohemy font:
  // In Figma: fontSize = 33 (66 in 2x).
  // x = 215.25 * 2 = 430.5.
  // In check-orig-motion-graphics, 'Motion' starts at x = 437.
  // Let's align 'Currently' nicely above 'Motion Graphics': x = 435.
  // Baseline: y = 2146.
  // Flourish Vector 9: slashes down-right towards (801, 2160) where it seamlessly enters Posters!
  const vectorSvg = `
  <svg width="3840" height="2160" xmlns="http://www.w3.org/2000/svg">
    <style>
      @font-face {
        font-family: 'Bohemy';
        src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
      }
      .sharp-cursive {
        font-family: 'Bohemy', cursive;
        font-size: 66px;
        fill: rgb(155, 45, 45);
        letter-spacing: 0.3px;
      }
    </style>
    
    <!-- Vector cursive text -->
    <text x="435" y="2142" class="sharp-cursive">Currently Exploring</text>
    
    <!-- Flourish underline: connects smoothly to the tip at (801, 2160) in Posters -->
    <path d="M 760 2135 C 778 2140, 794 2150, 801 2160" stroke="rgb(155, 30, 30)" stroke-width="3.5" stroke-linecap="round" fill="none" />
    <path d="M 801 2160 L 832 2128" stroke="rgb(155, 30, 30)" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <path d="M 822 2122 L 846 2110" stroke="rgb(155, 30, 30)" stroke-width="2" stroke-linecap="round" fill="none" />
  </svg>
  `;
  
  const vectorPng = await sharp(Buffer.from(vectorSvg)).png().toBuffer();
  
  const finalAbout = await sharp(aData, { raw: { width: aW, height: aH, channels: 4 } })
    .composite([
      { input: vectorPng, left: 0, top: 0 }
    ])
    .png()
    .toBuffer();
    
  await sharp(finalAbout).toFile('check-perfect-about.png');
  
  const finalPosters = await sharp(pData, { raw: { width: pW, height: pH, channels: postersOrig.info.channels } })
    .jpeg({ quality: 96 })
    .toBuffer();
  await sharp(finalPosters).toFile('check-perfect-posters.jpg');
  
  console.log('Saved check-perfect-about.png and check-perfect-posters.jpg');
  
  // 6. Test stitch: bottom 250px of About (1910 to 2160) + top 250px of Posters (0 to 250)
  const cropA = await sharp(finalAbout).extract({ left: 300, top: 1910, width: 1600, height: 250 }).toBuffer();
  const cropP = await sharp(finalPosters).extract({ left: 300, top: 0, width: 1600, height: 250 }).toBuffer();
  
  const stitch = await sharp({
    create: {
      width: 1600,
      height: 500,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
  .composite([
    { input: cropA, left: 0, top: 0 },
    { input: cropP, left: 0, top: 250 }
  ])
  .png()
  .toBuffer();
  
  await sharp(stitch).toFile('check-perfect-quality-stitch.png');
  console.log('Saved check-perfect-quality-stitch.png!');
}

testPerfectQualityTransition();
