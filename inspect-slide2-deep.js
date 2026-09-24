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

const slide2 = findNode(data.nodes['269:3234'].document, '212:159');
console.log('Slide 2 name:', slide2.name);
console.log('Slide 2 clipsContent:', slide2.clipsContent);

slide2.children.forEach((c, i) => {
  console.log(`\n#${i} "${c.name}" id:${c.id} type:${c.type} visible:${c.visible !== false}`);
  console.log('  bounds:', c.absoluteBoundingBox);
  console.log('  opacity:', c.opacity, 'blendMode:', c.blendMode);
  if (c.fills) {
    console.log('  fills:', c.fills.map(f => `${f.type} blend:${f.blendMode} opacity:${f.opacity}`));
  }
});
