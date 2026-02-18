## Supabase Setup

This project now uses direct browser-to-Supabase access.  
Run the schema script before using `/properties`, `/transactions`, or `/dashboard`.

### 1. Apply schema

1. Open your Supabase project dashboard.
2. Go to `SQL Editor`.
3. If your project already had tables before this migration, run `supabase/repair_legacy_names.sql` first.
4. Then run `supabase/schema.sql`.
5. Then run `supabase/connect_user_ownership.sql` to:
   - connect profiles to authenticated users
   - backfill tenant profile links
   - enforce user-based row-level security
   - add helper function `claim_unowned_properties()` for one-time ownership claim

### 2. Confirm required env vars

In `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=property-assets
```

Use your real anon key, not the placeholder.

### 3. Quick verification queries

Run in Supabase SQL Editor:

```sql
select to_regclass('public.properties') as properties_table;
select to_regclass('public.bills') as bills_table;
select id, name, public from storage.buckets where id = 'property-assets';
select id, property_code from public.properties limit 5;
select public.current_profile_id() as my_profile_id;
```

If relations are missing, run:

```sql
select conname, conrelid::regclass as table_name, confrelid::regclass as ref_table
from pg_constraint
where conname in (
  'property_images_property_id_fkey',
  'bills_property_id_fkey',
  'bill_custom_fields_bill_id_fkey'
);
```

### 4. Optional ownership claim (one-time)

If you migrated old properties that had no owner attached, sign in and run:

```sql
select public.claim_unowned_properties();
```
