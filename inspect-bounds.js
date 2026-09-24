const fs = require('fs');

let token = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/FIGMA_ACCESS_TOKEN=(.+)/);
  if (match) token = match[1].trim();
} catch (e) {}

const fileKey = 'cWOzH2yU1h7gySU8w39CDV';
const nodeId = '191:63';

async function checkBounds() {
  const url = 'https://api.figma.com/v1/files/' + fileKey + '/nodes?ids=' + encodeURIComponent(nodeId);
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  const data = await res.json();
  const node = data.nodes[nodeId]?.document;
  
  // Also check HOME bounds (191:4)
  const homeRes = await fetch('https://api.figma.com/v1/files/' + fileKey + '/nodes?ids=191%3A4', { headers: { 'X-Figma-Token': token } });
  const homeData = await homeRes.json();
  const homeB = homeData.nodes['191:4'].document.absoluteBoundingBox;

  console.log('HOME (191:4) bounds:', homeB);

  node.children.forEach((c, i) => {
    const b = c.absoluteBoundingBox;
    const relX = Math.round(b.x - homeB.x);
    const relY = Math.round(b.y - homeB.y);
    console.log('#' + i + ' "' + c.name + '" ' + c.id + ' type:' + c.type + ' relPos:(' + relX + ',' + relY + ') size:' + Math.round(b.width) + 'x' + Math.round(b.height));
  });
}
checkBounds();
