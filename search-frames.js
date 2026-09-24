const fs = require('fs');

let token = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/FIGMA_ACCESS_TOKEN=(.+)/);
  if (match) token = match[1].trim();
} catch (e) {}

const fileKey = 'cWOzH2yU1h7gySU8w39CDV';

async function findMatch() {
  const res = await fetch('https://api.figma.com/v1/files/' + fileKey, {
    headers: { 'X-Figma-Token': token }
  });
  const data = await res.json();
  
  data.document.children.forEach(page => {
    console.log('PAGE:', page.name, page.id);
    page.children.forEach(c => {
      if (c.type === 'FRAME' || c.type === 'SECTION') {
        const b = c.absoluteBoundingBox;
        const bbox = b ? '(' + Math.round(b.x) + ',' + Math.round(b.y) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) + ')' : '';
        console.log('  FRAME:', c.name, c.id, bbox);
      }
    });
  });
}
findMatch();
