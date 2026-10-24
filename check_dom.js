const fs = require('fs');
const html = fs.readFileSync('C:/Users/user/Desktop/NBG-468/3-oy/9-dars/index.html', 'utf8');
const js = fs.readFileSync('C:/Users/user/Desktop/NBG-468/3-oy/9-dars/game.js', 'utf8');

const regex = /getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const idsInJs = new Set();
while ((match = regex.exec(js)) !== null) {
  idsInJs.add(match[1]);
}

const missingIds = [];
for (const id of idsInJs) {
  if (!html.includes('id="' + id + '"') && !html.includes("id='" + id + "'")) {
    missingIds.push(id);
  }
}
console.log('Missing IDs:', missingIds);
