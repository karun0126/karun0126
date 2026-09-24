const fs = require('fs');

let token = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/FIGMA_ACCESS_TOKEN=(.+)/);
  if (match) token = match[1].trim();
} catch (e) {}

const fileKey = 'cWOzH2yU1h7gySU8w39CDV';

async function checkNodes() {
  const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=191:991,269:2825`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  const data = await res.json();
  
  for (const id in data.nodes) {
    const doc = data.nodes[id].document;
    console.log(`\nNode ${id}: "${doc.name}" type:${doc.type}`);
    doc.children?.forEach(c => {
      const b = c.absoluteBoundingBox;
      const bStr = b ? `(${Math.round(b.x)}, ${Math.round(b.y)}) ${Math.round(b.width)}x${Math.round(b.height)}` : '';
      console.log(`  - [${c.type}] "${c.name}" id:${c.id} bounds:${bStr}`);
    });
  }
}

checkNodes();
