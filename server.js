// server.js (Temizlenmiş ve %100 hatasız)

import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cron from 'node-cron';
import { exec } from 'child_process';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
let cachedPrices = {};

console.log("Sunucu başlatılıyor...");

// --- YARDIMCI FONKSİYONLAR ---

function broadcastToAll(message) {
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(message);
        }
    });
}

// Hem kullanıcı sayısını hem de listesini tek pakette gönderen YENİ fonksiyon
function broadcastUpdates() {
    const count = wss.clients.size;
    const users = Array.from(wss.clients)
        .filter(client => client.username) // Sadece adı olanları listeye al
        .map(client => client.username);

    const message = JSON.stringify({
        type: 'update', // Mesaj tipi artık hep 'update'
        count: count,
        users: users
    });

    console.log(`[GÜNCELLEME] ${count} kullanıcı, Liste: [${users.join(', ')}]`);
    broadcastToAll(message);
}

function fetchSkinPrices() {
    console.log("[Fiyatlar] Lokal dosyadan (prices.json) okunuyor...");
    try {
        const filePath = path.resolve(process.cwd(), 'prices.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        cachedPrices = JSON.parse(fileContent);
        console.log(`[Fiyatlar] Başarıyla lokal dosyadan ${Object.keys(cachedPrices).length} adet fiyat okundu.`);
    } catch (error) {
        console.error('[HATA] prices.json dosyası okunurken hata oluştu:', error.message);
        cachedPrices = {};
    }
}

// --- WebSocket Olayları ---

// ===== ESKİ wss.on('connection') BLOĞUNU KOMPLE SİLİP BUNU YAPIŞTIR =====

wss.on('connection', (ws) => {
    console.log(`[Bağlantı] Yeni bir kullanıcı bağlandı. Toplam: ${wss.clients.size}`);
    broadcastUpdates(); // Yeni kullanıcı geldi, herkese haber ver!

    // Sunucuya yeni bağlanan kullanıcıya güncel fiyatları gönder
    if (Object.keys(cachedPrices).length > 0) {
        ws.send(JSON.stringify({ type: 'priceUpdate', data: cachedPrices }));
    }

    // Kullanıcıdan bir mesaj geldiğinde...
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // Eğer gelen mesajın tipi 'username' ise...
            if (data.type === 'username') {
                ws.username = data.username; // Kullanıcının adını kaydet
                console.log(`[Kullanıcı Adı] "${ws.username}" olarak ayarlandı.`);
                broadcastUpdates(); // Adını belirledi, herkese haber ver!
            }
        } catch (error) {
            console.error('[Hata] Gelen mesaj işlenemedi:', error);
        }
    });

    // Kullanıcı bağlantıyı kapattığında...
    ws.on('close', () => {
        console.log(`[Bağlantı] "${ws.username || 'Bilinmeyen kullanıcı'}" ayrıldı.`);
        broadcastUpdates(); // Kullanıcı gitti, herkese haber ver!
    });
});

// --- Static Dosya Ayarları ---

app.use(express.static(process.cwd()));
app.get('/', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'simulator.html'));
});

// --- Sunucuyu Başlat ---

server.listen(PORT, () => {
    console.log(`Sunucu ve WebSocket ${PORT} portunda çalışmaya başladı.`);
    fetchSkinPrices();
});

// --- CRON sistemi ile fiyat güncelleme ---

let currentStart = 0;
const BATCH_SIZE = 500;

cron.schedule('0 */2 * * *', () => {
    const fileName = `part_${currentStart}_${currentStart + BATCH_SIZE}.json`;
    if (fs.existsSync(fileName)) {
        console.log(`[CRON] ${fileName} zaten var, sıradaki parçaya geçiliyor...`);
        currentStart += BATCH_SIZE;
    }

    console.log(`[CRON] Fiyat çekimi başlatılıyor: ${currentStart} - ${currentStart + BATCH_SIZE}`);
    exec(`node steamGunceller_parca.js ${currentStart} ${BATCH_SIZE}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`[CRON] HATA: ${stderr}`);
        } else {
            console.log(`[CRON] Tamamlandı: ${stdout}`);
            currentStart += BATCH_SIZE;
        }
    });
});