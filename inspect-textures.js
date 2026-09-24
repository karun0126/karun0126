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

const n190 = findNode(data.nodes['269:3234'].document, '212:190');
const n191 = findNode(data.nodes['269:3234'].document, '212:191');
console.log('n190:', n190.name, n190.blendMode, n190.fills);
console.log('n191:', n191.name, n191.blendMode, n191.fills);
