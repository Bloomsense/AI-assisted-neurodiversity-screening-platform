-- Keep public profile tables in sync with auth.users metadata.
-- This fixes therapist/helpdesk signups not reflecting in doctors/helpdesk_staff.

create table if not exists public.doctors (
  doctor_id uuid primary key references auth.users (id) on delete cascade,
  user_id uuid unique references auth.users (id) on delete cascade,
  name text,
  email text,
  contact_number text,
  cnic text,
  occupation text,
  hospital_branch text,
  status text not null default 'active',
  active_patients integer not null default 0,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.doctors add column if not exists doctor_id uuid;
alter table public.doctors add column if not exists user_id uuid;
alter table public.doctors add column if not exists name text;
alter table public.doctors add column if not exists email text;
alter table public.doctors add column if not exists contact_number text;
alter table public.doctors add column if not exists cnic text;
alter table public.doctors add column if not exists occupation text;
alter table public.doctors add column if not exists hospital_branch text;
alter table public.doctors add column if not exists status text default 'active';
alter table public.doctors add column if not exists active_patients integer not null default 0;
alter table public.doctors add column if not exists last_login timestamptz;
alter table public.doctors add column if not exists created_at timestamptz not null default now();
alter table public.doctors add column if not exists updated_at timestamptz not null default now();

-- keep identifiers aligned in legacy rows
update public.doctors set doctor_id = coalesce(doctor_id, user_id) where doctor_id is null;
update public.doctors set user_id = coalesce(user_id, doctor_id) where user_id is null;

create unique index if not exists doctors_user_id_key on public.doctors (user_id);
create unique index if not exists doctors_email_key on public.doctors (email);

alter table public.doctors enable row level security;

drop policy if exists "doctors_select_authenticated" on public.doctors;
drop policy if exists "doctors_insert_own" on public.doctors;
drop policy if exists "doctors_update_own" on public.doctors;

create policy "doctors_select_authenticated"
  on public.doctors for select
  to authenticated
  using (true);

create policy "doctors_insert_own"
  on public.doctors for insert
  to authenticated
  with check (auth.uid() = doctor_id or auth.uid() = user_id);

create policy "doctors_update_own"
  on public.doctors for update
  to authenticated
  using (auth.uid() = doctor_id or auth.uid() = user_id)
  with check (auth.uid() = doctor_id or auth.uid() = user_id);

create or replace function public.sync_public_profile_from_auth_user(p_user auth.users)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  role_text text;
  full_name text;
  branch text;
begin
  role_text := lower(coalesce(p_user.raw_user_meta_data ->> 'role', ''));
  full_name := coalesce(p_user.raw_user_meta_data ->> 'fullName', p_user.email);
  branch := coalesce(
    p_user.raw_user_meta_data ->> 'hospitalBranch',
    p_user.raw_user_meta_data ->> 'hospital_branch',
    p_user.raw_user_meta_data ->> 'address'
  );

  if role_text = 'therapist' then
    insert into public.doctors (
      doctor_id, user_id, name, email, contact_number, cnic, occupation, hospital_branch, status, last_login, updated_at
    )
    values (
      p_user.id,
      p_user.id,
      full_name,
      p_user.email,
      p_user.raw_user_meta_data ->> 'contactNumber',
      p_user.raw_user_meta_data ->> 'cnic',
      p_user.raw_user_meta_data ->> 'occupation',
      branch,
      'active',
      now(),
      now()
    )
    on conflict (doctor_id) do update
    set user_id = excluded.user_id,
        name = coalesce(excluded.name, public.doctors.name),
        email = coalesce(excluded.email, public.doctors.email),
        contact_number = coalesce(excluded.contact_number, public.doctors.contact_number),
        cnic = coalesce(excluded.cnic, public.doctors.cnic),
        occupation = coalesce(excluded.occupation, public.doctors.occupation),
        hospital_branch = coalesce(excluded.hospital_branch, public.doctors.hospital_branch),
        status = coalesce(public.doctors.status, 'active'),
        last_login = now(),
        updated_at = now();
  elsif role_text = 'helpdesk' then
    insert into public.helpdesk_staff (
      user_id, email, full_name, contact_number, cnic, hospital_branch, updated_at
    )
    values (
      p_user.id,
      coalesce(p_user.email, ''),
      coalesce(full_name, 'Help desk'),
      p_user.raw_user_meta_data ->> 'contactNumber',
      p_user.raw_user_meta_data ->> 'cnic',
      branch,
      now()
    )
    on conflict (user_id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.helpdesk_staff.full_name),
        contact_number = coalesce(excluded.contact_number, public.helpdesk_staff.contact_number),
        cnic = coalesce(excluded.cnic, public.helpdesk_staff.cnic),
        hospital_branch = coalesce(excluded.hospital_branch, public.helpdesk_staff.hospital_branch),
        updated_at = now();
  end if;
end;
$$;

create or replace function public.handle_auth_user_profile_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_public_profile_from_auth_user(new);
  return new;
end;
$$;

drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
after insert or update of raw_user_meta_data, email
on auth.users
for each row
execute function public.handle_auth_user_profile_sync();

-- Backfill existing auth users into profile tables.
do $$
declare
  r auth.users%rowtype;
begin
  for r in select * from auth.users loop
    perform public.sync_public_profile_from_auth_user(r);
  end loop;
end $$;
