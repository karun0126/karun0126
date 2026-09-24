const fs = require('fs');

let token = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/FIGMA_ACCESS_TOKEN=(.+)/);
  if (match) token = match[1].trim();
} catch (e) {}

const fileKey = 'cWOzH2yU1h7gySU8w39CDV';

async function exportNodes() {
  const ids = '212:162,212:163,212:164';
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&scale=2&format=png`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  const data = await res.json();
  console.log('Export URLs:', data.images);

  for (const id in data.images) {
    const imgUrl = data.images[id];
    if (imgUrl) {
      const imgRes = await fetch(imgUrl);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const safeName = id.replace(':', '_');
      fs.writeFileSync(`C:/Users/karun/.gemini/antigravity-ide/brain/afb19f10-7a8e-4d31-9c54-9de469ad4246/node_${safeName}.png`, buf);
      console.log(`Saved node_${safeName}.png`, buf.length, 'bytes');
    }
  }
}

exportNodes();
