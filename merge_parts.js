import fs from 'fs';

const files = fs.readdirSync('.').filter(f=>f.startsWith('part_'));
let merged = {};

files.forEach(f => {
  const data = JSON.parse(fs.readFileSync(f, 'utf-8'));
  merged = {...merged, ...data};
  console.log(`✅ ${f} eklendi`);
});

fs.writeFileSync('prices.json', JSON.stringify(merged, null, 2));
console.log(`🎉 Tüm parçalar birleştirildi. Kayıt sayısı: ${Object.keys(merged).length}`);
