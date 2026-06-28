**Özet:** Node.js ve Express tabanlı backend uygulamasının katmanlı mimarisi ve API uç noktalarının organizasyonu.
**Kütüphaneler:** Node.js, Express, TypeScript, Prisma ORM
**Bağlantılar:** [[Database_Schema]], [[Auth_Flow]], [[Index]]

# Server Architecture (Express.js)
Backend klasörü (`server/`) katmanlı mimari (layered architecture) prensiplerine uygun olarak tasarlanmıştır.

## Klasör Yapısı
- `src/controllers`: Gelen HTTP isteklerini işleyen ve response dönen mantık katmanı.
- `src/services`: Veritabanı işlemleri ve iş mantığının (business logic) bulunduğu katman.
- `src/routes`: API uç noktalarının tanımlandığı ve ilgili controller'lara yönlendirildiği katman.
- `src/middlewares`: JWT doğrulama, hata yakalama (error handling) işlemleri.

## API İskeleti
Uygulama RESTful prensiplere uygun çalışacak şekilde yapılandırılmaktadır. [[Auth_Flow]] ve [[Subscription_Management]] iş akışları bu mimari üzerinden yürütülür.
