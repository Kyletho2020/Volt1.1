/*
  Create persistent quote history table

  Table: quotes
    - id (uuid, pk)
    - session_id (text)
    - quote_number (text)
    - customer_name (text)
    - company_name (text)
    - email (text)
    - phone (text)
    - site_address (text)
    - pickup_address (text)
    - pickup_city (text)
    - pickup_state (text)
    - pickup_zip (text)
    - form_snapshot (jsonb)
    - created_at, updated_at (timestamptz)
*/

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  quote_number text not null,
  customer_name text,
  company_name text,
  email text,
  phone text,
  site_address text,
  pickup_address text,
  pickup_city text,
  pickup_state text,
  pickup_zip text,
  form_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table quotes enable row level security;

-- Allow public to read quotes (frontend filters by session_id in function)
drop policy if exists "public can read quotes" on quotes;
create policy "public can read quotes"
  on quotes for select
  to public
  using (true);

-- Restrict writes to service key (no direct public writes)
drop policy if exists "service can write quotes" on quotes;
create policy "service can write quotes"
  on quotes for all
  to service_role
  using (true)
  with check (true);

-- Trigger to maintain updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists quotes_set_updated_at on quotes;
create trigger quotes_set_updated_at
  before update on quotes
  for each row
  execute function set_updated_at();


