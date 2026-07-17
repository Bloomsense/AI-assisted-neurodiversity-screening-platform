-- Link helpdesk intake to therapist profiles and appointments.
-- This enables therapist-side upcoming child notifications from helpdesk scheduling.

alter table public.patients
  add column if not exists assigned_doctor_id uuid references auth.users (id) on delete set null;

alter table public.appointments
  add column if not exists patient_id uuid references public.patients (id) on delete set null;

create index if not exists patients_assigned_doctor_id_idx
  on public.patients (assigned_doctor_id);

create index if not exists appointments_patient_id_idx
  on public.appointments (patient_id);

-- Backfill patient links for existing appointments by matching name + age.
update public.appointments a
set patient_id = p.id
from public.patients p
where a.patient_id is null
  and lower(trim(a.patient_name)) = lower(trim(p.name))
  and a.patient_age = p.age;
