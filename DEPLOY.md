# Развёртывание на сервер

Сайт — Node.js-приложение (Next.js) с базой PostgreSQL. Админка — `https://<домен>/web-lite-panel`.

Схема: **nginx** (HTTPS, статика, лимиты) → **Next.js** на `127.0.0.1:3000` → **PostgreSQL** на `127.0.0.1:5432`.
Наружу открыт только nginx.

## Что нужно

- VPS с Ubuntu 22.04/24.04, от 2 ГБ памяти (сборка Next.js требовательна к памяти).
- Node.js **22.18+** (консольные скрипты запускают TypeScript без сборки).
- PostgreSQL 16+.
- nginx и certbot (бесплатный сертификат Let's Encrypt).
- Домен, направленный на IP сервера.

## 1. Сервер и пользователь

```bash
sudo apt update && sudo apt install -y nginx postgresql certbot python3-certbot-nginx git ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs

# Файрвол: только SSH и веб. PostgreSQL и Node снаружи недоступны.
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable

# Отдельный пользователь без прав администратора — от него работает сайт
sudo adduser --system --group --home /srv/web-lite weblite
```

## 2. База данных

```bash
sudo -u postgres psql <<'SQL'
CREATE USER weblite WITH PASSWORD 'длинный-случайный-пароль';
CREATE DATABASE weblite OWNER weblite;
SQL
```

PostgreSQL по умолчанию слушает только `localhost` — так и оставьте.

## 3. Код и настройки

```bash
sudo -u weblite git clone <адрес репозитория> /srv/web-lite/app
cd /srv/web-lite/app
sudo -u weblite cp .env.example .env
sudo -u weblite nano .env
sudo chmod 600 .env
```

В `.env`:

| Переменная | Значение |
|---|---|
| `DATABASE_URL` | `postgres://weblite:пароль@127.0.0.1:5432/weblite` |
| `TRUST_PROXY` | `1` — сайт за nginx, IP посетителя берётся из `X-Real-IP` |
| `APP_SECRET` | `openssl rand -base64 32`. **Не меняйте после запуска**: от него зависят ключи 2FA |
| `UPLOADS_DIR` | `/srv/web-lite/uploads` — загруженные картинки, вне папки с кодом |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | необязательно: письмо о заявке на почту из контактов сайта (уходит первым) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | необязательно: уведомление о заявке в Telegram-группу (после письма) |

```bash
sudo -u weblite mkdir -p /srv/web-lite/uploads
sudo -u weblite npm ci
sudo -u weblite npm run db:migrate
sudo -u weblite npm run db:seed        # тексты по умолчанию — только в пустые разделы
sudo -u weblite npm run build
sudo -u weblite npm run admin:create   # первый администратор
```

## 4. Запуск как служба (systemd)

`/etc/systemd/system/web-lite.service`:

```ini
[Unit]
Description=Web-Lite site
After=network.target postgresql.service

[Service]
User=weblite
Group=weblite
WorkingDirectory=/srv/web-lite/app
EnvironmentFile=/srv/web-lite/app/.env
Environment=NODE_ENV=production PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3
# Ограничения: служба не может менять систему и видеть чужие файлы
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/srv/web-lite/uploads /srv/web-lite/app/.next

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now web-lite
sudo systemctl status web-lite        # должно быть active (running)
```

`npm start` слушает только `127.0.0.1` — напрямую из интернета к Node не подключиться.

## 5. nginx

`/etc/nginx/sites-available/web-lite` (замените `example.com`):

```nginx
# Лимиты: вход в админку — 5 запросов в минуту с IP, остальные POST (заявки) — 10 в минуту
limit_req_zone $binary_remote_addr zone=wl_login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=wl_post:10m rate=10r/m;

server {
    listen 80;
    # *.example.com — регионы на поддоменах (см. «Регионы» ниже)
    server_name example.com *.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.example.com;
    # ssl_certificate ... — тот же сертификат, что ниже
    return 301 https://example.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com *.example.com;
    # ssl_certificate ... — допишет certbot (или см. «Регионы»: сертификат на *.example.com)

    server_tokens off;
    client_max_body_size 16m;     # загрузка картинок до 15 МБ
    client_body_timeout 15s;
    client_header_timeout 15s;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

    # Загруженные картинки — напрямую с диска, без Node
    location /uploads/ {
        alias /srv/web-lite/uploads/;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options nosniff;
        # Только картинки, ничего не выполняется
        location ~* \.(php|html?|js|svg)$ { return 404; }
    }

    location = /web-lite-panel/login {
        limit_req zone=wl_login burst=5 nodelay;
        proxy_pass http://127.0.0.1:3000;
        include /etc/nginx/snippets/web-lite-proxy.conf;
    }

    location / {
        limit_req zone=wl_post burst=20 nodelay;
        limit_req_status 429;
        proxy_pass http://127.0.0.1:3000;
        include /etc/nginx/snippets/web-lite-proxy.conf;
    }
}
```

`/etc/nginx/snippets/web-lite-proxy.conf`:

```nginx
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
# Настоящий IP посетителя. Заголовок ставит nginx, присланный браузером — перезаписывается.
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $remote_addr;
proxy_buffering off;
```

> `limit_req` с зоной `wl_post` срабатывает на любые запросы, но `rate=10r/m` с `burst=20` не мешает обычному просмотру.
> Если сайт открывают многие из одной сети, увеличьте `burst`.

```bash
sudo ln -s /etc/nginx/sites-available/web-lite /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d example.com -d www.example.com
```

После этого в админке, в разделе «Контакты и реквизиты», укажите адрес сайта `https://example.com`.

### Регионы на поддоменах

Сайт отвечает на `kazan.example.com`, `spb.example.com` и т.д. — список регионов в админке, раздел «Регионы».
Контент везде общий, у региона свои город (переменные `{город}`, `{город_им}`, `{город_род}`) и мета-теги,
свои canonical, `sitemap.xml` и `robots.txt`. Поддомен, которого нет в списке, перенаправляется на основной домен.

1. **DNS:** запись `*.example.com` (A) на IP сервера.
2. **Сертификат на `*.example.com`.** Let's Encrypt выдаёт wildcard только с проверкой через DNS,
   поэтому нужен плагин certbot для вашего DNS-провайдера (тогда сертификат продлевается сам), например Cloudflare:

   ```bash
   sudo apt install -y python3-certbot-dns-cloudflare
   # /root/.secrets/cloudflare.ini: dns_cloudflare_api_token = <токен с правом Zone:DNS:Edit>; chmod 600
   sudo certbot certonly --dns-cloudflare --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \
     -d example.com -d '*.example.com'
   ```

   В обоих `server` с `listen 443` пропишите:

   ```nginx
   ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
   ```

3. **Яндекс Вебмастер:** основному домену укажите регион «Краснодар» (город основного домена — в «Регионы» → «Основной домен»),
   каждый поддомен добавьте как отдельный сайт и укажите ему его регион
   («Представление в поиске» → «Региональность»). В Google Search Console достаточно ресурса «Доменный ресурс».

Локально регион открывается на `http://kazan.localhost:3000`.

## 6. Резервные копии

Всё ценное — в базе (контент, история, заявки, пользователи) и в папке загрузок.

`/etc/cron.daily/web-lite-backup` (не забудьте `chmod +x`):

```bash
#!/bin/sh
set -e
DIR=/srv/web-lite/backups
mkdir -p $DIR
sudo -u postgres pg_dump -Fc weblite > $DIR/db-$(date +%F).dump
tar -czf $DIR/uploads-$(date +%F).tar.gz -C /srv/web-lite uploads
# Храним 14 дней
find $DIR -type f -mtime +14 -delete
```

Копируйте резервные копии и на другой сервер или в облако: копия на том же диске не спасёт при поломке сервера.

Восстановление: `sudo -u postgres pg_restore -d weblite --clean db-ДАТА.dump`.

## 7. Обновление сайта

```bash
cd /srv/web-lite/app
sudo -u weblite git pull
sudo -u weblite npm ci
sudo -u weblite npm run db:migrate
sudo -u weblite npm run build
sudo systemctl restart web-lite
```

Тексты, которые меняли в админке, при обновлении не затираются. `db:seed` добавляет только новые разделы.

## Если что-то пошло не так

| Проблема | Что сделать |
|---|---|
| Забыли пароль | `sudo -u weblite npm run admin:reset-password` |
| Потеряли телефон с 2FA | `sudo -u weblite npm run admin:reset-2fa` (или другой администратор: «Пользователи» → «Сбросить 2FA») |
| «Слишком много неудачных попыток» | Подождите 15 минут или задайте новый пароль командой выше: она снимает блокировку |
| Сайт не открывается | `sudo journalctl -u web-lite -n 100` — последние сообщения сайта |
| Заявки не приходят в Telegram | Проверьте `TELEGRAM_*` в `.env`. Заявки при этом всё равно сохраняются в админке |

## Что защищает сайт

- **Вход в админку.**
  - Пароли хранятся как хеш scrypt.
  - Неудачные попытки ограничены: 5 на логин и 20 на IP за 15 минут, плюс лимит nginx.
  - Есть двухфакторная авторизация (TOTP).
  - Сессии хранятся в базе и истекают через 2 часа бездействия или через 12 часов в любом случае.
- **Cookie сессии.** `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax`. В базе — только хеш токена.
- **CSRF.**
  - Server Actions Next.js сверяют Origin.
  - Загрузка картинок дополнительно требует свой заголовок.
- **XSS.**
  - React экранирует весь текст.
  - Строгая Content-Security-Policy с nonce.
  - JSON-LD экранируется.
  - Ссылки в контенте разрешены только `https://`.
- **Данные.**
  - Все SQL-запросы параметризованы.
  - Любой контент проверяется схемой на сервере.
  - IP хранятся только в виде HMAC.
- **Картинки.**
  - Тип проверяется по содержимому.
  - Каждый файл перекодируется: метаданные удаляются.
  - Имена файлов случайные, размер ограничен.
- **Заявки.**
  - Все проверки повторяются на сервере.
  - Ловушка для ботов и минимальное время заполнения.
  - Лимит по IP.
  - Цену квиза считает сервер.
- **Роли и журнал.** Редактор не управляет пользователями. Все действия пишутся в журнал, у каждого раздела есть история версий с откатом.
