// hepsiniYap.js
const { execSync } = require('child_process');
const fs = require('fs');

// 1. items_part dosyalarını al
const partFiles = fs.readdirSync('.').filter(f => f.startsWith('items_part_') && f.endsWith('.json'));

// 2. Sırasıyla çek
for (const file of partFiles) {
  console.log(`🚀 Başlatılıyor: ${file}`);
  try {
    execSync(`node fiyatCekici_parca.js ${file}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ HATA: ${file} işlenemedi:`, err.message);
  }
}

// 3. Parçaları birleştir
console.log('\n🧩 Fiyat parçaları birleştiriliyor...');
try {
  execSync(`node merge_parts.js`, { stdio: 'inherit' });
  console.log('✅ Tamamlandı! prices.json oluşturuldu.');
} catch (err) {
  console.error('❌ merge_parts.js sırasında hata:', err.message);
}