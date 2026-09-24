const fs = require('fs');
const sharp = require('sharp');

async function testPerfectSharpSeam() {
  console.log('Loading assets...');
  const bohemyBase64 = fs.readFileSync('bohemy_font/Bohemy.ttf').toString('base64');
  
  // 1. Prepare About background
  // Start with clean about bg
  const aboutClean = await sharp('public/images/about-bg-clean-pre-seam-fix.png').raw().toBuffer({ resolveWithObject: true });
  const aboutBaked = await sharp('public/images/about-bg-baked-backup.png').raw().toBuffer({ resolveWithObject: true });
  const aW = 3840, aH = 2160;
  const aData = Buffer.from(aboutClean.data);
  
  // Restore native paper folds at bottom for x < 2200:
  // For x < 1550, text ends at y=1990, so blend in from y=2010 to 2160.
  // For 1550 <= x < 2200, blend in paper folds from y=1960 to 2160.
  // For x >= 2200, keep about-bg-clean-pre-seam-fix.png completely intact!
  for (let y = 1960; y < aH; y++) {
    for (let x = 0; x < 2200; x++) {
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
      // Feather out horizontally near x = 2200
      if (x > 2050) {
        const hf = (2200 - x) / 150;
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
  
  // 2. Prepare Posters: start at row 6 of posters-slice-pre-seam-fix.jpg
  // This aligns perfectly with Slide 2 / Slide 3 boundary in Figma
  const pOrig = await sharp('public/images/posters-slice-pre-seam-fix.jpg').raw().toBuffer({ resolveWithObject: true });
  const pW = pOrig.info.width; // 3842
  const pH = pOrig.info.height; // 4326
  const newPH = pH - 6; // 4320
  
  // Extract row 6 onwards for Posters
  const pCropBuffer = await sharp('public/images/posters-slice-pre-seam-fix.jpg')
    .extract({ left: 0, top: 6, width: pW, height: newPH })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pData = Buffer.from(pCropBuffer.data);
  
  // 3. Measure tone diff at the seam (About y=2159 vs Posters y=0)
  // And apply a smooth matching brush wash into About at y = 2070..2159 so there is ZERO line
  const diffMap = new Float32Array(aW);
  for (let x = 0; x < Math.min(aW, pW); x++) {
    const aIdx = (2159 * aW + x) * 4;
    const pIdx = (0 * pW + x) * pCropBuffer.info.channels;
    
    // Average tone difference between About and Posters at the seam
    const aLum = 0.299 * aData[aIdx] + 0.587 * aData[aIdx+1] + 0.114 * aData[aIdx+2];
    const pLum = 0.299 * pData[pIdx] + 0.587 * pData[pIdx+1] + 0.114 * pData[pIdx+2];
    diffMap[x] = pLum - aLum; // negative means posters is darker
  }
  
  // Smooth diffMap horizontally with a moving average
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
  
  // Apply brush wash upward into About (y = 2060 to 2160):
  // At y = 2159, factor = 1.0 (exact match to Posters tone).
  // At y = 2060, factor = 0.0 (smoothly fades out).
  for (let y = 2060; y < aH; y++) {
    const t = (y - 2060) / (2159 - 2060);
    // Organic S-curve with slight top feather
    const vWeight = t * t * (3 - 2 * t);
    
    for (let x = 180; x < 1850; x++) {
      const d = smoothDiff[x];
      // Only darken where Posters is darker
      if (d < 0) {
        const factor = vWeight * (-d / 255);
        const idx = (y * aW + x) * 4;
        for (let c = 0; c < 3; c++) {
          aData[idx + c] = Math.max(0, Math.min(255, Math.round(aData[idx + c] * (1 - factor * 0.95))));
        }
      }
    }
  }
  
  // 4. Seam tone matching without blurring paper grain:
  // Step 4 removed to preserve 100% razor-sharp paper texture and prevent vertical streak artifacts.
  
  // 5. Render Ultra-Sharp Vector SVG for About:
  // "Currently Exploring" in Bohemy font
  // Flourish underline Vector 9 connecting to x = 830 at y = 2160
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
    
  await sharp(finalAbout).toFile('test-final-about.png');
  await sharp(finalPosters).toFile('test-final-posters.jpg');
  console.log('Saved test-final-about.png and test-final-posters.jpg');
  
  // 6. Full-width Stitch preview
  const cropA = await sharp(finalAbout).extract({ left: 0, top: 2000, width: 3840, height: 160 }).toBuffer();
  const cropP = await sharp(finalPosters).extract({ left: 0, top: 0, width: 3840, height: 160 }).toBuffer();
  
  const stitch = await sharp({
    create: { width: 3840, height: 320, channels: 3, background: { r: 0, g: 0, b: 0 } }
  })
  .composite([
    { input: cropA, left: 0, top: 0 },
    { input: cropP, left: 0, top: 160 }
  ])
  .png()
  .toBuffer();
  
  await sharp(stitch).toFile('full-width-stitch-preview.png');
  console.log('Saved full-width-stitch-preview.png!');
}

testPerfectSharpSeam();
