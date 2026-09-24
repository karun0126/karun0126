const fs = require('fs');

let token = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/FIGMA_ACCESS_TOKEN=(.+)/);
  if (match) token = match[1].trim();
} catch (e) {}

const fileKey = 'cWOzH2yU1h7gySU8w39CDV';

async function checkPageBg() {
  const url = `https://api.figma.com/v1/files/${fileKey}?depth=1`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  const data = await res.json();
  const page = data.document.children[0];
  console.log('Page background color:', page.backgroundColor);
  console.log('Page fills:', page.background);
}

checkPageBg();
