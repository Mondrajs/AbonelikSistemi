**Özet:** Uygulamanın Vercel (Frontend), Render/Railway (Backend) ve Neon/Supabase (PostgreSQL) üzerindeki üretim ortamı (production) dağıtım mimarisi.
**Kütüphaneler:** Next.js, Express, Prisma, PostgreSQL
**Bağlantılar:** [[Client_Architecture]], [[Server_Architecture]], [[Docker_Infrastructure]], [[Index]]

# Vercel Dağıtım Mimarisi (Production)

Bu projenin canlı ortama (production) alınması için hibrit bir bulut dağıtım mimarisi kullanılmaktadır:

## Dağıtım Katmanları

### 1. Frontend: [[Client_Architecture]] -> Vercel
- **Platform:** [Vercel](https://vercel.com/)
- **Kök Klasör:** `client`
- **Derleme Ayarı:** `Next.js` varsayılan derleme komutları.
- **Çevre Değişkenleri:**
  - `NEXT_PUBLIC_API_URL`: Canlıdaki backend servisinin API uç noktası (örn: `https://api.abonelik.com/api`).

### 2. Backend: [[Server_Architecture]] -> Railway / Render
- **Platform:** [Railway](https://railway.app/) veya [Render](https://render.com/)
- **Kök Klasör:** `server`
- **Derleme Komutu:** `npm install && npx prisma generate && npm run build`
- **Başlatma Komutu:** `npm start`
- **Çevre Değişkenleri:**
  - `DATABASE_URL`: Canlı PostgreSQL veritabanı bağlantı adresi.
  - `JWT_SECRET`: Güvenli JWT anahtarı.
  - `PORT`: Servis sağlayıcı tarafından dinamik atanır.

### 3. Database: [[Database_Schema]] -> Neon / Supabase
- **Platform:** [Neon](https://neon.tech/) veya [Supabase](https://supabase.com/)
- **Servis:** Serverless PostgreSQL.
- **Entegrasyon:** Prisma şemasındaki bağlantı url'si bu servise yönlendirilir ve `npx prisma db push` ile canlı şema güncellenir.
