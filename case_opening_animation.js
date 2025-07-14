// --- KONTROL PANELİ ---
const REEL_ITEM_COUNT = 250;      // Şeritteki toplam desen sayısı (ne kadar çoksa o kadar iyi)
const WINNING_ITEM_INDEX = 65;    // Kazanan desenin şeritteki konumu (sonlara doğru)
const ANIMATION_DURATION_MS = 7000; // CSS'teki transition süresiyle (7s) aynı olmalı
// --- KONTROL PANELİ SONU ---

const ITEM_WIDTH = 160;   // CSS'teki .reel-item genişliği
const ITEM_MARGIN = 20;   // CSS'teki .reel-item margin'i (sol 10px + sağ 10px)
const TOTAL_ITEM_SIZE = ITEM_WIDTH + ITEM_MARGIN;

/**
 * @param {number} caseCount Açılacak kasa sayısı.
 * @param {string} caseId Açılan kasanın ID'si.
 * @returns {Promise<Array<object>>} Animasyon bitince kazanan eşyaların listesini döndürür.
 */
// ===== YENİ VE HATASI DÜZELTİLMİŞ ANİMASYON FONKSİYONU =====
// ===== YENİ VE HATASI DÜZELTİLMİŞ ANİMASYON FONKSİYONU =====
// ===== YENİ VE HATASI DÜZELTİLMİŞ ANİMASYON FONKSİYONU =====
// ===== case_opening_animation.js DOSYASININ YENİ VE TAM HALİ =====

/**
 * Önceden belirlenmiş kazanan desen(ler) ile animasyon şeritlerini oluşturur ve oynatır.
 * @param {number} caseCount Açılacak kasa sayısı (1, 2, veya 3).
 * @param {string} caseId Açılan kasanın ID'si (rastgele dolgu desenleri için).
 * @param {Array<object>} winningSkins openCase fonksiyonundan gelen, önceden belirlenmiş kazanan desenler.
 * @returns {Promise<Array<object>>} Animasyon bitince kazanan eşyaların listesini geri döndürür.
 */
function runNewFullScreenAnimation(caseCount, caseId, winningSkins) {
    return new Promise(resolve => {
        // ----- MANUEL ÇUBUK BOYUT AYARLARI -----
        const boyutlar = {
            1: { height: '240px', width: '5px' },
            2: { height: '370px', width: '5px' },
            3: { height: '490px', width: '5px' }
        };
        const sariCubuk = document.getElementById('manuel-sari-cubuk');
        if (sariCubuk && boyutlar[caseCount]) {
            sariCubuk.style.height = boyutlar[caseCount].height;
            sariCubuk.style.width = boyutlar[caseCount].width;
        }
    
        const reelsWrapper = document.querySelector('#fullScreenAnimationOverlay .reels-wrapper-new');
        const overlay = document.getElementById('fullScreenAnimationOverlay');

        reelsWrapper.innerHTML = '';
        overlay.style.opacity = '0';
        overlay.style.display = 'flex';
        reelsWrapper.className = 'reels-wrapper-new count-' + caseCount;

        let current_item_width = 160;
        let current_item_margin = 20;
        switch (caseCount) {
            case 1: current_item_width = 220; break;
            case 2: current_item_width = 180; break;
            case 3: current_item_width = 160; break;
        }
        const current_total_item_size = current_item_width + current_item_margin;

        setTimeout(() => overlay.style.opacity = '1', 10);

        const reelElements = [];

        // --- Şeritleri Oluşturma (Doğru Mantık) ---
        for (let i = 0; i < caseCount; i++) {
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'reel-items';

            // Ana sayfadan gelen gerçek kazananı al
            const realWinningSkin = winningSkins[i];

            const itemsForReel = [];
            for (let j = 0; j < REEL_ITEM_COUNT; j++) {
                // Şeridin doğru yerine gerçek kazananı, diğer yerlere rastgele dolgu desenlerini koy
                const skin = (j === WINNING_ITEM_INDEX) ? realWinningSkin : getRandomSkin(caseId);
                itemsForReel.push(skin);
            }

            itemsForReel.forEach(skin => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'reel-item';
                if (skin && skin.image) {
                    itemDiv.innerHTML = `<img src="${skin.image}" alt="${skin.name}">`;
                    const rarityInfo = skinRarities[skin.rarity];
                    if (rarityInfo && rarityInfo.barColor) {
                        const rarityBar = document.createElement('div');
                        const colorMap = {'bg-blue-400':'#60a5fa','bg-purple-400':'#c084fc','bg-pink-400':'#f472b6','bg-red-400':'#f87171','bg-yellow-400':'#facc15'};
                        rarityBar.style.backgroundColor = colorMap[rarityInfo.barColor] || '#9ca3af';
                        rarityBar.style.height = '5px';
                        rarityBar.style.width = '80%';
                        rarityBar.style.position = 'absolute';
                        rarityBar.style.bottom = '5px';
                        rarityBar.style.borderRadius = '3px';
                        itemDiv.appendChild(rarityBar);
                    }
                }
                itemsContainer.appendChild(itemDiv);
            });

            reelsWrapper.appendChild(itemsContainer);
            reelElements.push(itemsContainer);
        }

        // --- Animasyonu Başlatma ---
        setTimeout(() => {
            const sceneWidth = document.querySelector('.scene').offsetWidth;
            reelElements.forEach((reel) => {
                const stopPosition = (WINNING_ITEM_INDEX * current_total_item_size) - (sceneWidth / 2) + (current_total_item_size / 2);
                const randomOffset = (Math.random() - 0.5) * (current_item_width * 0.8);
                reel.style.transform = `translateX(-${stopPosition + randomOffset}px) translateZ(-250px) rotateX(-5deg)`;
            });
        }, 100);

        // --- Animasyon Bitince Sonucu Gönderme ---
        setTimeout(() => {
            // Ana sayfaya "işim bitti, işte kazandıkların bunlar" diye haber veriyoruz.
            resolve(winningSkins); 
        }, ANIMATION_DURATION_MS + 200);

    });
}