import axios from 'axios';
import fs from 'fs';

async function guncelleVeKaydet() {
    console.log('Fiyatlar csgobackpack.net API\'sinden çekiliyor... Lütfen bekleyin.');
    try {
        const response = await axios.get('http://csgobackpack.net/api/GetItemsList/v2/');
        if (response.data && response.data.success) {
            const fiyatListesi = response.data.items_list;
            fs.writeFileSync('prices.json', JSON.stringify(fiyatListesi, null, 2));
            console.log(`\nBAŞARILI!`);
            console.log(`${Object.keys(fiyatListesi).length} adet eşya fiyatı 'prices.json' dosyasına kaydedildi.`);
            console.log("Artık 'git add .', 'git commit' ve 'git push' komutları ile projeni güncelleyebilirsin.");
        } else {
            console.error('[HATA] API yanıtında bir sorun var.');
        }
    } catch (error) {
        console.error('[HATA] Fiyatlar çekilirken bir hata oluştu:', error.message);
    }
}

guncelleVeKaydet();