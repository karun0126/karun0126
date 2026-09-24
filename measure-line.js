const sharp = require('sharp');

async function findLinePositions() {
  const hero = sharp('public/images/figma_home_exported.png');
  const { data: hData, info: hInfo } = await hero.raw().toBuffer({ resolveWithObject: true });
  
  // Look at y = 2150 (bottom of Hero in 2x coords) across x = 1800 to 1830
  let maxBrightness = 0;
  let bestX = 0;
  for (let x = 1800; x < 1830; x++) {
    const idx = (2150 * hInfo.width + x) * hInfo.channels;
    const brightness = hData[idx] + hData[idx+1] + hData[idx+2];
    if (brightness > maxBrightness) {
      maxBrightness = brightness;
      bestX = x;
    }
  }
  console.log('Hero bottom line center x at y = 2150:', bestX, 'brightness:', maxBrightness);

  // Check where node_212_162 has its white line
  const v4 = sharp('C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/node_212_162.png');
  const { data: vData, info: vInfo } = await v4.raw().toBuffer({ resolveWithObject: true });
  let maxV = 0;
  let bestVX = 0;
  for (let x = 0; x < vInfo.width; x++) {
    const idx = (10 * vInfo.width + x) * vInfo.channels;
    const b = vData[idx] + vData[idx+1] + vData[idx+2];
    if (b > maxV) {
      maxV = b;
      bestVX = x;
    }
  }
  console.log('Vector 4 line center inside image:', bestVX, 'total width:', vInfo.width);
  console.log('Ideal placement left for Vector 4:', bestX - bestVX);
}

findLinePositions();
