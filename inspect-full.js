const fs = require('fs');
const data = JSON.parse(fs.readFileSync('figma-node-269-3234.json', 'utf8'));
const doc = data.nodes['269:3234'].document;

console.log('Document root:', doc.name, doc.id, doc.type);
if (doc.children) {
  doc.children.forEach(c => {
    const b = c.absoluteBoundingBox;
    const boxStr = b ? `(${Math.round(b.x)}, ${Math.round(b.y)}) ${Math.round(b.width)}x${Math.round(b.height)}` : 'no box';
    console.log(`- [${c.type}] "${c.name}" id:${c.id} bounds:${boxStr}`);
    if (c.children) {
      c.children.forEach(gc => {
        const gb = gc.absoluteBoundingBox;
        const gboxStr = gb ? `(${Math.round(gb.x)}, ${Math.round(gb.y)}) ${Math.round(gb.width)}x${Math.round(gb.height)}` : 'no box';
        console.log(`    - [${gc.type}] "${gc.name}" id:${gc.id} bounds:${gboxStr}`);
      });
    }
  });
}
