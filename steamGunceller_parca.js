import axios from 'axios';
import fs from 'fs';
import path from 'path';

const items = JSON.parse(fs.readFileSync('items.json'));
const wears = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"];
const start = Number(process.argv[2] || 0);
const count = Number(process.argv[3] || 500);
function delay(ms){ return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const end = Math.min(start + count, items.length);
  const out = {};

  for (let i = start; i < end; i++) {
    for (const w of wears) {
      const name = `${items[i]} (${w})`;
      const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(name)}`;
try {
  const res = await axios.get(url);
  if (res.data && res.data.success) {
    out[name] = {
      lowest: res.data.lowest_price || null,
      median: res.data.median_price || null
    };
    console.log(`[✓] ${name}: ${res.data.lowest_price}`);
  } else {
    out[name] = { lowest: null, median: null };
    console.warn(`[!] ${name} → veri yok, null olarak kaydedildi.`);
  }
} catch (e) {
  out[name] = { lowest: null, median: null };
  console.error(`[X] ${name} → ${e.message} → null olarak kaydedildi.`);
}
      await delay(2500); // Steam'e yüklenme!
    }
  }

  const outFile = `part_${start}_${end}.json`;
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log(`✅ ${outFile} tamamlandı`);
}

run();
