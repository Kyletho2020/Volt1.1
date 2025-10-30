create table if not exists crm_records (
  id uuid primary key default gen_random_uuid(),
  object_type_id text not null,
  object_id text,
  properties jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'synced', 'failed')),
  error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists crm_records_object_lookup_idx
  on crm_records (object_type_id, coalesce(object_id, ''));

create or replace function set_crm_record_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger crm_records_updated_at
before update on crm_records
for each row
execute function set_crm_record_updated_at();
