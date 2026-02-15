-- Repair script for older schemas that used camelCase column names.
-- Safe to run multiple times.

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

do $$
begin
  -- profiles
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='authUserId')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='auth_user_id') then
    execute 'alter table public.profiles rename column "authUserId" to auth_user_id';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='appUserId')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='app_user_id') then
    execute 'alter table public.profiles rename column "appUserId" to app_user_id';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='avatarUrl')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='avatar_url') then
    execute 'alter table public.profiles rename column "avatarUrl" to avatar_url';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='createdAt')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='created_at') then
    execute 'alter table public.profiles rename column "createdAt" to created_at';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='updatedAt')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='updated_at') then
    execute 'alter table public.profiles rename column "updatedAt" to updated_at';
  end if;

  -- properties
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='ownerProfileId')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='owner_profile_id') then
    execute 'alter table public.properties rename column "ownerProfileId" to owner_profile_id';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='propertyName')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='property_name') then
    execute 'alter table public.properties rename column "propertyName" to property_name';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='propertyType')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='property_type') then
    execute 'alter table public.properties rename column "propertyType" to property_type';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='bikeParking')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='bike_parking') then
    execute 'alter table public.properties rename column "bikeParking" to bike_parking';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='carParking')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='car_parking') then
    execute 'alter table public.properties rename column "carParking" to car_parking';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='carParkingSpaces')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='car_parking_spaces') then
    execute 'alter table public.properties rename column "carParkingSpaces" to car_parking_spaces';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='waterSupply')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='water_supply') then
    execute 'alter table public.properties rename column "waterSupply" to water_supply';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='furnishedLevel')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='furnished_level') then
    execute 'alter table public.properties rename column "furnishedLevel" to furnished_level';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='dueDate')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='due_date') then
    execute 'alter table public.properties rename column "dueDate" to due_date';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='leaseEnd')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='lease_end') then
    execute 'alter table public.properties rename column "leaseEnd" to lease_end';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='createdAt')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='created_at') then
    execute 'alter table public.properties rename column "createdAt" to created_at';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='updatedAt')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='updated_at') then
    execute 'alter table public.properties rename column "updatedAt" to updated_at';
  end if;

  -- property_images
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='property_images' and column_name='propertyId')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='property_images' and column_name='property_id') then
    execute 'alter table public.property_images rename column "propertyId" to property_id';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='property_images' and column_name='mimeType')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='property_images' and column_name='mime_type') then
    execute 'alter table public.property_images rename column "mimeType" to mime_type';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='property_images' and column_name='createdAt')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='property_images' and column_name='created_at') then
    execute 'alter table public.property_images rename column "createdAt" to created_at';
  end if;

  -- bills
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='propertyId')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='property_id') then
    execute 'alter table public.bills rename column "propertyId" to property_id';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='propertyName')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='property_name') then
    execute 'alter table public.bills rename column "propertyName" to property_name';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='tenantName')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='tenant_name') then
    execute 'alter table public.bills rename column "tenantName" to tenant_name';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='tenantEmail')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='tenant_email') then
    execute 'alter table public.bills rename column "tenantEmail" to tenant_email';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='currentMonth')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='current_month') then
    execute 'alter table public.bills rename column "currentMonth" to current_month';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='baseRent')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='base_rent') then
    execute 'alter table public.bills rename column "baseRent" to base_rent';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='confirmedRent')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='confirmed_rent') then
    execute 'alter table public.bills rename column "confirmedRent" to confirmed_rent';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='paidDate')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='paid_date') then
    execute 'alter table public.bills rename column "paidDate" to paid_date';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='paymentMethod')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='payment_method') then
    execute 'alter table public.bills rename column "paymentMethod" to payment_method';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='proofUrl')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='proof_url') then
    execute 'alter table public.bills rename column "proofUrl" to proof_url';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='createdAt')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='created_at') then
    execute 'alter table public.bills rename column "createdAt" to created_at';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='updatedAt')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bills' and column_name='updated_at') then
    execute 'alter table public.bills rename column "updatedAt" to updated_at';
  end if;

  -- bill_custom_fields
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bill_custom_fields' and column_name='billId')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bill_custom_fields' and column_name='bill_id') then
    execute 'alter table public.bill_custom_fields rename column "billId" to bill_id';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bill_custom_fields' and column_name='createdAt')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bill_custom_fields' and column_name='created_at') then
    execute 'alter table public.bill_custom_fields rename column "createdAt" to created_at';
  end if;
end $$;

-- Ensure critical columns exist even on partially created legacy tables.
alter table if exists public.properties add column if not exists property_name text;
alter table if exists public.properties add column if not exists property_code text;
alter table if exists public.properties add column if not exists property_type text;
alter table if exists public.properties add column if not exists currency text default 'USD';
alter table if exists public.properties add column if not exists price numeric(12,2) default 0;
alter table if exists public.properties add column if not exists interval text default 'monthly';
alter table if exists public.properties add column if not exists car_parking_spaces int not null default 0;
alter table if exists public.properties add column if not exists water_supply boolean not null default false;
alter table if exists public.properties add column if not exists wifi boolean not null default false;
alter table if exists public.properties add column if not exists furnished_level text not null default 'none';
alter table if exists public.properties add column if not exists created_at timestamptz default now();

-- Normalize legacy negative values before property_code backfill updates.
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

update public.properties
set property_code = public.next_property_code()
where property_code is null;

alter table if exists public.properties alter column property_code set default public.next_property_code();
alter table if exists public.properties alter column property_code set not null;

create unique index if not exists idx_properties_property_code on public.properties(property_code);
create unique index if not exists idx_properties_id_unique on public.properties(id);

alter table if exists public.property_images add column if not exists property_id bigint;
alter table if exists public.property_images add column if not exists url text;
alter table if exists public.property_images add column if not exists created_at timestamptz default now();

alter table if exists public.bills add column if not exists property_id bigint;
alter table if exists public.bills add column if not exists property_name text;
alter table if exists public.bills add column if not exists tenant_name text;
alter table if exists public.bills add column if not exists current_month text;
alter table if exists public.bills add column if not exists base_rent numeric(12,2) default 0;
alter table if exists public.bills add column if not exists confirmed_rent numeric(12,2) default 0;
alter table if exists public.bills add column if not exists breakdown jsonb default '{}'::jsonb;
alter table if exists public.bills add column if not exists total numeric(12,2) default 0;
alter table if exists public.bills add column if not exists status text default 'pending';
alter table if exists public.bills add column if not exists created_at timestamptz default now();

alter table if exists public.bill_custom_fields add column if not exists bill_id bigint;
alter table if exists public.bill_custom_fields add column if not exists name text;
alter table if exists public.bill_custom_fields add column if not exists amount numeric(12,2) default 0;
alter table if exists public.bill_custom_fields add column if not exists created_at timestamptz default now();

-- Add missing FK constraints needed by nested selects:
-- select("*, property_images(*)") and select("*, bill_custom_fields(*)")
do $$
begin
  if exists (select 1 from pg_class where relname='property_images')
     and exists (select 1 from pg_class where relname='properties')
     and not exists (select 1 from pg_constraint where conname='property_images_property_id_fkey') then
    execute 'alter table public.property_images add constraint property_images_property_id_fkey foreign key (property_id) references public.properties(id) on delete cascade not valid';
  end if;

  if exists (select 1 from pg_class where relname='bills')
     and exists (select 1 from pg_class where relname='properties')
     and not exists (select 1 from pg_constraint where conname='bills_property_id_fkey') then
    execute 'alter table public.bills add constraint bills_property_id_fkey foreign key (property_id) references public.properties(id) on delete cascade not valid';
  end if;

  if exists (select 1 from pg_class where relname='bill_custom_fields')
     and exists (select 1 from pg_class where relname='bills')
     and not exists (select 1 from pg_constraint where conname='bill_custom_fields_bill_id_fkey') then
    execute 'alter table public.bill_custom_fields add constraint bill_custom_fields_bill_id_fkey foreign key (bill_id) references public.bills(id) on delete cascade not valid';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_class where relname='properties')
     and not exists (select 1 from pg_constraint where conname='properties_price_non_negative') then
    execute 'alter table public.properties add constraint properties_price_non_negative check (price >= 0) not valid';
  end if;

  if exists (select 1 from pg_class where relname='properties')
     and not exists (select 1 from pg_constraint where conname='properties_rooms_non_negative') then
    execute 'alter table public.properties add constraint properties_rooms_non_negative check (rooms >= 0) not valid';
  end if;

  if exists (select 1 from pg_class where relname='properties')
     and not exists (select 1 from pg_constraint where conname='properties_bedrooms_non_negative') then
    execute 'alter table public.properties add constraint properties_bedrooms_non_negative check (bedrooms >= 0) not valid';
  end if;

  if exists (select 1 from pg_class where relname='properties')
     and not exists (select 1 from pg_constraint where conname='properties_bathrooms_non_negative') then
    execute 'alter table public.properties add constraint properties_bathrooms_non_negative check (bathrooms >= 0) not valid';
  end if;

  if exists (select 1 from pg_class where relname='properties')
     and not exists (select 1 from pg_constraint where conname='properties_kitchens_non_negative') then
    execute 'alter table public.properties add constraint properties_kitchens_non_negative check (kitchens >= 0) not valid';
  end if;

  if exists (select 1 from pg_class where relname='properties')
     and not exists (select 1 from pg_constraint where conname='properties_dinings_non_negative') then
    execute 'alter table public.properties add constraint properties_dinings_non_negative check (dinings >= 0) not valid';
  end if;

  if exists (select 1 from pg_class where relname='properties')
     and not exists (select 1 from pg_constraint where conname='properties_livings_non_negative') then
    execute 'alter table public.properties add constraint properties_livings_non_negative check (livings >= 0) not valid';
  end if;

  if exists (select 1 from pg_class where relname='properties')
     and not exists (select 1 from pg_constraint where conname='properties_sqft_non_negative') then
    execute 'alter table public.properties add constraint properties_sqft_non_negative check (sqft is null or sqft >= 0) not valid';
  end if;

  if exists (select 1 from pg_class where relname='properties')
     and not exists (select 1 from pg_constraint where conname='properties_car_parking_spaces_non_negative') then
    execute 'alter table public.properties add constraint properties_car_parking_spaces_non_negative check (car_parking_spaces >= 0) not valid';
  end if;

  if exists (select 1 from pg_class where relname='properties')
     and not exists (select 1 from pg_constraint where conname='properties_furnished_level_check') then
    execute 'alter table public.properties add constraint properties_furnished_level_check check (furnished_level in (''none'', ''semi'', ''full'')) not valid';
  end if;
end $$;
