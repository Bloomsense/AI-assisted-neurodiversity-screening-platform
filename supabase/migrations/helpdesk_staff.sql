-- Help desk staff profiles (linked to auth.users). Run in Supabase SQL Editor.
--
-- Therapist signup stores "Hospital branch" in auth user metadata as hospitalBranch (not a SQL column here).
-- If you use a public.doctors (or similar) table with an "address" column, rename it to hospital_branch there separately.

create table if not exists public.helpdesk_staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

-- Extended profile columns (safe if you already ran an older version of this migration)
alter table public.helpdesk_staff add column if not exists date_of_birth date;
alter table public.helpdesk_staff add column if not exists contact_number text;
alter table public.helpdesk_staff add column if not exists cnic text;
alter table public.helpdesk_staff add column if not exists hospital_branch text;

-- Migrate legacy "address" column → hospital_branch (safe if address never existed)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'helpdesk_staff' and column_name = 'address'
  ) then
    update public.helpdesk_staff
    set hospital_branch = coalesce(hospital_branch, address)
    where address is not null;
    alter table public.helpdesk_staff drop column address;
  end if;
end $$;
alter table public.helpdesk_staff add column if not exists updated_at timestamptz not null default now();

-- Legacy: copy phone into contact_number when upgrading
alter table public.helpdesk_staff add column if not exists phone text;
update public.helpdesk_staff
set contact_number = coalesce(contact_number, phone)
where contact_number is null and phone is not null;

create unique index if not exists helpdesk_staff_email_key on public.helpdesk_staff (email);

alter table public.helpdesk_staff enable row level security;

drop policy if exists "helpdesk_staff_select_own" on public.helpdesk_staff;
drop policy if exists "helpdesk_staff_insert_own" on public.helpdesk_staff;
drop policy if exists "helpdesk_staff_update_own" on public.helpdesk_staff;

create policy "helpdesk_staff_select_own"
  on public.helpdesk_staff for select
  using (auth.uid() = user_id);

create policy "helpdesk_staff_insert_own"
  on public.helpdesk_staff for insert
  with check (auth.uid() = user_id);

create policy "helpdesk_staff_update_own"
  on public.helpdesk_staff for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- After public.appointments exists:
-- alter table public.appointments add column if not exists created_by uuid references auth.users (id);
