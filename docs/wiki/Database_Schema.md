**Özet:** PostgreSQL ve Prisma ORM kullanılarak oluşturulan veritabanı tablolarının ve aralarındaki ilişkilerin detayları.
**Kütüphaneler:** PostgreSQL, Prisma ORM
**Bağlantılar:** [[Server_Architecture]], [[Index]]

# Database Schema (Prisma)
Projede `schema.prisma` dosyası üzerinden yapılandırılan 4 ana model bulunmaktadır:

## Modeller
1. **User:** Kullanıcı hesap bilgileri (`id`, `email`, `passwordHash` vb.).
2. **Plan:** Sistemdeki üyelik paketleri (Basic, Pro, Family vs.). `price`, `billingCycle` ve `features` alanlarını içerir.
3. **UserSubscription:** Kullanıcılar ve Planlar arasındaki abonelik durumu. `status` (ACTIVE, CANCELED, PAST_DUE), `startDate`, `endDate` içerir.
4. **Analytics:** Kullanıcı aboneliğine ait metrik ve kullanımların kaydedildiği tablo (`metricType`, `value`).
