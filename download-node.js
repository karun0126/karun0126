const fs = require('fs');

let token = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/FIGMA_ACCESS_TOKEN=(.+)/);
  if (match) token = match[1].trim();
} catch (e) {}

const fileKey = 'cWOzH2yU1h7gySU8w39CDV';

async function downloadNode(id, filename) {
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(id)}&scale=1&format=png`;
  console.log('Fetching image URL for', id);
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  const data = await res.json();
  const imgUrl = data.images[id];
  console.log('Image URL:', imgUrl);
  const imgRes = await fetch(imgUrl);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  fs.writeFileSync(filename, buf);
  console.log('Saved to', filename, buf.length, 'bytes');
}

downloadNode('212:160', 'C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/ripped_paper_212_160.png');
