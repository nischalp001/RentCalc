-- Add notifications table for bill-related notifications
-- Run this in Supabase SQL Editor after running the main schema.sql

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('bill_created', 'payment_verified_by_owner', 'payment_verified_by_tenant')),
  title text not null,
  message text not null,
  related_bill_id bigint references public.bills(id) on delete cascade,
  related_property_id bigint references public.properties(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_profile_id on public.notifications(profile_id);
create index if not exists idx_notifications_read on public.notifications(read);
create index if not exists idx_notifications_created_at on public.notifications(created_at);

-- Enable RLS
alter table public.notifications enable row level security;

drop policy if exists "notifications_all_access" on public.notifications;
create policy "notifications_all_access"
on public.notifications
for all
to anon, authenticated
using (true)
with check (true);

-- Grant permissions
grant select, insert, update, delete on public.notifications to anon, authenticated;
grant usage, select on sequence notifications_id_seq to anon, authenticated;
