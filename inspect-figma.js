const fs = require('fs');

const token = 'figd_aA7YoTADyjam-xMZld_nz6NjbziVwMZDYIy2lOA6';
const fileKey = 'cWOzH2yU1h7gySU8w39CDV';
const nodeId = '269:3234';

async function run() {
  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`, {
    headers: { 'X-Figma-Token': token }
  });
  const data = await res.json();
  fs.writeFileSync('figma-node-269-3234.json', JSON.stringify(data, null, 2));
  const node = data.nodes['269:3234'];
  console.log('Node Name:', node?.document?.name, 'Type:', node?.document?.type);
  console.log('BoundingBox:', node?.document?.absoluteBoundingBox);
  if (node?.document?.children) {
    console.log('Children count:', node.document.children.length);
    node.document.children.forEach((c, idx) => {
      console.log(idx, c.name, c.type, c.id, c.absoluteBoundingBox);
    });
  }
}

run();
