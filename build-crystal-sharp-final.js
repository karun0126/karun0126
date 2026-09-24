const fs = require('fs');
const sharp = require('sharp');

async function buildCrystalSharpFinal() {
  console.log('--- Generating Crystal-Sharp Seam Assets ---');
  
  // 1. Load native font for crisp vector rendering
  const bohemyBase64 = fs.readFileSync('bohemy_font/Bohemy.ttf').toString('base64');
  
  // 2. Base textures for About (3840 x 2160)
  const aboutClean = await sharp('public/images/about-bg-clean-pre-seam-fix.png').raw().toBuffer({ resolveWithObject: true });
  const aboutBaked = await sharp('public/images/about-bg-baked-backup.png').raw().toBuffer({ resolveWithObject: true });
  const aW = 3840, aH = 2160;
  const aData = Buffer.from(aboutClean.data);
  
  // Restore native paper folds at bottom for x < 2100 (matching Posters folds):
  for (let y = 1960; y < aH; y++) {
    for (let x = 0; x < 2100; x++) {
      let f = 0;
      if (x >= 1550) {
        if (y < 2010) {
          const t = (y - 1960) / 50;
          f = t * t * (3 - 2 * t);
        } else {
          f = 1.0;
        }
      } else {
        if (y >= 2010) {
          if (y < 2040) {
            const t = (y - 2010) / 30;
            f = t * t * (3 - 2 * t);
          } else {
            f = 1.0;
          }
        }
      }
      // Feather out near x = 2100
      if (x > 1950) {
        const hf = (2100 - x) / 150;
        f *= hf * hf * (3 - 2 * hf);
      }
      if (f > 0) {
        const idx = (y * aW + x) * 4;
        for (let c = 0; c < 3; c++) {
          aData[idx + c] = Math.round(aData[idx + c] * (1 - f) + aboutBaked.data[idx + c] * f);
        }
      }
    }
  }
  
  // 3. Prepare Posters slice (3840 x 4320)
  // Cropped from left: 2, top: 6 to align with exact 3840x4320 canvas in Figma
  // (eliminating the 2px left white border and 6px top slice offset)
  const pW = 3840;
  const newPH = 4320;
  const pCropBuffer = await sharp('public/images/posters-slice-pre-seam-fix.jpg')
    .extract({ left: 2, top: 6, width: pW, height: newPH })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pData = Buffer.from(pCropBuffer.data);

  // 3b. Remove static star from Posters slice (x: 1735..1930, y: 445..680)
  // Preserves hanging line at x = 1826..1833, y < 465, while seamlessly inpainting the star
  // with the matching clean wall patch texture
  if (fs.existsSync('public/images/test-clean-wall-patch.jpg')) {
    const patch = await sharp('public/images/test-clean-wall-patch.jpg').raw().toBuffer({ resolveWithObject: true });
    const pw = patch.info.width;
    for (let y = 445; y < 680; y++) {
      for (let x = 1735; x < 1930; x++) {
        const idx = (y * pW + x) * 3;
        const r = pData[idx];
        if (x >= 1826 && x <= 1833 && y < 465 && r < 30) continue;
        const patchX = x - 1571;
        const patchY = y + 295;
        if (patchX < 0 || patchX >= pw || patchY < 0 || patchY >= patch.info.height) continue;
        const patchIdx = (patchY * pw + patchX) * 3;
        const dx1 = (x - 1830) / 90;
        const dy1 = (y - 565) / 105;
        const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const dx2 = (x - 1760) / 25;
        const dy2 = (y - 655) / 20;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const minDist = Math.min(dist1, dist2);
        if (minDist <= 1.0) {
          pData[idx] = patch.data[patchIdx];
          pData[idx + 1] = patch.data[patchIdx + 1];
          pData[idx + 2] = patch.data[patchIdx + 2];
        } else if (minDist < 1.15) {
          const t = (minDist - 1.0) / 0.15;
          const w = 1.0 - t;
          pData[idx] = Math.round(pData[idx] * (1 - w) + patch.data[patchIdx] * w);
          pData[idx + 1] = Math.round(pData[idx + 1] * (1 - w) + patch.data[patchIdx + 1] * w);
          pData[idx + 2] = Math.round(pData[idx + 2] * (1 - w) + patch.data[patchIdx + 2] * w);
        }
      }
    }
  }
  
  // 4. Smooth brush wash matching in About (y = 2060..2160, x = 180..1850)
  // Ensures the warm grunge wash behind "Currently Exploring" matches Posters tone seamlessly
  const diffMap = new Float32Array(aW);
  for (let x = 0; x < aW; x++) {
    const aIdx = (2159 * aW + x) * 4;
    const pIdx = (0 * pW + x) * pCropBuffer.info.channels;
    
    const aLum = 0.299 * aData[aIdx] + 0.587 * aData[aIdx+1] + 0.114 * aData[aIdx+2];
    const pLum = 0.299 * pData[pIdx] + 0.587 * pData[pIdx+1] + 0.114 * pData[pIdx+2];
    diffMap[x] = pLum - aLum;
  }
  
  const smoothDiff = new Float32Array(aW);
  const radius = 25;
  for (let x = 0; x < aW; x++) {
    let sum = 0, count = 0;
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      if (nx >= 0 && nx < aW) {
        sum += diffMap[nx];
        count++;
      }
    }
    smoothDiff[x] = sum / count;
  }
  
  for (let y = 2060; y < aH; y++) {
    const t = (y - 2060) / (2159 - 2060);
    const vWeight = t * t * (3 - 2 * t);
    
    for (let x = 180; x < 1850; x++) {
      const d = smoothDiff[x];
      if (d < 0) {
        const factor = vWeight * (-d / 255);
        const idx = (y * aW + x) * 4;
        for (let c = 0; c < 3; c++) {
          aData[idx + c] = Math.max(0, Math.min(255, Math.round(aData[idx + c] * (1 - factor * 0.95))));
        }
      }
    }
  }

  // 5. Fix right vertical edge white frame artifact in About (x = 3838, 3839)
  for (let y = 0; y < aH; y++) {
    const srcIdx = (y * aW + 3837) * 4;
    for (let col = 3838; col < aW; col++) {
      const dstIdx = (y * aW + col) * 4;
      for (let c = 0; c < 4; c++) {
        aData[dstIdx + c] = aData[srcIdx + c];
      }
    }
  }

  // 6. Fix bottom horizontal cream strip artifact in About (rows 2153..2159)
  // Rows 2153..2159 in the original Figma export contained the cream artboard background
  // where the black card and paper layers stopped short at row 2152.
  // Smoothly bridge from About row 2152 down to Posters row 0 across rows 2153..2159.
  // This completely eliminates the horizontal white line under the black card/void (x >= 3465)
  // and creates a 100% seamless, organic paper texture transition for x < 3465.
  for (let x = 2100; x < aW; x++) {
    const aTopIdx = (2152 * aW + x) * 4;
    const pIdx = x * 3;

    // Check if both are dark void
    const aLum = 0.299 * aData[aTopIdx] + 0.587 * aData[aTopIdx + 1] + 0.114 * aData[aTopIdx + 2];
    const pLum = 0.299 * pData[pIdx] + 0.587 * pData[pIdx + 1] + 0.114 * pData[pIdx + 2];

    for (let y = 2153; y < aH; y++) {
      const t = (y - 2152) / (2159 - 2152);
      const dstIdx = (y * aW + x) * 4;
      
      if (aLum < 45 && pLum < 45) {
        // In the dark void background: match Posters row 0 exactly (14, 14, 14)
        aData[dstIdx] = pData[pIdx];
        aData[dstIdx + 1] = pData[pIdx + 1];
        aData[dstIdx + 2] = pData[pIdx + 2];
      } else {
        // In paper / edge regions: smoothly interpolate between About row 2152 and Posters row 0
        for (let c = 0; c < 3; c++) {
          aData[dstIdx + c] = Math.round(aData[aTopIdx + c] * (1 - t) + pData[pIdx + c] * t);
        }
      }
      aData[dstIdx + 3] = 255;
    }
  }
  
  // 7. Render Ultra-Sharp Vector SVG for About:
  // "Currently Exploring" in official Bohemy font
  // Vector 9 flourish connecting down to (831, 2160) at the seam
  const aboutSvg = `
  <svg width="3840" height="2160" xmlns="http://www.w3.org/2000/svg">
    <style>
      @font-face {
        font-family: 'Bohemy';
        src: url('data:font/truetype;charset=utf-8;base64,${bohemyBase64}') format('truetype');
      }
      .cursive-title {
        font-family: 'Bohemy', cursive;
        font-size: 66px;
        fill: rgb(143, 46, 46);
        letter-spacing: 0.2px;
      }
    </style>
    
    <!-- Ultra-sharp vector typography -->
    <text x="432" y="2140" class="cursive-title">Currently Exploring</text>
    
    <!-- Vector 9 flourish line: connects from under Exploring down to seam at (831, 2160) -->
    <path d="M 894 2123 L 831 2160" stroke="rgb(141, 13, 13)" stroke-width="4.2" stroke-linecap="round" fill="none" />
  </svg>
  `;
  
  const aboutSvgBuf = await sharp(Buffer.from(aboutSvg)).png().toBuffer();
  
  const finalAbout = await sharp(aData, { raw: { width: aW, height: aH, channels: 4 } })
    .composite([
      { input: aboutSvgBuf, left: 0, top: 0 }
    ])
    .png()
    .toBuffer();
    
  const finalPosters = await sharp(pData, { raw: { width: pW, height: newPH, channels: pCropBuffer.info.channels } })
    .jpeg({ quality: 98 })
    .toBuffer();
    
  // 8. Write final production assets
  await sharp(finalAbout).toFile('public/images/about-bg-clean.png');
  await sharp(finalPosters).toFile('public/images/posters-slice.jpg');
  console.log('Saved crystal-sharp images to public/images/about-bg-clean.png and posters-slice.jpg');
  
  // 9. Generate verification images for both left (typography) and right (dark void seam)
  const cropALeft = await sharp(finalAbout).extract({ left: 300, top: 2000, width: 1400, height: 160 }).toBuffer();
  const cropPLeft = await sharp(finalPosters).extract({ left: 300, top: 0, width: 1400, height: 160 }).toBuffer();
  
  const stitchLeft = await sharp({
    create: { width: 1400, height: 320, channels: 3, background: { r: 0, g: 0, b: 0 } }
  })
  .composite([
    { input: cropALeft, left: 0, top: 0 },
    { input: cropPLeft, left: 0, top: 160 }
  ])
  .png()
  .toBuffer();
  
  await sharp(stitchLeft).toFile('final-crystal-sharp-verification.png');

  const cropARight = await sharp(finalAbout).extract({ left: 2400, top: 2000, width: 1440, height: 160 }).toBuffer();
  const cropPRight = await sharp(finalPosters).extract({ left: 2400, top: 0, width: 1440, height: 160 }).toBuffer();

  const stitchRight = await sharp({
    create: { width: 1440, height: 320, channels: 3, background: { r: 0, g: 0, b: 0 } }
  })
  .composite([
    { input: cropARight, left: 0, top: 0 },
    { input: cropPRight, left: 0, top: 160 }
  ])
  .png()
  .toBuffer();

  await sharp(stitchRight).toFile('final-right-seam-verification.png');
  console.log('Saved final-crystal-sharp-verification.png and final-right-seam-verification.png!');
}

buildCrystalSharpFinal();
