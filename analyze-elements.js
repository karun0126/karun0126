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

const g79 = findNode(data.nodes['269:3234'].document, '212:285');
const home = findNode(data.nodes['269:3234'].document, '212:226');

console.log('Group 79 in HOME:');
g79.children.forEach((c, idx) => {
  const rx = Math.round(c.absoluteBoundingBox.x - home.absoluteBoundingBox.x);
  const ry = Math.round(c.absoluteBoundingBox.y - home.absoluteBoundingBox.y);
  const w = Math.round(c.absoluteBoundingBox.width);
  const h = Math.round(c.absoluteBoundingBox.height);
  console.log('#' + idx + ' id:' + c.id + ' name:"' + c.name + '" type:' + c.type + ' pos:(' + rx + ', ' + ry + ') size:' + w + 'x' + h);
});
