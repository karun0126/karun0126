const fs = require('fs');
const data = JSON.parse(fs.readFileSync('figma-node-269-3234.json', 'utf8'));

function searchNodes(node, predicate, results = []) {
  if (predicate(node)) results.push(node);
  if (node.children) {
    for (const c of node.children) {
      searchNodes(c, predicate, results);
    }
  }
  return results;
}

const stars = searchNodes(data.nodes['269:3234'].document, n => n.name && n.name.toLowerCase().includes('star'));
console.log('Stars found:', stars.length);
stars.forEach(s => {
  const b = s.absoluteBoundingBox;
  console.log(`- Star: "${s.name}" id:${s.id} type:${s.type} pos:(${b?.x}, ${b?.y})`);
});

const abouts = searchNodes(data.nodes['269:3234'].document, n => n.name && n.name.toLowerCase().includes('about'));
console.log('Abouts found:', abouts.length);
abouts.forEach(a => {
  const b = a.absoluteBoundingBox;
  console.log(`- About: "${a.name}" id:${a.id} type:${a.type} pos:(${b?.x}, ${b?.y})`);
});
