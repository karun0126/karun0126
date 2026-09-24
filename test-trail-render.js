const sharp = require('sharp');

// 16 points S-curve
const pts = [];
for (let i = 0; i < 16; i++) {
  const t = i / 15;
  const x = 50 + t * 300;
  const y = 200 + Math.sin(t * Math.PI * 2) * 60;
  pts.push({ x, y });
}

function chaikin(points) {
  if (points.length < 3) return points;
  const res = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    res.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
    res.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
  }
  res.push(points[points.length - 1]);
  return res;
}

const smooth = chaikin(chaikin(pts));

const dists = [0];
for (let i = 1; i < smooth.length; i++) {
  const d = Math.hypot(smooth[i].x - smooth[i-1].x, smooth[i].y - smooth[i-1].y);
  dists.push(dists[i-1] + d);
}
const totalLen = dists[dists.length - 1];

function renderSvg(bg, colorR, colorG, colorB, shadowColor) {
  let circles = [];
  const BASE_RADIUS = 2.8;
  const step = 1.4;
  let currIdx = 0;

  for (let d = 0; d <= totalLen; d += step) {
    while (currIdx < dists.length - 1 && dists[currIdx + 1] < d) {
      currIdx++;
    }
    const segStart = dists[currIdx];
    const segEnd = dists[currIdx + 1];
    const segT = (d - segStart) / (segEnd - segStart || 1);
    const x = smooth[currIdx].x + (smooth[currIdx + 1].x - smooth[currIdx].x) * segT;
    const y = smooth[currIdx].y + (smooth[currIdx + 1].y - smooth[currIdx].y) * segT;

    const t = d / totalLen;
    const r = Math.max(0.3, BASE_RADIUS * Math.pow(1 - t, 1.2));
    const alpha = Math.pow(1 - t, 0.75);

    circles.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="rgb(${colorR},${colorG},${colorB})" fill-opacity="${alpha.toFixed(2)}" />`);
  }

  return `
  <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${bg}" />
    ${circles.join('\n')}
  </svg>
  `;
}

// 1. Greyish black on cream paper (#ece4d7)
const paperSvg = renderSvg('#ece4d7', 35, 35, 35, 'rgba(0,0,0,0.06)');
sharp(Buffer.from(paperSvg)).png().toFile('test-grey-on-paper.png');

// 2. Red on black background (#0a0a0a)
const blackSvg = renderSvg('#0a0a0a', 230, 20, 25, 'rgba(230,20,25,0.25)');
sharp(Buffer.from(blackSvg)).png().toFile('test-red-on-black.png').then(() => {
  console.log('Saved test-grey-on-paper.png and test-red-on-black.png');
});
