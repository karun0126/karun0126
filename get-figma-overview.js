const fs = require('fs');

let token = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/FIGMA_ACCESS_TOKEN=(.+)/);
  if (match) token = match[1].trim();
} catch (e) {}

const fileKey = 'cWOzH2yU1h7gySU8w39CDV';

async function getFileOverview() {
  const url = `https://api.figma.com/v1/files/${fileKey}?depth=2`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  const data = await res.json();
  console.log('File name:', data.name);
  data.document.children.forEach(page => {
    console.log(`\nPage: "${page.name}" id:${page.id}`);
    page.children?.forEach(topFrame => {
      const b = topFrame.absoluteBoundingBox;
      const bStr = b ? `(${Math.round(b.x)}, ${Math.round(b.y)}) ${Math.round(b.width)}x${Math.round(b.height)}` : 'no box';
      console.log(`  - [${topFrame.type}] "${topFrame.name}" id:${topFrame.id} bounds:${bStr}`);
    });
  });
}

getFileOverview();
