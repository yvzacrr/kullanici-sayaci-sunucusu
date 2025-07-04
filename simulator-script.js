// HTML'den sayıyı göstereceğimiz <span> elementini seçiyoruz.
const userCountElement = document.getElementById('active-user-count');

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

    // Sunucudan bir mesaj geldiğinde çalışır.
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Gelen verinin tipi 'userCount' ise içindeki sayıyı ekrana yazdırıyoruz.
        if (data.type === 'userCount') {
            userCountElement.textContent = data.count;
        }

        // YENİ: Gelen verinin tipi 'priceUpdate' ise...
        if (data.type === 'priceUpdate') {
            console.log('Fiyat güncelleme mesajı alındı, ana sayfaya etkinlik gönderiliyor...');
            // Ana HTML sayfasının dinleyebileceği özel bir etkinlik oluştur ve fırlat.
            // Bu, farklı script dosyalarının birbiriyle konuşmasının en temiz yoludur.
            const priceEvent = new CustomEvent('pricesUpdated', { detail: data.data });
            document.dispatchEvent(priceEvent);
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