// parcalayici.js
const fs = require('fs');

// Ana JSON dosyasının yolu
const inputFile = 'items_tam.json';

// Her parçadaki maksimum item sayısı
const MAX_ITEMS_PER_FILE = 500;

// Giriş dosyasını oku
const rawData = fs.readFileSync(inputFile, 'utf8');
const fullData = JSON.parse(rawData);

// Tüm itemları tek bir listeye dönüştür (kasaları korumak için her itema caseId ekliyoruz)
let flatItems = [];

for (const caseId in fullData) {
    const caseObj = fullData[caseId];
    const caseName = caseObj.name;

    caseObj.items.forEach(item => {
        flatItems.push({
            name: item.name,
            wears: item.wears,
            caseId: caseId,
            caseName: caseName
        });
    });
}

// Parçalara böl
const totalParts = Math.ceil(flatItems.length / MAX_ITEMS_PER_FILE);

for (let i = 0; i < totalParts; i++) {
    const start = i * MAX_ITEMS_PER_FILE;
    const end = start + MAX_ITEMS_PER_FILE;
    const chunk = flatItems.slice(start, end);

    const fileName = `items_part_${i + 1}.json`;
    fs.writeFileSync(fileName, JSON.stringify(chunk, null, 2), 'utf8');
    console.log(`✔ ${fileName} oluşturuldu. (${chunk.length} item)`);
}

console.log(`\nToplam ${flatItems.length} item, ${totalParts} dosyaya bölündü.`);
