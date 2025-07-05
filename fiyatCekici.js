const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Ayarlar
const INPUT_FILE = 'items_tam.json';   // items dosyan
const OUTPUT_FILE = 'prices.json';     // fiyatların kaydedileceği dosya
const DELAY_MS = 2000;                 // istekler arası gecikme (ms)

// Wear formatını Steam Market uyumlu yapar
function formatWear(wear) {
  // Ör: "factory-new" → "Factory New"
  return wear
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Market linki oluşturur
function createMarketURL(itemName, wear) {
  const marketHashName = `${itemName} (${wear})`;
  return `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(marketHashName)}`;
}

// Fiyatı çek
async function fetchPrice(itemName, wear) {
  const url = createMarketURL(itemName, wear);
  try {
    const res = await axios.get(url);
    if (res.data && res.data.success) {
      return res.data.lowest_price || null;
    }
    return null;
  } catch (e) {
    console.error(`HATA: ${itemName} (${wear}) için fiyat alınamadı. ${e.message}`);
    return null;
  }
}

// Main async fonksiyon
async function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Girdi dosyası bulunamadı: ${INPUT_FILE}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

  const prices = {}; // { itemName: { wearName: price } }

  // Her kasanın items'larını sırayla gez
  for (const caseKey in rawData) {
    const kasa = rawData[caseKey];
    if (!kasa.items || !Array.isArray(kasa.items)) continue;

    console.log(`\n==> ${kasa.name} (${caseKey}) için fiyatlar çekiliyor...`);

    for (const item of kasa.items) {
      if (!item.name || !item.wears || !Array.isArray(item.wears)) continue;

      prices[item.name] = prices[item.name] || {};

      for (const rawWear of item.wears) {
        const wear = formatWear(rawWear);

        const price = await fetchPrice(item.name, wear);
        prices[item.name][wear] = price;

        console.log(`- ${item.name} [${wear}] → ${price || 'YOK'}`);

        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }
  }

  // Fiyatları dosyaya yaz
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(prices, null, 2), 'utf-8');
  console.log(`\n✔ Tüm fiyatlar '${OUTPUT_FILE}' dosyasına kaydedildi.`);
}

main();