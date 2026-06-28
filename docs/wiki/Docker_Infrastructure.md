**Özet:** Projenin backend, frontend ve veritabanı servislerinin izole ve senkronize olarak çalışmasını sağlayan Docker Compose altyapısı.
**Kütüphaneler:** Docker, Docker Compose
**Bağlantılar:** [[Client_Architecture]], [[Server_Architecture]], [[Index]]

# Docker Infrastructure
Tüm projeyi tek komutla (`docker-compose up -d --build`) ayağa kaldırmak için `docker-compose.yml` kullanılmıştır.

## Servisler
- **db:** `postgres:15-alpine` imajı üzerinden çalışan PostgreSQL veritabanı. Port: `5432`
- **backend:** `server/Dockerfile` üzerinden derlenen Node.js API servisi. Port: `5000`
- **frontend:** `client/Dockerfile` üzerinden derlenen Next.js uygulaması. Port: `3000`

Tüm servisler `app-network` adında özel bir Docker bridge network üzerinde iletişim kurar.
