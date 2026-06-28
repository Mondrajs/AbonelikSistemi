**Özet:** Kullanıcıların kayıt olma, giriş yapma ve yetkilendirme süreçlerini (JWT) anlatan kimlik doğrulama iş akışı.
**Kütüphaneler:** JWT (JSON Web Token), bcrypt
**Bağlantılar:** [[Client_Architecture]], [[Server_Architecture]], [[Database_Schema]], [[Index]]

# Auth Flow (Kimlik Doğrulama Akışı)
Güvenlik JWT tabanlı sağlanmaktadır.

## Süreç
1. **Kayıt (Register):** Kullanıcı bilgileri (Ad Soyad, E-posta, Şifre) frontend'den gönderilir. `/register` sayfasında şifre gücü göstergesi (çubuk barlar şeklinde) ve input içi prefix ikonları mevcuttur. Backend parolayı `bcrypt` ile hash'leyerek [[Database_Schema]] içerisindeki `User` tablosuna kaydeder.
2. **Giriş (Login):** `/login` sayfasında sol tarafta "Premium Yönetim" görsel tanıtım paneli, sağ tarafta ise giriş formu bulunur. Başarılı doğrulama sonrası backend bir JWT token üretir.
3. **Yetkilendirme:** Frontend bu token'ı alır ve sonraki isteklerde HTTP header (`Authorization: Bearer <token>`) üzerinden gönderir. Google ve Apple sosyal oturum açma butonları arayüzde desteklenmektedir.
