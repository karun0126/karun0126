const fs = require('fs');
const sharp = require('sharp');

async function testPerfectSharpBadge() {
  const fontBase64 = fs.readFileSync('bohemy_font/Bohemy.ttf').toString('base64');
  
  // 1. Let's inspect check-baked-to-posters-stitch.png
  // width: 1500, height: 340 (left: 300 in 3840 space)
  // Seam is at y = 170.
  
  // In posters-slice-pre-seam-fix.jpg:
  // "Motion Graphics..." is at x = 437 to 1499, y = 35 to 69 in Posters.
  // In check-baked-to-posters-stitch:
  // "Motion Graphics..." starts at x = 437 - 300 = 137, y = 170 + 35 = 205.
  
  // In Figma:
  // "Currently Exploring" x in 2x space = 215.25 * 2 = 430.5
  // Relative to left 300: x = 430.5 - 300 = 130.5.
  // Y in Slide 2: -3942 - (-4990) = 1048 * 2 = 2096.
  // In our stitch (starts at y = 1990 of About):
  // y = 2096 - 1990 = 106!
  // Font size: 33 * 2 = 66px.
  // Line height / baseline: with fontSize 66, baseline is at y = 106 + 54 = 160!
  
  // 2. Brush stroke underlay:
  // Let's create an organic brush stroke overlay at y = 60 to 240, x = 120 to 1400:
  // In Figma: Vector 10 is an OVERLAY brush stroke at y = -3970 in 1x (2039 in 2x space).
  // In our stitch (starts at 1990): 2039 - 1990 = 49!
  // It spans y = 49 to 49 + 313 = 362!
  
  // Let's create the SVG for the badge with the brush stroke and vector text:
  const svg = `
  <svg width="1500" height="340" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="brushFilter" x="-10%" y="-20%" width="120%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04 0.08" numOctaves="4" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" result="displaced" />
        <feGaussianBlur in="displaced" stdDeviation="4" result="blurred" />
      </filter>
    </defs>
    <style>
      @font-face {
        font-family: 'Bohemy';
        src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
      }
      .title {
        font-family: 'Bohemy', cursive;
        font-size: 68px;
        fill: rgb(155, 45, 45);
        letter-spacing: 0.2px;
      }
    </style>
    
    <!-- Organic Brush Stroke Underlay matching Figma Vector 10 -->
    <g filter="url(#brushFilter)" opacity="0.42">
      <!-- Main body of the brush stroke -->
      <path d="M 80 165 C 200 150, 600 155, 1420 160" stroke="#8a7d6e" stroke-width="85" stroke-linecap="round" fill="none" />
      <path d="M 120 150 C 400 145, 900 148, 1380 152" stroke="#6e6255" stroke-width="45" stroke-linecap="round" fill="none" />
    </g>
    
    <!-- Vector 9: Red flourish underline starting under 'Exploring' and angled down-right to (501, 170) -->
    <!-- In Posters, the tip starts at (501, 170) and goes down-left to (478, 208) -->
    <!-- In About, it connects up-right from (501, 170) to (535, 138) and has a parallel tick at (545, 132) -->
    <path d="M 450 146 C 475 148, 495 160, 501 170" stroke="rgb(155, 30, 30)" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 501 170 L 532 142" stroke="rgb(155, 30, 30)" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <path d="M 522 135 L 545 125" stroke="rgb(155, 30, 30)" stroke-width="2" stroke-linecap="round" fill="none" />
    
    <!-- Ultra-sharp Vector Title -->
    <text x="135" y="152" class="title">Currently Exploring</text>
  </svg>
  `;
  
  const badgePng = await sharp(Buffer.from(svg)).png().toBuffer();
  
  const comp = await sharp('check-baked-to-posters-stitch.png')
    .composite([
      { input: badgePng, left: 0, top: 0 }
    ])
    .png()
    .toBuffer();
    
  await sharp(comp).toFile('check-perfect-sharp-badge.png');
  console.log('Saved check-perfect-sharp-badge.png');
}

testPerfectSharpBadge();
