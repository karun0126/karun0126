const fs = require('fs');
const sharp = require('sharp');
const bohemyBase64 = fs.readFileSync('bohemy_font/Bohemy.ttf').toString('base64');

async function testExactBase() {
  for (const base of [2136, 2138, 2140, 2142, 2144]) {
    const svg = `
    <svg width="1000" height="120" viewBox="0 0 1000 120" xmlns="http://www.w3.org/2000/svg">
      <style>
        @font-face {
          font-family: 'Bohemy';
          src: url('data:font/truetype;charset=utf-8;base64,${bohemyBase64}') format('truetype');
        }
        .text {
          font-family: 'Bohemy', cursive;
          font-size: 66px;
          fill: rgb(155, 45, 45);
        }
      </style>
      <text x="430" y="${base - 2080}" class="text">Currently Exploring</text>
    </svg>
    `;
    const buf = await sharp(Buffer.from(svg)).raw().toBuffer({ resolveWithObject: true });
    // check row y = 80 (which is 2080 + 80 = 2160)
    const row80Reds = [];
    for (let x = 0; x < 1000; x++) {
      const idx = (80 * 1000 + x) * buf.info.channels;
      if (buf.data[idx] > 120 && buf.data[idx+1] < 80) row80Reds.push(x);
    }
    console.log('Base ' + base + ' at y=2160 (row 80):', row80Reds.length > 0 ? row80Reds.join(', ') : 'none');
  }
}
testExactBase();
