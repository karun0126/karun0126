const sharp = require('sharp');
const p = 'C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/.user_uploaded/media_1790102199675.png';

async function sampleImage1() {
  const { data, info } = await sharp(p).raw().toBuffer({ resolveWithObject: true });
  console.log('Image 1 info:', info);

  // Function to sample color at (x, y)
  function getColor(x, y) {
    const idx = (y * info.width + x) * info.channels;
    return [data[idx], data[idx+1], data[idx+2]];
  }

  console.log('Color around 01 ABOUT (x: 460, y: 80):', getColor(460, 80));
  console.log('Color in dark seam (x: 400, y: 150):', getColor(400, 150));
  console.log('Color to left of star (x: 400, y: 200):', getColor(400, 200));
  console.log('Color to right of star (x: 480, y: 200):', getColor(480, 200));
  console.log('Color at star center (x: 435, y: 215):', getColor(435, 215));
  console.log('Color at bottom cream paper (x: 435, y: 280):', getColor(435, 280));
  console.log('Color at far right (x: 850, y: 150):', getColor(850, 150));
}

sampleImage1();
