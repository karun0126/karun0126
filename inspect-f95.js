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

const f95 = findNode(data.nodes['269:3234'].document, '269:1881');
console.log('Frame 95 fills:', JSON.stringify(f95.fills || f95.background));
console.log('Frame 95 children count:', f95.children.length);

f95.children.forEach((c, idx) => {
  const b = c.absoluteBoundingBox;
  const relX = Math.round(b.x - f95.absoluteBoundingBox.x);
  const relY = Math.round(b.y - f95.absoluteBoundingBox.y);
  console.log(`#${idx} [${c.type}] "${c.name}" id:${c.id} pos:(${relX}, ${relY}) size:${Math.round(b.width)}x${Math.round(b.height)}`);
});
