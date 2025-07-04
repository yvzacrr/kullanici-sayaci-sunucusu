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

wss.on('connection', (ws) => {
    console.log(`[Bağlantı] Yeni bir kullanıcı bağlandı. Toplam: ${wss.clients.size}`);

    if (Object.keys(cachedPrices).length > 0) {
        ws.send(JSON.stringify({ type: 'priceUpdate', data: cachedPrices }));
    }

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'register' && data.username) {
                ws.username = data.username;
                console.log(`[Kayıt] ${ws.username} kullanıcısı kayıt oldu.`);
                broadcastActiveUserList();
            }
        } catch (e) {
            console.error('[HATA] Gelen mesaj işlenemedi:', e);
        }
    });

    ws.on('close', () => {
        console.log(`[Bağlantı] ${ws.username || 'Bilinmeyen kullanıcı'} ayrıldı.`);
        broadcastActiveUserList();
    });

    ws.on('error', (error) => console.error('[HATA] WebSocket hatası:', error));
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