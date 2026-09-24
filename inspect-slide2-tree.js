const fs = require('fs');
const data = JSON.parse(fs.readFileSync('figma-node-269-3234.json', 'utf8'));

function findNode(n, id) {
  if (n.id === id) return n;
  if (n.children) {
    for (let c of n.children) {
      let f = findNode(c, id);
      if (f) return f;
    }
  }
  return null;
}

const doc = data.nodes['269:3234'].document;
const slide2 = findNode(doc, '212:159');

function listAll(node, depth = 0) {
  const indent = '  '.repeat(depth);
  const bbox = node.absoluteBoundingBox;
  let pos = '';
  if (bbox) {
    const rx = Math.round(bbox.x - slide2.absoluteBoundingBox.x);
    const ry = Math.round(bbox.y - slide2.absoluteBoundingBox.y);
    pos = ` pos:(${rx}, ${ry}) size:${Math.round(bbox.width)}x${Math.round(bbox.height)}`;
  }
  console.log(`${indent}[${node.type}] "${node.name}" id:${node.id}${pos}`);
  if (node.children) {
    node.children.forEach(c => listAll(c, depth + 1));
  }
}

listAll(slide2);
