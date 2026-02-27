-- Keeps only fields collected in the "Add Property" form
-- for the properties table.

-- Preserve location data before dropping legacy columns.
update public.properties
set location = coalesce(nullif(location, ''), nullif(address, ''), nullif(city, ''))
where coalesce(nullif(location, ''), nullif(address, ''), nullif(city, '')) is not null;

-- Remove constraints tied to legacy, non-form columns.
alter table if exists public.properties drop constraint if exists properties_rooms_non_negative;
alter table if exists public.properties drop constraint if exists properties_bathrooms_non_negative;
alter table if exists public.properties drop constraint if exists properties_kitchens_non_negative;
alter table if exists public.properties drop constraint if exists properties_dinings_non_negative;
alter table if exists public.properties drop constraint if exists properties_livings_non_negative;
alter table if exists public.properties drop constraint if exists properties_car_parking_spaces_non_negative;
alter table if exists public.properties drop constraint if exists properties_furnished_level_check;

-- Drop fields that are not part of the Add Property form.
alter table if exists public.properties
  drop column if exists name,
  drop column if exists rent,
  drop column if exists address,
  drop column if exists city,
  drop column if exists rooms,
  drop column if exists bathrooms,
  drop column if exists kitchens,
  drop column if exists dinings,
  drop column if exists livings,
  drop column if exists bike_parking,
  drop column if exists car_parking,
  drop column if exists car_parking_spaces,
  drop column if exists water_supply,
  drop column if exists wifi,
  drop column if exists furnished_level,
  drop column if exists services,
  drop column if exists status,
  drop column if exists due_date,
  drop column if exists lease_end;

