-- Enable BHK validation for flat, house, and bnb listings.
-- Run this once in Supabase SQL Editor on existing projects.

update public.properties
set bedrooms = least(greatest(coalesce(bedrooms, 1), 1), 8)
where lower(coalesce(property_type, '')) in ('flat', 'house', 'bnb')
  and (bedrooms is null or bedrooms < 1 or bedrooms > 8);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'properties_residential_bhk_range') then
    alter table public.properties
      add constraint properties_residential_bhk_range check (
        lower(coalesce(property_type, '')) not in ('flat', 'house', 'bnb')
        or bedrooms between 1 and 8
      ) not valid;
  end if;
end $$;

alter table public.properties validate constraint properties_residential_bhk_range;
