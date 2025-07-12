// case_opening_animation.js - YENİ VE NİHAİ KOD (DOĞRU HIZ KONTROLÜ)

// --- KONTROL PANELİ ---
// 1. Şeritteki Toplam Desen Sayısı (Buffer/Tampon)
// Bu, animasyon sırasında şeridin boş görünmemesini sağlar. 100-150 arası idealdir.
const REEL_ITEM_COUNT = 250; 

// 2. KAZANAN DESENİN SIRASI (ASIL HIZ KONTROLÜ)
// Animasyonun ne kadar mesafe gideceğini bu sayı belirler.
// Ne kadar küçük bir sayı yazarsan, animasyon o kadar YAVAŞ olur.
// Normal bir oyun hissi için 70-90 arası idealdir.
const WINNING_ITEM_INDEX = 60; 

// 3. Animasyon Süresi (CSS ile aynı olmalı)
// Milisaniye cinsinden (5 saniye = 5000)
const ANIMATION_DURATION_MS = 5000;
// --- KONTROL PANELİ SONU ---


const ITEM_WIDTH = 280;
const ITEM_MARGIN = 20;
const TOTAL_ITEM_SIZE = ITEM_WIDTH + ITEM_MARGIN;

function runNewFullScreenAnimation(caseCount, caseId) {
    return new Promise(resolve => {
        const reelsWrapper = document.getElementById('reelsWrapper');
        if (!reelsWrapper) {
            console.error("HATA: reelsWrapper elementi bulunamadı.");
            resolve(null);
            return;
        }
        reelsWrapper.innerHTML = '';
        
        const results = [];
        const reelsData = [];

        for (let i = 0; i < caseCount; i++) {
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'reel-items';
            
            const winningSkin = getRandomSkin(caseId);
            const itemsForReel = [];

            for (let j = 0; j < REEL_ITEM_COUNT; j++) {
                itemsForReel.push(getRandomSkin(caseId));
            }
            
            // Kazanan deseni, yukarıda belirlediğimiz sabit sıraya yerleştiriyoruz.
            // Artık listenin sonuna değil, BAŞINA YAKIN bir yere koyuyoruz.
            if (WINNING_ITEM_INDEX < REEL_ITEM_COUNT) {
                 itemsForReel[WINNING_ITEM_INDEX] = winningSkin;
            } else {
                console.error("Hata: winningIndex, REEL_ITEM_COUNT'tan büyük olamaz!");
                itemsForReel[REEL_ITEM_COUNT - 5] = winningSkin; // Güvenlik önlemi
            }

            itemsForReel.forEach(skin => {
                const rarityInfo = skinRarities[skin.rarity] || {};
                const itemDiv = document.createElement('div');
                itemDiv.className = `reel-item rarity-${skin.rarity.toLowerCase().replace(/ /g, '-').replace(':', '')}`;
                itemDiv.style.setProperty('--rarity-color', rarityInfo.barColor ? `var(--${rarityInfo.barColor.replace('bg-', '')})` : '#555');
                itemDiv.innerHTML = `<img src="${skin.image}" alt="${skin.name}"><div class="rarity-bar ${rarityInfo.barColor}"></div>`;
                itemsContainer.appendChild(itemDiv);
            });
            
            reelsWrapper.appendChild(itemsContainer);
            results.push(winningSkin);
            reelsData.push({ container: itemsContainer, index: WINNING_ITEM_INDEX });
        }

        setTimeout(() => {
            reelsData.forEach(data => {
                const reelWidth = window.innerWidth;
                const stopPosition = (data.index * TOTAL_ITEM_SIZE) - (reelWidth / 2) + (TOTAL_ITEM_SIZE / 2);
                const randomOffset = (Math.random() - 0.5) * (ITEM_WIDTH * 0.7);
                data.container.style.transform = `translateX(-${stopPosition + randomOffset}px)`;
            });
        }, 100);

        // Bitiş zamanlayıcısı artık yukarıdaki süreyi kullanıyor.
        setTimeout(() => {
            console.log("Animasyon doğru hız ve süreyle sonlandırıldı.");
            resolve(results);
        }, ANIMATION_DURATION_MS + 100); // Animasyon süresi + 100ms güvenlik payı
    });
}