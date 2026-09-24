const fs = require('fs');
const path = require('path');

const regex = /['"`](\/images\/[^'"`]+)['"`]/g;
const files = [
  'app/page.tsx',
  'app/globals.css',
  'components/HeroSection.tsx',
  'components/AboutSection.tsx',
  'components/PostersSection.tsx',
  'components/CaseStudySection.tsx',
  'components/SketchbookSection.tsx',
  'components/Footer.tsx',
  'components/HudNav.tsx',
  'components/LightboxModal.tsx',
  'components/CinematicIntro.tsx',
  'components/CursorTrail.tsx'
];

const checked = new Set();
let missingCount = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    const assetPath = match[1];
    if (checked.has(assetPath)) continue;
    checked.add(assetPath);
    const diskPath = path.join('public', assetPath.replace(/^\//, ''));
    const exists = fs.existsSync(diskPath);
    if (!exists) {
      console.log('MISSING:', assetPath, 'referenced in', file);
      missingCount++;
    } else {
      const stat = fs.statSync(diskPath);
      console.log('OK (' + stat.size + ' bytes):', assetPath);
    }
  }
}
console.log('Total checked:', checked.size, 'Missing:', missingCount);
