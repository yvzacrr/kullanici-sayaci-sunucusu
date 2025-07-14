// --- KONTROL PANELİ (Değiştirebilirsiniz) ---
const REEL_ITEM_COUNT = 250;      // Şeritteki toplam desen sayısı. Ne kadar yüksek olursa o kadar akıcı görünür.
const WINNING_ITEM_INDEX = 65;   // Kazanan desenin şeritteki konumu (sonlara doğru olması daha iyi).
const ANIMATION_DURATION_MS = 7000; // Animasyonun süresi (milisaniye). CSS'teki 7s ile aynı olmalı.
// --- KONTROL PANELİ SONU ---

// Bu değerler CSS ile uyumlu olmalıdır.
const ITEM_WIDTH = 160;   // .reel-item genişliği
const ITEM_MARGIN = 20;   // .reel-item margin (sol 10px + sağ 10px)
const TOTAL_ITEM_SIZE = ITEM_WIDTH + ITEM_MARGIN;

/**
 * Önceden belirlenmiş kazanan desen(ler) ile animasyon şeritlerini oluşturur ve oynatır.
 * @param {number} caseCount Açılacak kasa sayısı (1, 2, veya 3).
 * @param {string} caseId Açılan kasanın ID'si (rastgele dolgu desenleri için).
 * @param {Array<object>} winningSkins openCase fonksiyonundan gelen, önceden belirlenmiş kazanan desenler.
 * @returns {Promise<Array<object>>} Animasyon bitince kazanan eşyaların listesini geri döndürür.
 */
function runNewFullScreenAnimation(caseCount, caseId, winningSkins) {
    return new Promise(resolve => {
        const reelsWrapper = document.querySelector('#fullScreenAnimationOverlay .reels-wrapper-new');
        const overlay = document.getElementById('fullScreenAnimationOverlay');
        const sariCubuk = document.getElementById('manuel-sari-cubuk');

        // Gerekli elementleri temizle ve hazırla
        reelsWrapper.innerHTML = '';
        overlay.style.opacity = '0';
        overlay.style.display = 'flex';
        reelsWrapper.className = 'reels-wrapper-new count-' + caseCount;

        // Sarı çubuğun boyutunu kasa sayısına göre ayarla
        const boyutlar = {
            1: { height: '240px', width: '5px' },
            2: { height: '370px', width: '5px' },
            3: { height: '490px', width: '5px' }
        };
        if (sariCubuk && boyutlar[caseCount]) {
            sariCubuk.style.height = boyutlar[caseCount].height;
            sariCubuk.style.width = boyutlar[caseCount].width;
        }
        
        // Animasyon ekranını yavaşça görünür yap
        setTimeout(() => overlay.style.opacity = '1', 10);

        const reelElements = [];
        const itemSize = TOTAL_ITEM_SIZE;

        // --- Şeritleri Oluşturma (Yeni ve Doğru Mantık) ---
        for (let i = 0; i < caseCount; i++) {
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'reel-items';

            // Ana script'ten gelen gerçek kazananı bu şerit için al
            // YENİ: Kazananı doğrudan HTML'den okuyoruz.
            const realWinningSkin = JSON.parse(fullScreenAnimationOverlay.dataset.winner)[i];

            // Şeridi dolduracak desenleri oluştur
            for (let j = 0; j < REEL_ITEM_COUNT; j++) {
                // Şeridin doğru yerine "GERÇEK KAZANANI", diğer yerlere rastgele dolgu desenlerini koy
                const skin = (j === WINNING_ITEM_INDEX) ? realWinningSkin : getRandomSkin(caseId);
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'reel-item';

                // Desen kutusunun içini doldur
                if (skin && skin.image) {
                    const rarityInfo = skinRarities[skin.rarity] || {};
                    const color = rarityInfo.color || 'text-gray-400';
                    const barColor = rarityInfo.barColor || 'bg-gray-400';

                    itemDiv.innerHTML = `
                        <div class="reel-item-box border-2 ${color.replace('text-', 'border-')}">
                            <img src="${skin.image}" alt="${skin.name || 'Bilinmiyor'}" loading="lazy">
                            <div class="rarity-bar ${barColor}"></div>
                        </div>
                    `;
                }
                itemsContainer.appendChild(itemDiv);
            }
            reelsWrapper.appendChild(itemsContainer);
            reelElements.push(itemsContainer);
        }

        // --- Animasyonu Başlatma ---
        setTimeout(() => {
            const sceneWidth = document.querySelector('.scene').offsetWidth;
            reelElements.forEach((reel) => {
                // Her şeridin tam olarak işaretçinin ortasında duracağı konumu hesapla
                const stopPosition = (WINNING_ITEM_INDEX * itemSize) - (sceneWidth / 2) + (itemSize / 2);
                
                // Gerçekçilik katmak için her şeride milimetrik bir kaydırma ekle
// const randomOffset = (Math.random() - 0.5) * (ITEM_WIDTH * 0.8); // Bu satırı sildik veya yorum yaptık
reel.style.transform = `translateX(-${stopPosition}px)`; // + randomOffset kısmını kaldırdık
            });
        }, 100); // Tarayıcının elementleri çizmesine izin vermek için küçük bir gecikme

        // --- Animasyon Bitince Sonucu Gönderme ---
        setTimeout(() => {
            // Ana script'e "işim bitti, işte en başta belirlediğimiz kazananlar bunlar" diye haber ver.
            handleAnimationFinish(); 
        }, ANIMATION_DURATION_MS + 500); // CSS süresinden biraz daha uzun bekle ki animasyon tamamlansın.
    });
}