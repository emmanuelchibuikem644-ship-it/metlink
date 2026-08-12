const fs = require('fs');
let src = fs.readFileSync('src/data/profiles.js', 'utf8');

// Fix 1: Find the jordan_bi profile (bisexual section) and change its id from 101 to 132
// The jordan_bi profile is the one with username "jordan_bi"
const jordanRegex = /(\{\s*\n\s*id:\s*)101(\s*,\s*\n\s*username:\s*"jordan_bi")/;
if (jordanRegex.test(src)) {
  src = src.replace(jordanRegex, '$1132$2');
  console.log('✅ Fixed Jordan (bisexual) id from 101 to 132');
} else {
  console.log('⚠️ Could not find jordan_bi block');
}

// Fix 2: Rename the second "Mark" (id 100, Brazil) to "Mario"
const markRegex = /(username:\s*"Mark Ice",\s*\n\s*displayName:\s*)"Mark"/;
if (markRegex.test(src)) {
  src = src.replace(markRegex, '$1"Mario"');
  console.log('✅ Renamed second Mark to Mario');
} else {
  console.log('⚠️ Could not find Mark Ice block');
}

fs.writeFileSync('src/data/profiles.js', src, 'utf8');
console.log('Done writing file!');