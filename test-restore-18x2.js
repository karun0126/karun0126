const sharp = require('sharp');
const p = 'C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/';

async function testRestore18x2() {
  // Extract 18x2 cleanly from figma_home_exported.png
  // Bounds in 2x: left: 3120, top: 1474, width: 578, height: 686
  // In trimmed_hand_posters (width: 1566, height: 2160), left starts at 2274.
  // relLeft = 3120 - 2274 = 846, relTop = 1474
  const poster18x2 = await sharp('public/images/figma_home_exported.png')
    .extract({ left: 3120, top: 1474, width: 578, height: 2160 - 1474 })
    .toBuffer();

  const restoredHand = await sharp(p + 'trimmed_hand_posters.png')
    .composite([
      {
        input: poster18x2,
        left: 846,
        top: 1474
      }
    ])
    .png()
    .toBuffer();

  await sharp(restoredHand).toFile(p + 'restored_hand_posters.png');
  await sharp(restoredHand).resize(800).toFile(p + 'restored_hand_posters_preview.png');

  console.log('Saved restored_hand_posters.png');
}

testRestore18x2();
