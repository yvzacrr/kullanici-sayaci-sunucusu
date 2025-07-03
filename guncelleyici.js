// guncelleyici.js - Fiyatları Çekip prices.json Dosyasına Yazan Yardımcı Program

import axios from 'axios';
import fs from 'fs';

async function guncelleVeKaydet() {
    console.log('Fiyatlar csgobackpack.net API\'sinden çekiliyor... Lütfen bekleyin.');
    try {
        // Anahtar gerektirmeyen API'ye istek atıyoruz.
        const response = await axios.get('http://csgobackpack.net/api/GetItemsList/v2/');

        // Eğer gelen veri başarılı ise...
        if (response.data && response.data.success) {
            const fiyatListesi = response.data.items_list;

            // Gelen tüm fiyatları, düzgün formatlanmış bir şekilde prices.json dosyasına yaz.
            // 'null, 2' JSON'un okunaklı olması için boşluk bırakmasını sağlar.
            fs.writeFileSync('prices.json', JSON.stringify(fiyatListesi, null, 2));

            console.log(`\nBAŞARILI!`);
            console.log(`${Object.keys(fiyatListesi).length} adet eşya fiyatı 'prices.json' dosyasına kaydedildi.`);
            console.log("Artık 'git add .', 'git commit' ve 'git push' komutları ile projeni güncelleyebilirsin.");

        } else {
            console.error('[HATA] API yanıtında bir sorun var. Gelen veri beklenen formatta değil.');
        }
    } catch (error) {
        console.error('[HATA] Fiyatlar çekilirken bir hata oluştu:', error.message);
    }
}

guncelleVeKaydet();