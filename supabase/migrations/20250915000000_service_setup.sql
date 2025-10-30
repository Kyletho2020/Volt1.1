create extension if not exists "pgcrypto";

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  title text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists chat_messages_session_created_at_idx
  on chat_messages (session_id, created_at);

create table if not exists integration_keys (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  key_type text not null default 'api_key',
  version integer not null,
  status text not null default 'active' check (status in ('active', 'rotated', 'revoked')),
  encrypted_secret text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  rotated_at timestamptz
);

create unique index if not exists integration_keys_provider_type_version_idx
  on integration_keys (provider, key_type, version);

create index if not exists integration_keys_active_idx
  on integration_keys (provider, key_type)
  where status = 'active';
