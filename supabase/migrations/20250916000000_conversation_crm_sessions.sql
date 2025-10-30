create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  external_user_id text not null,
  session_type text not null default 'web',
  status text not null default 'active' check (status in ('active', 'ended', 'expired')),
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default timezone('utc', now()),
  last_active_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_sessions_external_user_idx
  on user_sessions (external_user_id);

create index if not exists user_sessions_status_type_idx
  on user_sessions (status, session_type);

create table if not exists conversation_transcripts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references user_sessions (id) on delete cascade,
  message_role text not null check (message_role in ('system', 'user', 'assistant', 'tool', 'integration')),
  message_content text not null,
  message_index int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists conversation_transcripts_session_order_idx
  on conversation_transcripts (session_id, created_at, message_index);

create table if not exists crm_change_logs (
  id uuid primary key default gen_random_uuid(),
  crm_object_type text not null,
  crm_object_id text not null,
  change_type text not null,
  change_summary text,
  details jsonb not null default '{}'::jsonb,
  source text,
  session_id uuid references user_sessions (id) on delete set null,
  initiated_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists crm_change_logs_object_idx
  on crm_change_logs (crm_object_type, crm_object_id, created_at desc);

create or replace function set_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger user_sessions_set_updated_at
before update on user_sessions
for each row
execute function set_timestamp_updated_at();

create trigger conversation_transcripts_set_updated_at
before update on conversation_transcripts
for each row
execute function set_timestamp_updated_at();

create trigger crm_change_logs_set_updated_at
before update on crm_change_logs
for each row
execute function set_timestamp_updated_at();
