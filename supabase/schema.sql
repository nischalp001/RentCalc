-- Rental app schema for direct client-side Supabase usage.
-- Run this in Supabase SQL Editor for your project.

create extension if not exists "pgcrypto";

create or replace function public.next_property_code()
returns text
language plpgsql
as $$
declare
  generated_code text;
begin
  loop
    generated_code := floor(random() * 9000000000 + 1000000000)::bigint::text;
    exit when not exists (
      select 1
      from public.properties
      where property_code = generated_code
    );
  end loop;

  return generated_code;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  app_user_id text unique,
  name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id bigint generated always as identity not null unique,
  property_code text primary key default public.next_property_code(),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  property_name text not null,
  name text,
  property_type text not null,
  currency text not null default 'USD',
  price numeric(12,2) not null,
  rent text,
  interval text not null default 'monthly',
  address text,
  location text,
  city text,
  rooms int not null default 0,
  bedrooms int not null default 0,
  bathrooms int not null default 0,
  kitchens int not null default 0,
  dinings int not null default 0,
  livings int not null default 0,
  sqft int,
  bike_parking text default 'no',
  car_parking text default 'no',
  car_parking_spaces int not null default 0,
  water_supply boolean not null default false,
  wifi boolean not null default false,
  furnished_level text not null default 'none' check (furnished_level in ('none', 'semi', 'full')),
  services text[] not null default '{}',
  description text,
  status text not null default 'active',
  due_date text,
  lease_end text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.properties add column if not exists car_parking_spaces int not null default 0;
alter table if exists public.properties add column if not exists water_supply boolean not null default false;
alter table if exists public.properties add column if not exists wifi boolean not null default false;
alter table if exists public.properties add column if not exists furnished_level text not null default 'none';

-- Normalize legacy negative values before any row updates/backfills.
update public.properties
set
  price = greatest(coalesce(price, 0), 0),
  rooms = greatest(coalesce(rooms, 0), 0),
  bedrooms = greatest(coalesce(bedrooms, 0), 0),
  bathrooms = greatest(coalesce(bathrooms, 0), 0),
  kitchens = greatest(coalesce(kitchens, 0), 0),
  dinings = greatest(coalesce(dinings, 0), 0),
  livings = greatest(coalesce(livings, 0), 0),
  sqft = case when sqft is null then null else greatest(sqft, 0) end,
  car_parking_spaces = greatest(coalesce(car_parking_spaces, 0), 0)
where
  price < 0
  or rooms < 0
  or bedrooms < 0
  or bathrooms < 0
  or kitchens < 0
  or dinings < 0
  or livings < 0
  or (sqft is not null and sqft < 0)
  or car_parking_spaces < 0;

alter table if exists public.properties add column if not exists property_code text;
update public.properties
set property_code = public.next_property_code()
where property_code is null;
alter table if exists public.properties alter column property_code set default public.next_property_code();
alter table if exists public.properties alter column property_code set not null;
create unique index if not exists idx_properties_property_code on public.properties(property_code);
create unique index if not exists idx_properties_id_unique on public.properties(id);

do $$
declare
  existing_pk text;
  id_fk_exists boolean;
begin
  select conname
  into existing_pk
  from pg_constraint
  where conrelid = 'public.properties'::regclass
    and contype = 'p'
  limit 1;

  select exists (
    select 1
    from pg_constraint fk
    where fk.contype = 'f'
      and fk.confrelid = 'public.properties'::regclass
      and exists (
        select 1
        from unnest(fk.confkey) as key_attnum(attnum)
        join pg_attribute attr
          on attr.attrelid = 'public.properties'::regclass
         and attr.attnum = key_attnum.attnum
        where attr.attname = 'id'
      )
  )
  into id_fk_exists;

  if existing_pk is null then
    alter table public.properties add constraint properties_property_code_pkey primary key (property_code);
  elsif existing_pk <> 'properties_property_code_pkey' and not id_fk_exists then
    execute format('alter table public.properties drop constraint %I', existing_pk);
    alter table public.properties add constraint properties_property_code_pkey primary key (property_code);
  end if;
end $$;

create table if not exists public.property_images (
  id bigint generated always as identity primary key,
  property_id bigint not null references public.properties(id) on delete cascade,
  label text,
  path text,
  url text not null,
  mime_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.property_tenants (
  id bigint generated always as identity primary key,
  property_id bigint not null references public.properties(id) on delete cascade,
  tenant_profile_id uuid references public.profiles(id) on delete set null,
  tenant_name text not null,
  tenant_email text,
  tenant_phone text,
  date_joined date,
  date_end date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bills (
  id bigint generated always as identity primary key,
  property_id bigint not null references public.properties(id) on delete cascade,
  property_name text not null,
  tenant_name text not null,
  tenant_email text,
  current_month text not null,
  base_rent numeric(12,2) not null default 0,
  confirmed_rent numeric(12,2) not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  total numeric(12,2) not null default 0,
  status text not null default 'pending',
  paid_date timestamptz,
  payment_method text,
  proof_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bill_custom_fields (
  id bigint generated always as identity primary key,
  bill_id bigint not null references public.bills(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.property_documents (
  id bigint generated always as identity primary key,
  property_id bigint not null references public.properties(id) on delete cascade,
  uploaded_by_profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  doc_type text,
  url text not null,
  mime_type text,
  description text,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid not null references public.profiles(id) on delete cascade,
  to_profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('landlord', 'tenant')),
  property_id bigint references public.properties(id) on delete set null,
  property_name text,
  status text not null default 'pending' check (status in ('pending', 'active')),
  unread_messages int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_profile_id, to_profile_id, role, property_id)
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  connection_id uuid not null references public.connections(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  sent_at timestamptz not null default now(),
  read_at timestamptz
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'properties_price_non_negative') then
    alter table public.properties
      add constraint properties_price_non_negative check (price >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'properties_rooms_non_negative') then
    alter table public.properties
      add constraint properties_rooms_non_negative check (rooms >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'properties_bedrooms_non_negative') then
    alter table public.properties
      add constraint properties_bedrooms_non_negative check (bedrooms >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'properties_bathrooms_non_negative') then
    alter table public.properties
      add constraint properties_bathrooms_non_negative check (bathrooms >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'properties_kitchens_non_negative') then
    alter table public.properties
      add constraint properties_kitchens_non_negative check (kitchens >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'properties_dinings_non_negative') then
    alter table public.properties
      add constraint properties_dinings_non_negative check (dinings >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'properties_livings_non_negative') then
    alter table public.properties
      add constraint properties_livings_non_negative check (livings >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'properties_sqft_non_negative') then
    alter table public.properties
      add constraint properties_sqft_non_negative check (sqft is null or sqft >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'properties_car_parking_spaces_non_negative') then
    alter table public.properties
      add constraint properties_car_parking_spaces_non_negative check (car_parking_spaces >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'properties_furnished_level_check') then
    alter table public.properties
      add constraint properties_furnished_level_check check (furnished_level in ('none', 'semi', 'full')) not valid;
  end if;
end $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_properties_updated on public.properties;
create trigger trg_properties_updated
before update on public.properties
for each row execute function public.set_updated_at();

drop trigger if exists trg_property_tenants_updated on public.property_tenants;
create trigger trg_property_tenants_updated
before update on public.property_tenants
for each row execute function public.set_updated_at();

drop trigger if exists trg_bills_updated on public.bills;
create trigger trg_bills_updated
before update on public.bills
for each row execute function public.set_updated_at();

drop trigger if exists trg_connections_updated on public.connections;
create trigger trg_connections_updated
before update on public.connections
for each row execute function public.set_updated_at();

create index if not exists idx_profiles_auth_user_id on public.profiles(auth_user_id);
create index if not exists idx_profiles_app_user_id on public.profiles(app_user_id);
create index if not exists idx_properties_owner on public.properties(owner_profile_id);
create index if not exists idx_property_images_property_id on public.property_images(property_id);
create index if not exists idx_property_tenants_property_id on public.property_tenants(property_id);
create index if not exists idx_bills_property_id on public.bills(property_id);
create index if not exists idx_bills_status on public.bills(status);
create index if not exists idx_bills_month on public.bills(current_month);
create index if not exists idx_bill_custom_fields_bill_id on public.bill_custom_fields(bill_id);
create index if not exists idx_documents_property_id on public.property_documents(property_id);
create index if not exists idx_connections_from_profile on public.connections(from_profile_id);
create index if not exists idx_connections_to_profile on public.connections(to_profile_id);
create index if not exists idx_messages_connection on public.messages(connection_id);

-- Explicit grants for anon/authenticated browser clients.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;

-- RLS is enabled because this app uses NEXT_PUBLIC_SUPABASE_ANON_KEY in the browser.
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_tenants enable row level security;
alter table public.bills enable row level security;
alter table public.bill_custom_fields enable row level security;
alter table public.property_documents enable row level security;
alter table public.connections enable row level security;
alter table public.messages enable row level security;

drop policy if exists "profiles_all_access" on public.profiles;
create policy "profiles_all_access"
on public.profiles
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "properties_all_access" on public.properties;
create policy "properties_all_access"
on public.properties
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "property_images_all_access" on public.property_images;
create policy "property_images_all_access"
on public.property_images
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "property_tenants_all_access" on public.property_tenants;
create policy "property_tenants_all_access"
on public.property_tenants
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "bills_all_access" on public.bills;
create policy "bills_all_access"
on public.bills
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "bill_custom_fields_all_access" on public.bill_custom_fields;
create policy "bill_custom_fields_all_access"
on public.bill_custom_fields
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "property_documents_all_access" on public.property_documents;
create policy "property_documents_all_access"
on public.property_documents
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "connections_all_access" on public.connections;
create policy "connections_all_access"
on public.connections
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "messages_all_access" on public.messages;
create policy "messages_all_access"
on public.messages
for all
to anon, authenticated
using (true)
with check (true);

-- Storage bucket for property cover images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'property-assets',
  'property-assets',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where not exists (
  select 1 from storage.buckets where id = 'property-assets'
);

-- storage.objects is owned by Supabase internal role (supabase_storage_admin).
-- RLS is already enabled there by default, so do not run ALTER TABLE on it.

drop policy if exists "property_assets_public_read" on storage.objects;
create policy "property_assets_public_read"
on storage.objects
for select
to public
using (bucket_id = 'property-assets');

drop policy if exists "property_assets_anon_upload" on storage.objects;
create policy "property_assets_anon_upload"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'property-assets');

drop policy if exists "property_assets_anon_update" on storage.objects;
create policy "property_assets_anon_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'property-assets')
with check (bucket_id = 'property-assets');

drop policy if exists "property_assets_anon_delete" on storage.objects;
create policy "property_assets_anon_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'property-assets');
