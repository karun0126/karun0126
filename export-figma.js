const fs = require('fs');

let token = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/FIGMA_ACCESS_TOKEN=(.+)/);
  if (match) token = match[1].trim();
} catch (e) {}

const fileKey = 'cWOzH2yU1h7gySU8w39CDV';
const nodeId = '212:285';

async function testExport() {
  const url = 'https://api.figma.com/v1/images/' + fileKey + '?ids=' + encodeURIComponent(nodeId) + '&scale=2&format=png';
  console.log('Fetching:', url);
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': token }
  });
  const data = await res.json();
  console.log('Response:', data);
}

testExport();
