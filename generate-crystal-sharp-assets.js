const fs = require('fs');
const sharp = require('sharp');

async function generateCrystalSharpAssets() {
  console.log('Loading fonts...');
  const bohemyBase64 = fs.readFileSync('bohemy_font/Bohemy.ttf').toString('base64');
  const intelBase64 = fs.readFileSync('intel_fonts/ttf/IntelOneMono-Bold.ttf').toString('base64');
  
  // 1. Prepare Base Paper Textures:
  // About: 3840 x 2160
  const aboutClean = await sharp('public/images/about-bg-clean-pre-seam-fix.png').raw().toBuffer({ resolveWithObject: true });
  const aboutBaked = await sharp('public/images/about-bg-baked-backup.png').raw().toBuffer({ resolveWithObject: true });
  const aW = 3840, aH = 2160;
  const aData = Buffer.from(aboutClean.data);
  
  // Restore native crumpled paper in About at bottom (y = 1980 to 2160, x < 2100):
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
  
  // Posters: 3842 x 4326
  const postersOrig = await sharp('public/images/posters-slice-pre-seam-fix.jpg').raw().toBuffer({ resolveWithObject: true });
  const pW = postersOrig.info.width, pH = postersOrig.info.height;
  const pData = Buffer.from(postersOrig.data);
  
  // Clean row 6 line artifact in posters:
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
  
  // 2. Seamless Paper Tone Blend across the Seam:
  // Bottom 20px of About (2140 to 2160) and top 20px of Posters (0 to 20)
  for (let x = 0; x < aW; x++) {
    const aLastIdx = (2159 * aW + x) * 4;
    const pFirstIdx = (0 * pW + x) * postersOrig.info.channels;
    
    // Average color at the seam:
    const avgR = Math.round((aData[aLastIdx] + pData[pFirstIdx]) / 2);
    const avgG = Math.round((aData[aLastIdx+1] + pData[pFirstIdx+1]) / 2);
    const avgB = Math.round((aData[aLastIdx+2] + pData[pFirstIdx+2]) / 2);
    
    // Smooth fade into About bottom 25px:
    for (let y = 2135; y < aH; y++) {
      const t = (y - 2135) / (2159 - 2135);
      const w = t * t * (3 - 2 * t);
      const aIdx = (y * aW + x) * 4;
      aData[aIdx] = Math.round(aData[aIdx] * (1 - w) + avgR * w);
      aData[aIdx+1] = Math.round(aData[aIdx+1] * (1 - w) + avgG * w);
      aData[aIdx+2] = Math.round(aData[aIdx+2] * (1 - w) + avgB * w);
    }
    
    // Smooth fade into Posters top 20px:
    for (let y = 0; y <= 20; y++) {
      const t = (20 - y) / 20;
      const w = t * t * (3 - 2 * t);
      const pIdx = (y * pW + x) * postersOrig.info.channels;
      pData[pIdx] = Math.round(pData[pIdx] * (1 - w) + avgR * w);
      pData[pIdx+1] = Math.round(pData[pIdx+1] * (1 - w) + avgG * w);
      pData[pIdx+2] = Math.round(pData[pIdx+2] * (1 - w) + avgB * w);
    }
  }
  
  // 3. Render Vector SVG for About Section:
  // "Currently Exploring" in Bohemy font
  // Flourish underline Vector 9
  // Soft watercolor wash underlay
  const aboutSvg = `
  <svg width="3840" height="2160" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="brushAbout" x="-20%" y="-30%" width="140%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03 0.06" numOctaves="4" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="16" xChannelSelector="R" yChannelSelector="G" result="displaced" />
        <feGaussianBlur in="displaced" stdDeviation="6" result="blurred" />
      </filter>
    </defs>
    <style>
      @font-face {
        font-family: 'Bohemy';
        src: url('data:font/truetype;charset=utf-8;base64,${bohemyBase64}') format('truetype');
      }
      .cursive-text {
        font-family: 'Bohemy', cursive;
        font-size: 66px;
        fill: rgb(155, 45, 45);
        letter-spacing: 0.3px;
      }
    </style>
    
    <!-- Organic Brush Wash underlay (top half of Vector 10) -->
    <g filter="url(#brushAbout)" opacity="0.28">
      <path d="M 360 2130 C 500 2115, 900 2120, 1750 2125" stroke="#7a6e60" stroke-width="70" stroke-linecap="round" fill="none" />
      <path d="M 400 2110 C 650 2105, 1100 2108, 1700 2112" stroke="#5d5246" stroke-width="40" stroke-linecap="round" fill="none" />
    </g>
    
    <!-- Ultra-sharp Vector Title -->
    <text x="432" y="2138" class="cursive-text">Currently Exploring</text>
    
    <!-- Vector 9 flourish line: connects to (801, 2160) -->
    <path d="M 760 2130 C 778 2136, 794 2148, 801 2160" stroke="rgb(155, 30, 30)" stroke-width="3.5" stroke-linecap="round" fill="none" />
    <path d="M 801 2160 L 832 2128" stroke="rgb(155, 30, 30)" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <path d="M 822 2122 L 846 2110" stroke="rgb(155, 30, 30)" stroke-width="2" stroke-linecap="round" fill="none" />
  </svg>
  `;
  
  const aboutSvgBuf = await sharp(Buffer.from(aboutSvg)).png().toBuffer();
  
  const finalAbout = await sharp(aData, { raw: { width: aW, height: aH, channels: 4 } })
    .composite([
      { input: aboutSvgBuf, left: 0, top: 0 }
    ])
    .png()
    .toBuffer();
    
  // 4. Render Vector SVG for Posters Section:
  // "Motion Graphics , 3d Modeling , Visual FX , Video Editing" rendered with Intel One Mono
  // Red flourish tip continuing from (801, 0) down to (778, 38)
  const postersSvg = `
  <svg width="${pW}" height="${pH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="brushPosters" x="-20%" y="-30%" width="140%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03 0.06" numOctaves="4" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="16" xChannelSelector="R" yChannelSelector="G" result="displaced" />
        <feGaussianBlur in="displaced" stdDeviation="6" result="blurred" />
      </filter>
    </defs>
    <style>
      @font-face {
        font-family: 'IntelOneMono';
        src: url('data:font/truetype;charset=utf-8;base64,${intelBase64}') format('truetype');
      }
      .mono-text {
        font-family: 'IntelOneMono', monospace;
        font-size: 36px;
        font-weight: 700;
        fill: #000000;
        letter-spacing: 0.1px;
      }
    </style>
    
    <!-- Organic Brush Wash underlay (bottom half of Vector 10) -->
    <g filter="url(#brushPosters)" opacity="0.28">
      <path d="M 360 30 C 500 45, 900 40, 1750 35" stroke="#7a6e60" stroke-width="70" stroke-linecap="round" fill="none" />
      <path d="M 400 50 C 650 55, 1100 52, 1700 48" stroke="#5d5246" stroke-width="40" stroke-linecap="round" fill="none" />
    </g>
    
    <!-- Red flourish tip continuing from seam (801, 0) down to (778, 38) -->
    <path d="M 801 0 C 795 12, 788 26, 778 38" stroke="rgb(155, 30, 30)" stroke-width="3.5" stroke-linecap="round" fill="none" />
    
    <!-- Ultra-sharp vector typography for Motion Graphics... -->
    <text x="434" y="58" class="mono-text">Motion Graphics , 3d Modeling , Visual FX , Video Editing</text>
  </svg>
  `;
  
  const postersSvgBuf = await sharp(Buffer.from(postersSvg)).png().toBuffer();
  
  const finalPosters = await sharp(pData, { raw: { width: pW, height: pH, channels: postersOrig.info.channels } })
    .composite([
      { input: postersSvgBuf, left: 0, top: 0 }
    ])
    .jpeg({ quality: 97 })
    .toBuffer();
    
  await sharp(finalAbout).toFile('public/images/about-bg-clean.png');
  await sharp(finalPosters).toFile('public/images/posters-slice.jpg');
  console.log('Saved ultra-sharp images to public/images/');
  
  // 5. Test stitch:
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
  
  await sharp(stitch).toFile('crystal-sharp-stitch-preview.png');
  console.log('Saved crystal-sharp-stitch-preview.png!');
}

generateCrystalSharpAssets();
