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
function runNewFullScreenAnimation(caseCount, caseId) {
    return new Promise(resolve => {
        // --- Gerekli Elementleri Seç ---
        const reelsWrapper = document.querySelector('#fullScreenAnimationOverlay .reels-wrapper-new');
        const resultPlaque = document.getElementById('animationResultPlaque');
        const overlay = document.getElementById('fullScreenAnimationOverlay');

        // --- Animasyon Hazırlığı ---
        reelsWrapper.innerHTML = '';
        resultPlaque.classList.remove('visible');
        overlay.style.opacity = '0';
        overlay.style.display = 'flex';

        // YENİ: Kasa sayısına göre ana sarmalayıcıya sınıf ekle
        // Önce eskileri temizle, sonra yenisini ekle
        reelsWrapper.classList.remove('count-1', 'count-2', 'count-3', 'count-4', 'count-5');
        reelsWrapper.classList.add('count-' + caseCount);

        // YENİ: Kasa sayısına göre doğru desen genişliğini ve marjını ayarla
        let current_item_width = 160; // Varsayılan
        let current_item_margin = 20; // Varsayılan (sol 10px + sağ 10px)

        switch (caseCount) {
            case 1: current_item_width = 220; break;
            case 2: current_item_width = 180; break;
            case 3: current_item_width = 160; break;
        }
        const current_total_item_size = current_item_width + current_item_margin;

        // Overlay'i yumuşak bir geçişle görünür yap
        setTimeout(() => overlay.style.opacity = '1', 10);

        const results = [];
        const reelElements = [];

        // --- Şeritleri Oluştur ---
        for (let i = 0; i < caseCount; i++) {
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'reel-items';

            const winningSkin = getRandomSkin(caseId);
            results.push(winningSkin);

            const itemsForReel = [];
            for (let j = 0; j < REEL_ITEM_COUNT; j++) {
                itemsForReel.push(getRandomSkin(caseId));
            }
            itemsForReel[WINNING_ITEM_INDEX] = winningSkin;

            itemsForReel.forEach(skin => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'reel-item';
                itemDiv.innerHTML = `<img src="${skin.image}" alt="${skin.name}">`;
                const rarityInfo = skinRarities[skin.rarity];
                if (rarityInfo && rarityInfo.barColor) {
                    const rarityBar = document.createElement('div');
                    const colorMap = { 'bg-blue-400': '#60a5fa', 'bg-purple-400': '#c084fc', 'bg-pink-400': '#f472b6', 'bg-red-400': '#f87171', 'bg-yellow-400': '#facc15', 'bg-orange-500': '#f97316' };
                    rarityBar.style.backgroundColor = colorMap[rarityInfo.barColor] || '#9ca3af';
                    rarityBar.style.height = '5px';
                    rarityBar.style.width = '80%';
                    rarityBar.style.position = 'absolute';
                    rarityBar.style.bottom = '5px';
                    rarityBar.style.borderRadius = '3px';
                    itemDiv.appendChild(rarityBar);
                }
                itemsContainer.appendChild(itemDiv);
            });
            reelsWrapper.appendChild(itemsContainer);
            reelElements.push(itemsContainer);
        }

        // --- Animasyonu Başlat ---
        setTimeout(() => {
            reelElements.forEach(reel => {
                // DİKKAT: Hesaplama artık dinamik `current_total_item_size` kullanıyor
                const stopPosition = (WINNING_ITEM_INDEX * current_total_item_size) - (document.querySelector('.scene').offsetWidth / 2) + (current_total_item_size / 2);
                const randomOffset = (Math.random() - 0.5) * (current_item_width * 0.8);
                reel.style.transform = `translateX(-${stopPosition + randomOffset}px) translateZ(-250px) rotateX(-5deg)`;
            });
        }, 100);

        // --- Animasyon Bitince Sonucu Göster ---
        setTimeout(() => {
            const firstWinner = results[0];
            const rarityInfo = skinRarities[firstWinner.rarity] || {};
            resultPlaque.innerHTML = `
                <img id="resultImage" src="${firstWinner.image}" alt="${firstWinner.name}">
                <div id="resultTextContainer">
                    <h3 id="resultItemName" class="${rarityInfo.color}">${firstWinner.name}</h3>
                    <p id="resultItemWear">${firstWinner.wear.name} (${firstWinner.wear.abbr})</p>
                </div>
                <button id="continueButton">Devam Et</button>
            `;
            resultPlaque.classList.add('visible');
            resolve(results);
        }, ANIMATION_DURATION_MS + 200);
    });
}