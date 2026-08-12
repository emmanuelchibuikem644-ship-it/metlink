const fs = require('fs');
const src = fs.readFileSync('src/data/profiles.js', 'utf8');

// Extract the array
const start = src.indexOf('[', src.indexOf('const profiles'));
const end = src.lastIndexOf(']');
const arrStr = src.slice(start, end + 1);
const profiles = eval(`(${arrStr})`);

// Fix prices - cap at $600 (60000 cents)
const over600 = profiles.filter(p => (p.price_cents || 0) > 60000);
console.log('Profiles over $600 to fix:', over600.length);
over600.forEach(p => {
  const oldPrice = p.price_cents;
  p.price_cents = 60000; // cap at $600
  console.log(`  Fixed ${p.displayName} (id=${p.id}): $${(oldPrice/100).toFixed(2)} → $600.00`);
});

// Check for duplicate ID 101 - Jordan appears in both gay and bisexual
const jordans = profiles.filter(p => p.id === 101);
console.log('\nID 101 (Jordan) entries:', jordans.length);
jordans.forEach((p, i) => console.log(`  ${i}: orientation=${p.orientation}, gender=${p.gender}, displayName=${p.displayName}`));

// Fix duplicate: change the bisexual Jordan to a new ID
if (jordans.length > 1) {
  // Find the max ID to assign a new one
  const maxId = Math.max(...profiles.map(p => p.id));
  jordans[1].id = maxId + 1;
  console.log(`  Changed bisexual Jordan to id ${maxId + 1}`);
}

// Generate the new file content by directly rewriting the array
// We need to rebuild the file preserving structure. Let's do a targeted replacement
const newArrStr = JSON.stringify(profiles, null, 2)
  .replace(/"id": (\d+)/g, 'id: $1')
  .replace(/"username": "([^"]*)"/g, 'username: "$1"')
  .replace(/"displayName": "([^"]*)"/g, 'displayName: "$1"')
  .replace(/"verified": (true|false)/g, 'verified: $1')
  .replace(/"online": (true|false)/g, 'online: $1')
  .replace(/"age": (\d+)/g, 'age: $1')
  .replace(/"city": "([^"]*)"/g, 'city: "$1"')
  .replace(/"country": "([^"]*)"/g, 'country: "$1"')
  .replace(/"gender": "([^"]*)"/g, 'gender: "$1"')
  .replace(/"orientation": "([^"]*)"/g, 'orientation: "$1"')
  .replace(/"avatar": "([^"]*)"/g, 'avatar: "$1"')
  .replace(/"cover": "([^"]*)"/g, 'cover: "$1"')
  .replace(/"bio": "([^"]*)"/g, 'bio: "$1"')
  .replace(/"followers": "([^"]*)"/g, 'followers: "$1"')
  .replace(/"posts": (\d+)/g, 'posts: $1')
  .replace(/"price_cents": (\d+)/g, 'price_cents: $1')
  .replace(/"gallery": (\[[^\]]*\])/g, 'gallery: $1');

// Write the new file
const finalContent = `const profiles = ${newArrStr};\n\nexport default profiles;\n`;
fs.writeFileSync('src/data/profiles.js', finalContent, 'utf8');
console.log('\nFile written successfully!');