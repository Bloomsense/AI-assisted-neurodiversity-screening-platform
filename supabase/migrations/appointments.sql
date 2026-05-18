-- Appointments table for helpdesk scheduling and therapist dashboard stats.
-- Supports "Pending Sessions" by tracking future scheduled/pending appointments.

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users (id) on delete cascade,
  appointment_date timestamptz not null,
  patient_name text not null,
  patient_age integer not null check (patient_age between 1 and 18),
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'pending', 'completed', 'cancelled')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe upgrades when an older table already exists.
alter table public.appointments add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table public.appointments add column if not exists status text default 'scheduled';
alter table public.appointments add column if not exists created_at timestamptz not null default now();
alter table public.appointments add column if not exists updated_at timestamptz not null default now();

update public.appointments
set status = coalesce(status, 'scheduled')
where status is null;

create index if not exists appointments_doctor_id_idx on public.appointments (doctor_id);
create index if not exists appointments_status_idx on public.appointments (status);
create index if not exists appointments_appointment_date_idx on public.appointments (appointment_date);

alter table public.appointments enable row level security;

drop policy if exists "appointments_select_authenticated" on public.appointments;
drop policy if exists "appointments_insert_authenticated" on public.appointments;
drop policy if exists "appointments_update_authenticated" on public.appointments;

create policy "appointments_select_authenticated"
  on public.appointments
  for select
  to authenticated
  using (true);

create policy "appointments_insert_authenticated"
  on public.appointments
  for insert
  to authenticated
  with check (true);

create policy "appointments_update_authenticated"
  on public.appointments
  for update
  to authenticated
  using (true)
  with check (true);
