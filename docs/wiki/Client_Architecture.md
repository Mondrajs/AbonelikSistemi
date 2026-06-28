**Özet:** Next.js (App Router) tabanlı istemci (frontend) uygulamasının yapısal detayları ve klasör mimarisi. Kullanıcı arayüzü, state yönetimi ve tema yapılandırmasını içerir.
**Kütüphaneler:** Next.js 14, React, TailwindCSS, Zustand, Recharts
**Bağlantılar:** [[Auth_Flow]], [[Subscription_Management]], [[Index]]

# Client Architecture (Next.js)
Frontend klasörü (`client/`) Next.js App Router mimarisine uygun olarak yapılandırılmıştır.

## Klasör Yapısı
- `src/app`: Route ve sayfa yapıları. `(auth)` ve `(dashboard)` gruplarına ayrılmıştır.
- `src/components`: UI bileşenleri (`ui`, `layout`, `charts`).
- `src/store`: Zustand tabanlı global state yönetimi.
- `src/lib`: Axios veya Fetch API utility fonksiyonları.

## Özellikler
- **Tasarım & Tema:** TailwindCSS kullanılarak Dark/Light mode yönetimi yapılandırılmıştır. Responsive grid/flex yapıları mevcuttur.
- **Grafikler:** Dashboard analitikleri için Recharts kütüphanesi kullanılacaktır.
- **Performans & Hydration Optimizasyonu:** Next.js SSR (Server-Side Rendering) kaynaklı Zustand `persist` yerel depolama uyumsuzluğunu (hydration mismatch) gidermek amacıyla `DashboardLayout` düzeyinde bir istemci-tarafı montaj koruması (`mounted guard`) entegre edilmiştir. Bu sayede sekmeler ve sayfalar arası kasma sorunu tamamen giderilmiş, geçişler anlık hale getirilmiştir.
