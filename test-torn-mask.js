const sharp = require('sharp');
const p = 'C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/';

async function testTornMask() {
  // ripped_paper_212_160 at scale 1 is 3961x3961
  // In 1x coords, Slide 2 is 1920x1080
  // relX = -1417, relY = -1440
  // So inside the 3961x3961 image, Slide 2 corresponds to:
  // left: 1417, top: 1440, width: 1920, height: 1080
  
  const mask1x = await sharp(p + 'ripped_paper_212_160.png')
    .extract({ left: 1417, top: 1440, width: 1920, height: 1080 })
    .toBuffer();

  // Extract alpha channel
  const alphaOnly = await sharp(mask1x)
    .extractChannel(3) // alpha channel
    .toFile(p + 'slide2_torn_paper_alpha.png');

  console.log('Saved slide2_torn_paper_alpha.png');
}

testTornMask();
