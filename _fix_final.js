const fs = require('fs');
let src = fs.readFileSync('src/data/profiles.js', 'utf8');

// Fix 1: Duplicate id 101 - change the bisexual Jordan's ID to 132
// Match the jordan_bi profile specifically
const oldBiJordan = `{
    id: 101,
    username: "jordan_bi",
    displayName: "Jordan",`;
const newBiJordan = `{
    id: 132,
    username: "jordan_bi",
    displayName: "Jordan",`;

if (src.includes(oldBiJordan)) {
  src = src.replace(oldBiJordan, newBiJordan);
  console.log('✅ Fixed Jordan (bisexual) id from 101 to 132');
} else {
  console.log('⚠️ Could not find exact jordan_bi block to replace');
}

// Fix 2: Rename the second "Mark" (id 100, Brazil) to "Mario" to avoid duplicate names
const oldMarkBrazil = `    username: "Mark Ice",
    displayName: "Mark",`;
const newMarkBrazil = `    username: "Mark Ice",
    displayName: "Mario",`;

if (src.includes(oldMarkBrazil)) {
  src = src.replace(oldMarkBrazil, newMarkBrazil);
  console.log('✅ Renamed second Mark to Mario');
} else {
  console.log('⚠️ Could not find Mark Ice block to replace');
}

fs.writeFileSync('src/data/profiles.js', src, 'utf8');
console.log('Done writing file!');