const fs = require('fs');
const sharp = require('sharp');

async function testFeatheredBrushSeam() {
  const fontBase64 = fs.readFileSync('bohemy_font/Bohemy.ttf').toString('base64');
  
  // 1. Posters:
  const postersOrig = await sharp('public/images/posters-slice-pre-seam-fix.jpg').raw().toBuffer({ resolveWithObject: true });
  const pW = postersOrig.info.width, pH = postersOrig.info.height;
  const pData = Buffer.from(postersOrig.data);
  
  // Clean up row 6:
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
  
  // 2. About:
  const aboutClean = await sharp('public/images/about-bg-clean-pre-seam-fix.png').raw().toBuffer({ resolveWithObject: true });
  const aboutBaked = await sharp('public/images/about-bg-baked-backup.png').raw().toBuffer({ resolveWithObject: true });
  
  const aW = 3840, aH = 2160;
  const aData = Buffer.from(aboutClean.data);
  
  // Restore native crumpled paper in About:
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
  
  // 3. To make the brush stroke completely seamless across the seam:
  // In Posters, at y = 0 to 18, the brush stroke had a sharp cut at y = 0 from Figma's slice.
  // In About, at y = 2142 to 2160, the brush stroke continues down to meet Posters!
  // Let's sample the brush stroke tone at y = 15 in Posters across x = 360 to 1760:
  // And bridge the tone smoothly across y = 2145 in About to y = 15 in Posters:
  for (let x = 360; x < 1760; x++) {
    // Check brush tint at y = 18 in Posters:
    const p18Idx = (18 * pW + x) * postersOrig.info.channels;
    const p18R = pData[p18Idx], p18G = pData[p18Idx+1], p18B = pData[p18Idx+2];
    
    // Smooth vertical feather across the seam from y = 2146 in About to y = 12 in Posters:
    // In About (y = 2146 to 2159):
    for (let y = 2146; y < aH; y++) {
      const t = (y - 2146) / (2160 + 12 - 2146);
      const aIdx = (y * aW + x) * 4;
      // Gently blend towards p18
      const w = t * 0.75;
      aData[aIdx] = Math.round(aData[aIdx] * (1 - w) + p18R * w);
      aData[aIdx+1] = Math.round(aData[aIdx+1] * (1 - w) + p18G * w);
      aData[aIdx+2] = Math.round(aData[aIdx+2] * (1 - w) + p18B * w);
    }
    
    // In Posters (y = 0 to 12):
    for (let y = 0; y <= 12; y++) {
      const t = (y + 14) / (2160 + 12 - 2146);
      const pIdx = (y * pW + x) * postersOrig.info.channels;
      const w = (1 - (y / 12)) * 0.45;
      pData[pIdx] = Math.round(pData[pIdx] * (1 - w) + p18R * w);
      pData[pIdx+1] = Math.round(pData[pIdx+1] * (1 - w) + p18G * w);
      pData[pIdx+2] = Math.round(pData[pIdx+2] * (1 - w) + p18B * w);
    }
  }
  
  // Also apply organic watercolor wash in About under Currently Exploring (y = 2080 to 2146):
  for (let y = 2075; y < 2146; y++) {
    const vy = (y - 2075) / (2146 - 2075);
    const vFactor = vy * vy * (3 - 2 * vy);
    
    for (let x = 360; x < 1760; x++) {
      let hFactor = 1.0;
      if (x < 520) {
        const t = (x - 360) / (520 - 360);
        hFactor = t * t * (3 - 2 * t);
      } else if (x > 1600) {
        const t = (1760 - x) / (1760 - 1600);
        hFactor = t * t * (3 - 2 * t);
      }
      
      const darkFactor = vFactor * hFactor * 0.12;
      const idx = (y * aW + x) * 4;
      for (let c = 0; c < 3; c++) {
        aData[idx + c] = Math.round(aData[idx + c] * (1 - darkFactor));
      }
    }
  }
  
  // 4. Vector SVG for Currently Exploring and flourish line:
  const vectorSvg = `
  <svg width="3840" height="2160" xmlns="http://www.w3.org/2000/svg">
    <style>
      @font-face {
        font-family: 'Bohemy';
        src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
      }
      .sharp-cursive {
        font-family: 'Bohemy', cursive;
        font-size: 64px;
        fill: rgb(155, 45, 45);
        letter-spacing: 0.3px;
      }
    </style>
    
    <!-- Vector cursive text -->
    <text x="435" y="2138" class="sharp-cursive">Currently Exploring</text>
    
    <!-- Flourish underline: connects seamlessly to (801, 2160) -->
    <path d="M 760 2132 C 778 2138, 794 2148, 801 2160" stroke="rgb(155, 30, 30)" stroke-width="3.5" stroke-linecap="round" fill="none" />
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
    
  const finalPosters = await sharp(pData, { raw: { width: pW, height: pH, channels: postersOrig.info.channels } })
    .jpeg({ quality: 96 })
    .toBuffer();
    
  await sharp(finalAbout).toFile('public/images/about-bg-clean.png');
  await sharp(finalPosters).toFile('public/images/posters-slice.jpg');
  console.log('Saved both images to public/images/');
  
  // Generate stitch preview:
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
  
  await sharp(stitch).toFile('check-feathered-stitch.png');
  console.log('Saved check-feathered-stitch.png!');
}

testFeatheredBrushSeam();
