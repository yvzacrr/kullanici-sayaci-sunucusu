// server.js (SIFIRDAN YAZILMIŞ, TEMİZ VE %100 DOĞRU FİNAL VERSİYON)

import { WebSocketServer } from 'ws';
import axios from 'axios';
import cron from 'node-cron';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

let cachedPrices = {};
console.log("Sunucu başlatılıyor...");

// --- YARDIMCI FONKSİYONLAR ---

// Tüm bağlı istemcilere mesaj gönderen ana fonksiyon
function broadcastToAll(message) {
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(message);
        }
    });
}

// Aktif kullanıcı listesini güncelleyip herkese gönderen fonksiyon
function broadcastActiveUserList() {
    const usernames = [];
    wss.clients.forEach(client => {
        if (client.username) {
            usernames.push(client.username);
        }
    });
    const message = JSON.stringify({
        type: 'activeUserList',
        users: usernames
    });
    console.log(`[Broadcast] Aktif kullanıcı listesi gönderiliyor: [${usernames.join(', ')}]`);
    broadcastToAll(message);
}

// ESKİ fetchSkinPrices FONKSİYONUNU SİL VE BUNU YAPIŞTIR
// ESKİ fetchSkinPrices FONKSİYONUNU SİL VE BUNU YAPIŞTIR
async function fetchSkinPrices() {
    console.log("[Fiyatlar] Yeni API (csgobackpack.net) üzerinden fiyatlar çekilmeye başlandı...");
    try {
        const response = await axios.get('http://csgobackpack.net/api/GetItemsList/v2/');

        if (response.data && response.data.success) {
            cachedPrices = response.data.items_list;
            console.log(`[Fiyatlar] Başarıyla ${Object.keys(cachedPrices).length} adet detaylı eşya verisi çekildi.`);
            
            const priceMessage = JSON.stringify({ type: 'priceUpdate', data: cachedPrices });
            broadcastToAll(priceMessage);
        } else {
            console.error("[HATA] Yeni API'den gelen veride sorun var.");
        }
    } catch (error) {
        console.error('[HATA] Yeni API ile fiyatlar çekilirken bir hata oluştu:', error.message);
    }
}

// --- SUNUCU OLAYLARI ---

// Her gün sabah 5'te fiyatları güncelle
cron.schedule('0 5 * * *', () => {
    console.log('[Cron] Zamanlanmış görev tetiklendi: Fiyatlar güncellenecek.');
    fetchSkinPrices();
}, { timezone: "Europe/Istanbul" });

// Yeni bir kullanıcı bağlandığında...
wss.on('connection', (ws) => {
    console.log(`[Bağlantı] Yeni bir kullanıcı bağlandı. Toplam: ${wss.clients.size}`);

    // Yeni bağlanan kullanıcıya, sunucuda kayıtlı olan son fiyatları hemen gönder.
    if (Object.keys(cachedPrices).length > 0) {
        ws.send(JSON.stringify({ type: 'priceUpdate', data: cachedPrices }));
    }

    // Kullanıcıdan gelen mesajları dinle
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            // Eğer mesaj 'register' tipindeyse ve kullanıcı adı içeriyorsa...
            if (data.type === 'register' && data.username) {
                ws.username = data.username; // Kullanıcı adını bu bağlantıya özel olarak ata
                console.log(`[Kayıt] ${ws.username} kullanıcısı kayıt oldu.`);
                broadcastActiveUserList(); // Yeni kullanıcı listesini herkese duyur
            }
        } catch (e) {
            console.error('[HATA] Gelen mesaj işlenemedi:', e);
        }
    });

    // Bir kullanıcı bağlantıyı kapattığında...
    ws.on('close', () => {
        console.log(`[Bağlantı] ${ws.username || 'Bilinmeyen kullanıcı'} ayrıldı.`);
        broadcastActiveUserList(); // Bir kullanıcı ayrıldığı için listeyi tekrar herkese gönder
    });

    ws.on('error', (error) => console.error('[HATA] WebSocket hatası:', error));
});


// --- SUNUCUYU BAŞLATMA ---
console.log(`WebSocket sunucusu ${PORT} portunda dinlemeye başladı.`);
// Sunucu ilk açıldığında fiyatları bir kere çekmeyi dene
fetchSkinPrices();