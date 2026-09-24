const fs = require('fs');
const sharp = require('sharp');

async function testFontRender() {
  const fontBase64 = fs.readFileSync('bohemy_font/Bohemy.ttf').toString('base64');
  
  const svg = `
  <svg width="600" height="120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @font-face {
        font-family: 'Bohemy';
        src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
      }
      .text {
        font-family: 'Bohemy', cursive;
        font-size: 66px;
        fill: rgb(142, 46, 46);
      }
    </style>
    <text x="10" y="80" class="text">Currently Exploring</text>
  </svg>
  `;
  
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  await sharp(buf).toFile('check-bohemy-render.png');
  console.log('Saved check-bohemy-render.png');
}

testFontRender();
