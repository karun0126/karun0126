const fs = require('fs');
const data = JSON.parse(fs.readFileSync('figma-node-269-3234.json', 'utf8'));
const f98 = data.nodes['269:3234'].document;

console.log('Frame 98:', f98.id, f98.name, f98.absoluteBoundingBox);
f98.children.forEach(c => {
  const bb = c.absoluteBoundingBox;
  const bbox = bb ? '(' + Math.round(bb.x) + ', ' + Math.round(bb.y) + ') ' + Math.round(bb.width) + 'x' + Math.round(bb.height) : '';
  console.log(c.id, c.name, c.type, bbox);
});
