-- OPTIONAL: only if your `public.doctors` table still has a column named `address`.
-- Skip this file if you do not have that column or use a different schema.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'doctors' and column_name = 'address'
  ) then
    alter table public.doctors add column if not exists hospital_branch text;
    update public.doctors set hospital_branch = coalesce(hospital_branch, address) where address is not null;
    alter table public.doctors drop column address;
  end if;
end $$;
