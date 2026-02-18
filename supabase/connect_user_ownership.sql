-- Connect authenticated users to profiles/properties/tenants and enforce RLS.
-- Safe to run multiple times.
--
-- Run order:
-- 1) supabase/repair_legacy_names.sql (if migrating old data)
-- 2) supabase/schema.sql
-- 3) supabase/connect_user_ownership.sql  <-- this file

create extension if not exists "pgcrypto";

-- Ensure relationship columns exist on older databases.
alter table if exists public.properties
  add column if not exists owner_profile_id uuid references public.profiles(id) on delete set null;

alter table if exists public.property_tenants
  add column if not exists tenant_profile_id uuid references public.profiles(id) on delete set null;

-- Useful indexes for ownership and tenant lookups.
create index if not exists idx_properties_owner_profile_id on public.properties(owner_profile_id);
create index if not exists idx_property_tenants_tenant_profile_id on public.property_tenants(tenant_profile_id);

-- Prevent duplicate active tenant-profile rows for the same property.
create unique index if not exists idx_property_tenants_active_profile_unique
on public.property_tenants(property_id, tenant_profile_id)
where status = 'active' and tenant_profile_id is not null;

-- Normalize profile emails for reliable matching.
update public.profiles
set email = lower(trim(email))
where email is not null and email <> lower(trim(email));

-- Backfill tenant_profile_id from matching profile email (legacy rows).
update public.property_tenants pt
set tenant_profile_id = p.id
from public.profiles p
where pt.tenant_profile_id is null
  and pt.tenant_email is not null
  and lower(trim(pt.tenant_email)) = lower(trim(p.email));

-- Optional ownership backfill:
-- If there is exactly one profile, attach all unowned properties to that profile.
do $$
declare
  profile_count int;
  only_profile_id uuid;
begin
  select count(*) into profile_count from public.profiles;

  if profile_count = 1 then
    select id into only_profile_id from public.profiles limit 1;
    update public.properties
    set owner_profile_id = only_profile_id
    where owner_profile_id is null;
  end if;
end $$;

-- Helper functions used by RLS policies.
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.is_property_owner(p_property_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and p.owner_profile_id = public.current_profile_id()
  )
$$;

create or replace function public.is_property_tenant(p_property_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.property_tenants pt
    where pt.property_id = p_property_id
      and pt.tenant_profile_id = public.current_profile_id()
      and coalesce(pt.status, 'active') = 'active'
  )
$$;

create or replace function public.can_access_property(p_property_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_property_owner(p_property_id) or public.is_property_tenant(p_property_id)
$$;

create or replace function public.can_access_bill(p_bill_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bills b
    where b.id = p_bill_id
      and public.can_access_property(b.property_id)
  )
$$;

create or replace function public.can_access_connection(p_connection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connections c
    where c.id = p_connection_id
      and (
        c.from_profile_id = public.current_profile_id()
        or c.to_profile_id = public.current_profile_id()
      )
  )
$$;

-- Let authenticated users call helper functions.
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_property_owner(bigint) to authenticated;
grant execute on function public.is_property_tenant(bigint) to authenticated;
grant execute on function public.can_access_property(bigint) to authenticated;
grant execute on function public.can_access_bill(bigint) to authenticated;
grant execute on function public.can_access_connection(uuid) to authenticated;

-- Optional helper: claim all currently unowned properties for the signed-in user.
create or replace function public.claim_unowned_properties()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  affected int := 0;
begin
  me := public.current_profile_id();
  if me is null then
    raise exception 'No profile mapped to the authenticated user';
  end if;

  update public.properties
  set owner_profile_id = me
  where owner_profile_id is null;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

grant execute on function public.claim_unowned_properties() to authenticated;

-- Secure helper: owner connects tenant by the tenant's shared app_user_id.
create or replace function public.connect_tenant_by_app_user_id(
  p_property_id bigint,
  p_tenant_app_user_id text
)
returns public.property_tenants
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  target_profile public.profiles%rowtype;
  inserted_row public.property_tenants%rowtype;
  normalized_user_id text;
begin
  me := public.current_profile_id();
  if me is null then
    raise exception 'No profile mapped to the authenticated user';
  end if;

  if p_property_id is null or p_property_id <= 0 then
    raise exception 'Valid property ID is required';
  end if;

  normalized_user_id := trim(coalesce(p_tenant_app_user_id, ''));
  if normalized_user_id = '' then
    raise exception 'Tenant unique ID is required';
  end if;

  if not exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and p.owner_profile_id = me
  ) then
    raise exception 'Only property owner can connect tenant by unique ID';
  end if;

  select *
  into target_profile
  from public.profiles
  where app_user_id = normalized_user_id
  limit 1;

  if target_profile.id is null then
    raise exception 'No user found with this unique ID.';
  end if;

  if exists (
    select 1
    from public.property_tenants pt
    where pt.property_id = p_property_id
      and pt.tenant_profile_id = target_profile.id
      and coalesce(pt.status, 'active') = 'active'
  ) then
    raise exception 'This user is already connected as tenant for this property.';
  end if;

  insert into public.property_tenants (
    property_id,
    tenant_profile_id,
    tenant_name,
    tenant_email,
    tenant_phone,
    date_joined,
    status
  )
  values (
    p_property_id,
    target_profile.id,
    coalesce(nullif(trim(target_profile.name), ''), 'Tenant'),
    target_profile.email,
    target_profile.phone,
    current_date,
    'active'
  )
  returning *
  into inserted_row;

  return inserted_row;
end;
$$;

grant execute on function public.connect_tenant_by_app_user_id(bigint, text) to authenticated;

-- Ensure RLS is enabled.
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_tenants enable row level security;
alter table public.bills enable row level security;
alter table public.bill_custom_fields enable row level security;
alter table public.property_documents enable row level security;
alter table public.connections enable row level security;
alter table public.messages enable row level security;

-- Remove wide-open policies from schema.sql (if they exist).
drop policy if exists "profiles_all_access" on public.profiles;
drop policy if exists "properties_all_access" on public.properties;
drop policy if exists "property_images_all_access" on public.property_images;
drop policy if exists "property_tenants_all_access" on public.property_tenants;
drop policy if exists "bills_all_access" on public.bills;
drop policy if exists "bill_custom_fields_all_access" on public.bill_custom_fields;
drop policy if exists "property_documents_all_access" on public.property_documents;
drop policy if exists "connections_all_access" on public.connections;
drop policy if exists "messages_all_access" on public.messages;

-- Drop previous versions of scoped policies before recreating.
drop policy if exists "profiles_select_self" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_delete_self" on public.profiles;

drop policy if exists "properties_select_member" on public.properties;
drop policy if exists "properties_insert_owner" on public.properties;
drop policy if exists "properties_update_owner" on public.properties;
drop policy if exists "properties_delete_owner" on public.properties;

drop policy if exists "property_images_select_member" on public.property_images;
drop policy if exists "property_images_insert_owner" on public.property_images;
drop policy if exists "property_images_update_owner" on public.property_images;
drop policy if exists "property_images_delete_owner" on public.property_images;

drop policy if exists "property_tenants_select_member" on public.property_tenants;
drop policy if exists "property_tenants_insert_member" on public.property_tenants;
drop policy if exists "property_tenants_update_member" on public.property_tenants;
drop policy if exists "property_tenants_delete_member" on public.property_tenants;

drop policy if exists "bills_select_member" on public.bills;
drop policy if exists "bills_insert_owner" on public.bills;
drop policy if exists "bills_update_owner" on public.bills;
drop policy if exists "bills_delete_owner" on public.bills;

drop policy if exists "bill_custom_fields_select_member" on public.bill_custom_fields;
drop policy if exists "bill_custom_fields_insert_owner" on public.bill_custom_fields;
drop policy if exists "bill_custom_fields_update_owner" on public.bill_custom_fields;
drop policy if exists "bill_custom_fields_delete_owner" on public.bill_custom_fields;

drop policy if exists "property_documents_select_member" on public.property_documents;
drop policy if exists "property_documents_insert_owner" on public.property_documents;
drop policy if exists "property_documents_update_owner" on public.property_documents;
drop policy if exists "property_documents_delete_owner" on public.property_documents;

drop policy if exists "connections_select_participant" on public.connections;
drop policy if exists "connections_insert_sender" on public.connections;
drop policy if exists "connections_update_participant" on public.connections;
drop policy if exists "connections_delete_participant" on public.connections;

drop policy if exists "messages_select_participant" on public.messages;
drop policy if exists "messages_insert_sender" on public.messages;
drop policy if exists "messages_update_sender" on public.messages;
drop policy if exists "messages_delete_sender" on public.messages;

-- Profiles: each authenticated user manages only their own profile.
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (
  id = public.current_profile_id()
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = auth_user_id
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (
  id = public.current_profile_id()
  or (
    auth_user_id is null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
)
with check (
  auth_user_id = auth.uid()
);

create policy "profiles_delete_self"
on public.profiles
for delete
to authenticated
using (id = public.current_profile_id());

-- Properties: owner full access, connected tenant read access.
create policy "properties_select_member"
on public.properties
for select
to authenticated
using (
  owner_profile_id = public.current_profile_id()
  or exists (
    select 1
    from public.property_tenants pt
    where pt.property_id = id
      and pt.tenant_profile_id = public.current_profile_id()
      and coalesce(pt.status, 'active') = 'active'
  )
);

create policy "properties_insert_owner"
on public.properties
for insert
to authenticated
with check (owner_profile_id = public.current_profile_id());

create policy "properties_update_owner"
on public.properties
for update
to authenticated
using (owner_profile_id = public.current_profile_id())
with check (owner_profile_id = public.current_profile_id());

create policy "properties_delete_owner"
on public.properties
for delete
to authenticated
using (owner_profile_id = public.current_profile_id());

-- Property images: tied to property ownership for writes.
create policy "property_images_select_member"
on public.property_images
for select
to authenticated
using (public.can_access_property(property_id));

create policy "property_images_insert_owner"
on public.property_images
for insert
to authenticated
with check (public.is_property_owner(property_id));

create policy "property_images_update_owner"
on public.property_images
for update
to authenticated
using (public.is_property_owner(property_id))
with check (public.is_property_owner(property_id));

create policy "property_images_delete_owner"
on public.property_images
for delete
to authenticated
using (public.is_property_owner(property_id));

-- Property tenants: owner or that tenant profile can read/manage their own row.
create policy "property_tenants_select_member"
on public.property_tenants
for select
to authenticated
using (
  public.is_property_owner(property_id)
  or tenant_profile_id = public.current_profile_id()
);

create policy "property_tenants_insert_member"
on public.property_tenants
for insert
to authenticated
with check (
  public.is_property_owner(property_id)
  or tenant_profile_id = public.current_profile_id()
);

create policy "property_tenants_update_member"
on public.property_tenants
for update
to authenticated
using (
  public.is_property_owner(property_id)
  or tenant_profile_id = public.current_profile_id()
)
with check (
  public.is_property_owner(property_id)
  or tenant_profile_id = public.current_profile_id()
);

create policy "property_tenants_delete_member"
on public.property_tenants
for delete
to authenticated
using (
  public.is_property_owner(property_id)
  or tenant_profile_id = public.current_profile_id()
);

-- Bills: owner writes, owner/tenant reads.
create policy "bills_select_member"
on public.bills
for select
to authenticated
using (public.can_access_property(property_id));

create policy "bills_insert_owner"
on public.bills
for insert
to authenticated
with check (public.is_property_owner(property_id));

create policy "bills_update_owner"
on public.bills
for update
to authenticated
using (public.is_property_owner(property_id))
with check (public.is_property_owner(property_id));

create policy "bills_delete_owner"
on public.bills
for delete
to authenticated
using (public.is_property_owner(property_id));

-- Bill custom fields inherit bill access.
create policy "bill_custom_fields_select_member"
on public.bill_custom_fields
for select
to authenticated
using (public.can_access_bill(bill_id));

create policy "bill_custom_fields_insert_owner"
on public.bill_custom_fields
for insert
to authenticated
with check (
  exists (
    select 1
    from public.bills b
    where b.id = bill_id
      and public.is_property_owner(b.property_id)
  )
);

create policy "bill_custom_fields_update_owner"
on public.bill_custom_fields
for update
to authenticated
using (
  exists (
    select 1
    from public.bills b
    where b.id = bill_id
      and public.is_property_owner(b.property_id)
  )
)
with check (
  exists (
    select 1
    from public.bills b
    where b.id = bill_id
      and public.is_property_owner(b.property_id)
  )
);

create policy "bill_custom_fields_delete_owner"
on public.bill_custom_fields
for delete
to authenticated
using (
  exists (
    select 1
    from public.bills b
    where b.id = bill_id
      and public.is_property_owner(b.property_id)
  )
);

-- Property documents: owner writes, owner/tenant reads.
create policy "property_documents_select_member"
on public.property_documents
for select
to authenticated
using (public.can_access_property(property_id));

create policy "property_documents_insert_owner"
on public.property_documents
for insert
to authenticated
with check (public.is_property_owner(property_id));

create policy "property_documents_update_owner"
on public.property_documents
for update
to authenticated
using (public.is_property_owner(property_id))
with check (public.is_property_owner(property_id));

create policy "property_documents_delete_owner"
on public.property_documents
for delete
to authenticated
using (public.is_property_owner(property_id));

-- Connections/messages: participant-scoped access.
create policy "connections_select_participant"
on public.connections
for select
to authenticated
using (
  from_profile_id = public.current_profile_id()
  or to_profile_id = public.current_profile_id()
);

create policy "connections_insert_sender"
on public.connections
for insert
to authenticated
with check (
  from_profile_id = public.current_profile_id()
  and to_profile_id <> from_profile_id
);

create policy "connections_update_participant"
on public.connections
for update
to authenticated
using (
  from_profile_id = public.current_profile_id()
  or to_profile_id = public.current_profile_id()
)
with check (
  from_profile_id = public.current_profile_id()
  or to_profile_id = public.current_profile_id()
);

create policy "connections_delete_participant"
on public.connections
for delete
to authenticated
using (
  from_profile_id = public.current_profile_id()
  or to_profile_id = public.current_profile_id()
);

create policy "messages_select_participant"
on public.messages
for select
to authenticated
using (public.can_access_connection(connection_id));

create policy "messages_insert_sender"
on public.messages
for insert
to authenticated
with check (
  sender_profile_id = public.current_profile_id()
  and public.can_access_connection(connection_id)
);

create policy "messages_update_sender"
on public.messages
for update
to authenticated
using (sender_profile_id = public.current_profile_id())
with check (sender_profile_id = public.current_profile_id());

create policy "messages_delete_sender"
on public.messages
for delete
to authenticated
using (sender_profile_id = public.current_profile_id());
