const fs = require('fs');
const sharp = require('sharp');

async function buildUltraSharpSeam() {
  console.log('--- 1. PREPARING FONTS & VECTOR ASSETS ---');
  const fontBase64 = fs.readFileSync('bohemy_font/Bohemy.ttf').toString('base64');
  
  // 2. Load Posters (native 3842 x 4326)
  const postersOrig = await sharp('public/images/posters-slice-pre-seam-fix.jpg').raw().toBuffer({ resolveWithObject: true });
  const pW = postersOrig.info.width, pH = postersOrig.info.height;
  const pData = Buffer.from(postersOrig.data);
  
  // Remove the 1px line artifact at y = 6 in posters:
  // In postersOrig, row 6 had a 1px step from Figma's slice boundary.
  // Smoothly interpolate row 5, 6, 7 across y = 4 to 8:
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
  
  console.log('Posters line at y=6 in-painted.');
  
  // 3. Load About
  // about-bg-clean-pre-seam-fix.png has clean text area up to y = 1990.
  // about-bg-baked-backup.png has the native crumpled paper texture at y = 1990 to 2160.
  const aboutClean = await sharp('public/images/about-bg-clean-pre-seam-fix.png').raw().toBuffer({ resolveWithObject: true });
  const aboutBaked = await sharp('public/images/about-bg-baked-backup.png').raw().toBuffer({ resolveWithObject: true });
  
  const aW = 3840, aH = 2160;
  const aData = Buffer.from(aboutClean.data);
  
  // Restore native crumpled paper folds in About between y = 1980 and 2160 (x < 2100):
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
  
  // 4. Smooth brightness match at the seam:
  // At y = 2160 of About and y = 0 of Posters, blend the bottom 25px of About towards Posters top:
  for (let y = 2135; y < aH; y++) {
    const t = (y - 2135) / (aH - 2135);
    const weight = t * 0.45; // subtle tone transition
    const pY = Math.min(pH - 1, aH - y);
    for (let x = 0; x < aW; x++) {
      const aIdx = (y * aW + x) * 4;
      const pIdx = (pY * pW + x) * postersOrig.info.channels;
      for (let c = 0; c < 3; c++) {
        aData[aIdx + c] = Math.round(aData[aIdx + c] * (1 - weight) + pData[pIdx + c] * weight);
      }
    }
  }
  
  // 5. Extract the watercolor brush stroke from ref-3840.png:
  // In ref-3840.png, between y = 90 and 184 (the top half of the brush stroke),
  // we extract the luminance darkening (the wash) relative to cream paper (avg 225)
  const ref = await sharp('ref-3840.png').raw().toBuffer({ resolveWithObject: true });
  
  for (let y = 2050; y < 2160; y++) {
    const rY = y - 1976;
    if (rY < 0 || rY >= 184) continue;
    
    for (let x = 320; x < 1800; x++) {
      const rIdx = (rY * ref.info.width + x) * ref.info.channels;
      const rR = ref.data[rIdx], rG = ref.data[rIdx+1], rB = ref.data[rIdx+2];
      
      // Check if it's part of the red text (we will render red text as vector!)
      const isRed = (rR > 130 && rG < 70 && rB < 70);
      if (isRed) continue;
      
      // Calculate brush stroke tint: paper is ~225, brush is ~175
      const brushLum = (rR + rG + rB) / 3;
      if (brushLum < 220) {
        const darkFactor = (220 - brushLum) / 220; // 0 to ~0.3
        const aIdx = (y * aW + x) * 4;
        for (let c = 0; c < 3; c++) {
          // Multiply/darken slightly on top of native paper texture
          aData[aIdx + c] = Math.round(aData[aIdx + c] * (1 - darkFactor * 0.75));
        }
      }
    }
  }
  
  console.log('Brush stroke texture applied to native paper.');
  
  // 6. Vector SVG layer for "Currently Exploring" and red flourish line:
  // Rendered with Bohemy font at native 66px retina size
  // In Figma: Currently Exploring is at x: 215.25 * 2 = 430.5, y: 1048 * 2 = 2096.
  // With baseline at y = 2146
  // Vector 9 flourish line connects down to (801, 2160)
  const vectorSvg = `
  <svg width="3840" height="2160" xmlns="http://www.w3.org/2000/svg">
    <style>
      @font-face {
        font-family: 'Bohemy';
        src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
      }
      .title {
        font-family: 'Bohemy', cursive;
        font-size: 64px;
        fill: rgb(158, 48, 48);
        letter-spacing: 0.5px;
      }
    </style>
    
    <!-- Ultra-sharp vector cursive title -->
    <text x="432" y="2142" class="title">Currently Exploring</text>
    
    <!-- Vector 9 flourish underline & slash -->
    <!-- Slashes down-right from x = 790, y = 2125 to x = 801, y = 2160 -->
    <path d="M 760 2135 C 778 2140, 794 2150, 801 2160" stroke="rgb(158, 48, 48)" stroke-width="3.5" stroke-linecap="round" fill="none" />
    <path d="M 801 2160 L 832 2128" stroke="rgb(158, 48, 48)" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <path d="M 822 2122 L 846 2110" stroke="rgb(158, 48, 48)" stroke-width="2" stroke-linecap="round" fill="none" />
  </svg>
  `;
  
  const vectorPng = await sharp(Buffer.from(vectorSvg)).png().toBuffer();
  
  // Composite vector text onto About:
  const finalAbout = await sharp(aData, { raw: { width: aW, height: aH, channels: 4 } })
    .composite([
      { input: vectorPng, left: 0, top: 0 }
    ])
    .png()
    .toBuffer();
    
  await sharp(finalAbout).toFile('public/images/about-bg-clean.png');
  console.log('Saved public/images/about-bg-clean.png (Ultra-Sharp 3840x2160)');
  
  // 7. Save Posters
  const finalPosters = await sharp(pData, { raw: { width: pW, height: pH, channels: postersOrig.info.channels } })
    .jpeg({ quality: 96 })
    .toBuffer();
    
  await sharp(finalPosters).toFile('public/images/posters-slice.jpg');
  console.log('Saved public/images/posters-slice.jpg (Native 3842x4326)');
  
  // 8. Generate Stitched Verification
  const cropA = await sharp(finalAbout).extract({ left: 300, top: 1960, width: 1600, height: 200 }).toBuffer();
  const cropP = await sharp(finalPosters).extract({ left: 300, top: 0, width: 1600, height: 200 }).toBuffer();
  
  const stitch = await sharp({
    create: {
      width: 1600,
      height: 400,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
  .composite([
    { input: cropA, left: 0, top: 0 },
    { input: cropP, left: 0, top: 200 }
  ])
  .png()
  .toBuffer();
  
  await sharp(stitch).toFile('ultra-sharp-seam-stitch.png');
  console.log('Saved ultra-sharp-seam-stitch.png!');
}

buildUltraSharpSeam();
