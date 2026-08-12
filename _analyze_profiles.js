const fs = require('fs');
const src = fs.readFileSync('src/data/profiles.js', 'utf8');

// Extract the array
const start = src.indexOf('[', src.indexOf('const profiles'));
const end = src.lastIndexOf(']');
const arrStr = src.slice(start, end + 1);
const profiles = eval(`(${arrStr})`);

console.log('Total profiles:', profiles.length);

// Check for high prices
const highPrices = profiles.filter(p => (p.price_cents || 0) > 60000);
console.log('\nProfiles with price > $600 (60000 cents):', highPrices.length);
highPrices.forEach(p => {
  console.log(`  - ${p.displayName} (id=${p.id}, orientation=${p.orientation}, gender=${p.gender}): $${(p.price_cents/100).toFixed(2)}`);
});

// Check for price_cents missing
const noPrice = profiles.filter(p => !p.price_cents);
console.log('\nProfiles with no price:', noPrice.length);
noPrice.forEach(p => console.log(`  - ${p.displayName} (id=${p.id}, orientation=${p.orientation})`));

// Check profiles by orientation
const byOrientation = {};
profiles.forEach(p => {
  byOrientation[p.orientation] = (byOrientation[p.orientation] || 0) + 1;
});
console.log('\nBy orientation:', JSON.stringify(byOrientation));

// Check duplicates by id
const seen = new Map();
const duplicates = [];
profiles.forEach(p => {
  if (seen.has(p.id)) {
    duplicates.push({ id: p.id, name: p.displayName, orientations: [seen.get(p.id).orientation, p.orientation] });
  }
  seen.set(p.id, p);
});
console.log('\nDuplicate IDs:', duplicates.length);
duplicates.forEach(d => console.log(`  - id=${d.id} "${d.name}" appears in: ${d.orientations.join(', ')}`));

// Check gallery/video files
const publicFiles = fs.readdirSync('public');
console.log('\nSample video files in public:', publicFiles.filter(f => f.includes('.mp4')).slice(0, 10));

// Check if profile references videos in gallery
const profilesWithVideo = profiles.filter(p => p.gallery && p.gallery.some(g => g.includes('.mp4')));
console.log('\nProfiles with video in gallery:', profilesWithVideo.length);

// Check existing profile galleries
const firstProfile = profiles.find(p => p.id === 1);
console.log('\nSample gallery entries for id=1:', firstProfile.gallery ? firstProfile.gallery.length : 0);

// Check what images exist for potential galleries
const recentImgs = publicFiles.filter(f => f.includes('2026-08-11')).sort();
console.log('\nNew images (2026-08-11):', recentImgs.length);
recentImgs.slice(0, 20).forEach(f => console.log(`  - ${f}`));