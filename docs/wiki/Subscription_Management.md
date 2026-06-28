**Özet:** Kullanıcı aboneliklerinin, paketlerin ve analitik verilerinin nasıl işlendiğini ve UI üzerinde nasıl gösterileceğini açıklayan iş akışı.
**Kütüphaneler:** Prisma
**Bağlantılar:** [[Database_Schema]], [[Server_Architecture]], [[Client_Architecture]], [[Index]]

# Subscription Management
Abonelik sisteminin merkezinde [[Database_Schema]] içindeki `Plan` ve `UserSubscription` tabloları bulunur.

## İşlemler (CRUD & Global State)
- Abonelik verileri `useSubscriptionStore` (Zustand) global state yöneticisinde tutulur ve tarayıcı belleğinde saklanır.
- **Ekleme & Silme:** Dashboard üzerinden yeni abonelikler (adı, fiyatı, kategorisi, fatura tarihi, paket özellikleri ile) dinamik olarak eklenip silinebilir.
- **Düzenleme & İptal:** Detay sayfası (`/subscriptions/[id]`) üzerinden abonelik planı güncellenebilir ve iptal (Canceled) edilebilir.
- **Grafik Güncellemeleri:** State değişiklikleri Recharts Pie ve Area grafiklerine anlık yansır.

## Abonelik ve Aile Planı Ayrımı (Subscription Separation)
- **Ayrım Özelliği:** Her abonelik `isFamilyPlan` (boolean) parametresi barındırabilir.
- **Normal Abonelikler:** Kontrol Paneli (`/`) üzerinden yönetilir. Liste ekranında ve genel finansal hesaplamalarda sadece `isFamilyPlan !== true` olan bireysel abonelikler listelenir.
- **Aile Planları:** Aile Planı (`/family-plan`) sayfası altında listelenir. Kullanıcılar birden fazla aile planı varsa aralarında geçiş yapabilir, seçilen aile planına özel üye davetlerini ve kalan kontenjanı dinamik grafiklerle takip edebilirler.
- **Ekleme İşlemi:** Kontrol Paneli'ndeki "Abonelik Ekle" formu üzerinde yer alan "Aile Planı Aboneliği" seçeneği ile yeni eklemelerin hangi gruba ait olacağı belirlenir.

## Bildirim Sistemleri
1. **Telegram:** Ayarlar panelinden Bot Token ve Chat ID girilerek Telegram HTTP API üzerinden test mesajı ve uyarı bildirimleri tetiklenir.
2. **WhatsApp:** QR kod üretimi ve okuma animasyonu ile sanal bağlantı kurularak bildirim testleri gerçekleştirilir.
3. **Aile Planı Davetleri:** E-posta davetlerinde yüklenme animasyonu ve gönderildi bildirimleri (`toast`) entegre edilmiştir.
