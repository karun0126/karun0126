const fs = require('fs');
const data = JSON.parse(fs.readFileSync('figma-node-269-3234.json', 'utf8'));

function findNode(node, id) {
  if (node.id === id) return node;
  if (node.children) {
    for (const c of node.children) {
      const found = findNode(c, id);
      if (found) return found;
    }
  }
  return null;
}

const home = findNode(data.nodes['269:3234'].document, '212:226');
const slide2 = findNode(data.nodes['269:3234'].document, '212:159');

console.log('=== HOME (212:226) ===');
console.log('Backgrounds/fills:', JSON.stringify(home.fills || home.background));
home.children.forEach(c => {
  const b = c.absoluteBoundingBox;
  const relX = Math.round(b.x - home.absoluteBoundingBox.x);
  const relY = Math.round(b.y - home.absoluteBoundingBox.y);
  console.log(`- [${c.type}] "${c.name}" id:${c.id} pos:(${relX}, ${relY}) size:${Math.round(b.width)}x${Math.round(b.height)} fills:${JSON.stringify(c.fills?.map(f => f.type + ' ' + (f.color ? JSON.stringify(f.color) : '')))}`);
});

console.log('\n=== SLIDE 16:9 - 2 (212:159) ===');
console.log('Backgrounds/fills:', JSON.stringify(slide2.fills || slide2.background));
slide2.children.forEach(c => {
  const b = c.absoluteBoundingBox;
  const relX = Math.round(b.x - slide2.absoluteBoundingBox.x);
  const relY = Math.round(b.y - slide2.absoluteBoundingBox.y);
  console.log(`- [${c.type}] "${c.name}" id:${c.id} pos:(${relX}, ${relY}) size:${Math.round(b.width)}x${Math.round(b.height)} fills:${JSON.stringify(c.fills?.map(f => f.type + ' ' + (f.color ? JSON.stringify(f.color) : '')))}`);
});
