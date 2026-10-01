-- Начальная схема: пользователи админки, сессии, контент с историей, заявки, загрузки, журнал действий.

CREATE TABLE users (
  id                  serial PRIMARY KEY,
  login               text NOT NULL UNIQUE CHECK (login ~ '^[a-z0-9._-]{3,32}$'),
  name                text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  role                text NOT NULL CHECK (role IN ('admin', 'editor')),
  password_hash       text NOT NULL,
  is_active           boolean NOT NULL DEFAULT true,
  -- Двухфакторная авторизация (TOTP): секрет зашифрован AES-256-GCM ключом из APP_SECRET
  totp_secret         text,
  totp_enabled        boolean NOT NULL DEFAULT false,
  -- Последний принятый шаг TOTP: один и тот же код нельзя использовать дважды
  totp_last_step      bigint NOT NULL DEFAULT 0,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  last_login_at       timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- В cookie — случайный токен, в базе — только его SHA-256: утечка базы не даёт войти по чужой сессии.
CREATE TABLE sessions (
  id           text PRIMARY KEY,
  user_id      integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  ip_hash      text,
  user_agent   text
);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

-- Попытки входа — ограничение перебора паролей по IP и по логину (одинаково для существующих и несуществующих логинов).
CREATE TABLE login_attempts (
  id         bigserial PRIMARY KEY,
  ip_hash    text NOT NULL,
  login      text,
  success    boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_ip_idx ON login_attempts (ip_hash, created_at);
CREATE INDEX login_attempts_login_idx ON login_attempts (login, created_at);

-- Контент сайта: один документ JSON на раздел (контакты, услуги, кейсы, тексты блоков...).
CREATE TABLE content (
  key        text PRIMARY KEY,
  data       jsonb NOT NULL,
  version    integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by integer REFERENCES users(id) ON DELETE SET NULL
);

-- Все прошлые версии разделов: откат правки — восстановление версии.
CREATE TABLE content_revisions (
  id         bigserial PRIMARY KEY,
  key        text NOT NULL,
  version    integer NOT NULL,
  data       jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by integer REFERENCES users(id) ON DELETE SET NULL,
  note       text
);
CREATE INDEX content_revisions_key_idx ON content_revisions (key, id DESC);

-- Заявки с форм и квиза.
CREATE TABLE leads (
  id         bigserial PRIMARY KEY,
  source     text NOT NULL CHECK (source IN ('quiz', 'form-new', 'form-audit')),
  place      text,
  name       text,
  contact    text NOT NULL,
  channel    text CHECK (channel IN ('telegram', 'whatsapp', 'call', 'email')),
  url        text,
  task       text,
  answers    jsonb,
  price_min  integer,
  price_max  integer,
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done', 'spam')),
  note       text NOT NULL DEFAULT '',
  ip_hash    text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_status_idx ON leads (status, created_at DESC);
CREATE INDEX leads_ip_idx ON leads (ip_hash, created_at);

-- Загруженные картинки (файлы — в UPLOADS_DIR).
CREATE TABLE uploads (
  id         bigserial PRIMARY KEY,
  path       text NOT NULL UNIQUE,
  preset     text NOT NULL,
  mime       text NOT NULL,
  width      integer NOT NULL,
  height     integer NOT NULL,
  size       integer NOT NULL,
  created_by integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Журнал действий в админке: кто, когда, что сделал.
CREATE TABLE audit_log (
  id         bigserial PRIMARY KEY,
  user_id    integer REFERENCES users(id) ON DELETE SET NULL,
  action     text NOT NULL,
  target     text,
  details    jsonb,
  ip_hash    text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);
