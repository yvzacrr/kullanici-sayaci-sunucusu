// HTML'den sayıyı göstereceğimiz <span> elementini seçiyoruz.
const userCountElement = document.getElementById('active-user-count');

const socket = new WebSocket('ws://localhost:8080'); // WebSocket bağlantısı, sunucu adresine göre değişecek

// WebSocket bağlantısı açıldığında
// ===== ESKİ socket.onopen BLOĞUNU BUNUNLA DEĞİŞTİR =====
socket.onopen = () => {
    console.log('WebSocket sunucusuna başarıyla bağlanıldı.');
    const userCountElement = document.getElementById('active-user-count');
    if(userCountElement) userCountElement.textContent = '...';
};

// ===== ESKİ socket.onmessage BLOĞUNU SİLİP BUNU YAPIŞTIR =====
// ===== ESKİ socket.onmessage BLOĞUNU KOMPLE SİLİP BUNU YAPIŞTIR =====

// ===== ESKİ socket.onmessage BLOĞUNU SİLİP BUNU YAPIŞTIR =====
socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);

        if (data.type === 'userCount') {
            const userCountElement = document.getElementById('active-user-count');
            if (userCountElement) {
                userCountElement.textContent = data.count;
            }
        } else if (data.type === 'priceUpdate') {
            const priceEvent = new CustomEvent('pricesUpdated', { detail: data.data });
            document.dispatchEvent(priceEvent);
        }
    } catch (error) {
        console.error('Sunucudan gelen mesaj işlenirken hata oluştu:', error);
    }
};
// =============================================================

function updatePrices(prices) {
    const priceElements = document.querySelectorAll('.item-price');
    priceElements.forEach(el => {
        const itemName = el.dataset.itemName; // Her item'a benzersiz bir isim verilmiş
        
        if (prices[itemName]) {
            const price = prices[itemName].lowest; // Fiyat burada alınıyor
            if (price) {
                el.textContent = price;  // Fiyat yerleştiriliyor
            } else {
                el.textContent = 'Fiyat Bulunamadı'; // Fiyat yoksa mesaj
            }
        } else {
            el.textContent = 'Fiyat Bekleniyor...'; // Fiyat henüz yoksa mesaj
        }
    });
}

// items_tam.json'dan verileri alıp sayfada dinamik olarak itemları ekle
async function populateItems() {
    // items_tam.json dosyasını alıyoruz
    const response = await fetch('items_tam.json');
    const itemsData = await response.json();  // JSON verisini alıyoruz

    const caseSelectionMenu = document.getElementById('caseSelectionMenu');  // 'caseSelectionMenu' id'sini buluyoruz

    // Tüm kasalar üzerinde geçiyoruz
    for (const caseKey in itemsData) {
        const caseData = itemsData[caseKey];  // Her kasanın verisini alıyoruz
        const caseDiv = document.createElement('div');  // Her kasayı gösterecek bir div oluşturuyoruz
        caseDiv.classList.add('case-item-container');  // CSS sınıfını ekliyoruz

        // Kasa adı başlığını ekliyoruz
        const caseTitle = document.createElement('h3');
        caseTitle.textContent = caseData.name;  // Kasa adını yazıyoruz
        caseDiv.appendChild(caseTitle);  // Kasa başlığını ekliyoruz

        // Her kasa için item'ları ekliyoruz
        caseData.items.forEach(item => {
            // Her item için div oluşturuyoruz
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('case-item');

            // Item görselini ekliyoruz
            const itemImage = document.createElement('img');
            itemImage.src = `path_to_images/${item.name}.jpg`;  // Item görselinin yolunu ekliyoruz
            itemImage.alt = item.name;  // Görselin alt yazısını ekliyoruz
            itemDiv.appendChild(itemImage);  // Görseli item div'ine ekliyoruz

            // Item adını ekliyoruz
            const itemName = document.createElement('div');
            itemName.classList.add('item-name');
            itemName.textContent = item.name;  // Item adını yazıyoruz
            itemDiv.appendChild(itemName);  // Item adını ekliyoruz

            // Item fiyatı alanını ekliyoruz
            const itemPrice = document.createElement('div');
            itemPrice.classList.add('item-price');
            itemPrice.dataset.itemName = item.name;  // Fiyat alanına benzersiz bir item adı veriyoruz
            itemPrice.textContent = 'Fiyat Bekleniyor...';  // Başlangıç fiyatı yazıyoruz
            itemDiv.appendChild(itemPrice);  // Fiyat alanını ekliyoruz

            // Item'ı kasa div'ine ekliyoruz
            caseDiv.appendChild(itemDiv);
        });

        // Kasa container'ını sayfaya ekliyoruz
        caseSelectionMenu.appendChild(caseDiv);
    }
}

// Sayfa yüklendiğinde item'ları ekliyoruz
populateItems();

// Sunucuya bağlanmayı ve bağlantı koptuğunda tekrar denemeyi sağlayan fonksiyon.
function connectWebSocket() {
    // ÖNEMLİ: Bu adres, son adımda canlı sunucu adresinizle değiştirilecek.
const socketURL = (location.protocol === "https:" ? "wss://" : "ws://") + location.host;
const socket = new WebSocket(socketURL);


    // Sunucuya başarıyla bağlanıldığında çalışır.
    socket.onopen = () => {
        console.log('WebSocket sunucusuna başarıyla bağlanıldı.');
        userCountElement.textContent = '...'; // Bağlantı kuruldu, sayı bekleniyor.
    };

// ===== ESKİ socket.onmessage BLOĞUNU KOMPLE SİLİP BUNU YAPIŞTIR =====
socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);

        // Gelen mesajın tipi 'userCount' ise...
        if (data.type === 'userCount') {
            const userCountElement = document.getElementById('active-user-count');
            if (userCountElement) {
                userCountElement.textContent = data.count;
            }
        
        // Gelen mesajın tipi 'priceUpdate' ise...
        } else if (data.type === 'priceUpdate') {
            const priceEvent = new CustomEvent('pricesUpdated', { detail: data.data });
            document.dispatchEvent(priceEvent);
        }
    } catch (error) {
        console.error('Sunucudan gelen mesaj işlenirken hata oluştu:', error);
    }
};

    // Bağlantı koptuğunda çalışır.
    socket.onclose = () => {
        console.log('Bağlantı koptu. 3 saniye içinde tekrar denenecek...');
        userCountElement.textContent = 'X'; // Bağlantının koptuğunu belirtir.
        
        // 3 saniye sonra yeniden bağlanmayı dener.
        setTimeout(connectWebSocket, 3000);
    };

    // Bir hata oluştuğunda çalışır.
    socket.onerror = (error) => {
        console.error('WebSocket hatası:', error);
    };
}

// Sayfa ilk yüklendiğinde sunucuya bağlanmayı başlatıyoruz.
connectWebSocket();
