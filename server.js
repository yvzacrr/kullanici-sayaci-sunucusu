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

// Herkese mesaj gönderen ana fonksiyon
function broadcastToAll(message) {
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // 1 = OPEN
            client.send(message);
        }
    });
}

// SADECE kullanıcı sayısını alıp herkese yollayan fonksiyon
function broadcastUserCount() {
    const count = wss.clients.size;
    const message = JSON.stringify({
        type: 'userCount',
        count: count
    });
    console.log(`[Broadcast] Aktif kullanıcı sayısı: ${count}`);
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

// ===== ESKİ wss.on('connection') BLOĞUNU KOMPLE SİLİP BUNU YAPIŞTIR =====
// ===== MEVCUT wss.on('connection') BLOĞUNU BUNUNLA DEĞİŞTİR =====
wss.on('connection', (ws) => {
    console.log(`[Bağlantı] Yeni kullanıcı bağlandı. Toplam: ${wss.clients.size}`);
    broadcastUserCount(); // Yeni kullanıcı gelince sayıyı herkese duyur

    if (Object.keys(cachedPrices).length > 0) {
        ws.send(JSON.stringify({ type: 'priceUpdate', data: cachedPrices }));
    }

    ws.on('close', () => {
        console.log(`[Bağlantı] Bir kullanıcı ayrıldı.`);
        broadcastUserCount(); // Kullanıcı ayrılınca sayıyı herkese tekrar duyur
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