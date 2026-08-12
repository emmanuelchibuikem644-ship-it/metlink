const fs = require('fs');
const src = fs.readFileSync('src/data/profiles.js', 'utf8');

// Fix duplicate ID: change the bisexual Jordan's ID from 101 to 132
const fixed = src.replace(
  `  {
    id: 101,
    username: "jordan_bi",
    displayName: "Jordan",`,
  `  {
    id: 132,
    username: "jordan_bi",
    displayName: "Jordan",`
);

// Also fix duplicate name "Mark" - id 100 and id 89 both named Mark
// Change id 100 "Mark" to "Mario"
const fixed2 = fixed.replace(
  `    displayName: "Mark",
    verified: true,
    online: true,
    age: 27,                         
    city: "Sao Paulo",`,
  `    displayName: "Mario",
    verified: true,
    online: true,
    age: 27,                         
    city: "Sao Paulo",`
);

fs.writeFileSync('src/data/profiles.js', fixed2, 'utf8');
console.log('Fixed duplicate IDs!');