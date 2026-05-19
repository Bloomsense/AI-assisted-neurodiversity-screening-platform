import type { User } from '@supabase/supabase-js';
import { supabase } from './client';

/**
 * Returns doctors.employee_id for the logged-in auth user.
 * Use for timeline_events.created_by_doctor_id and patients.assigned_doctor_id FKs.
 */
export async function resolveLoggedInDoctorId(): Promise<string | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: doctor, error } = await supabase
    .from('doctors')
    .select('employee_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('resolveLoggedInDoctorId:', error);
    return null;
  }

  const employeeId = doctor?.employee_id;
  if (employeeId == null || String(employeeId).trim() === '') return null;
  return String(employeeId).trim();
}

export type DoctorSignupFields = {
  email?: string;
  fullName?: string;
  employeeId?: string;
  contactNumber?: string;
  occupation?: string;
  hospitalBranch?: string;
};

/**
 * Upserts a row in doctors for this auth user.
 * Works alongside DB trigger migration for compatibility/fallback.
 */
export async function upsertDoctorRow(
  user: User,
  fields?: DoctorSignupFields
): Promise<{ error: Error | null }> {
  const meta = user.user_metadata || {};
  if (meta.role !== 'therapist') {
    return { error: null };
  }

  const baseEmail =
    fields?.email?.trim() ||
    user.email?.trim() ||
    (meta.hospitalEmail as string)?.trim() ||
    '';
  const baseName =
    fields?.fullName?.trim() ||
    (meta.fullName as string)?.trim() ||
    baseEmail ||
    'Therapist';
  const baseContact = fields?.contactNumber?.trim() || (meta.contactNumber as string) || null;
  const baseOccupation = fields?.occupation?.trim() || (meta.occupation as string) || null;
  const baseBranch =
    fields?.hospitalBranch?.trim() ||
    (meta.branch_name as string) ||
    (meta.hospitalBranch as string) ||
    (meta.hospital_branch as string) ||
    (meta.address as string) ||
    null;
  const baseEmployeeId = fields?.employeeId?.trim() || (meta.employeeId as string) || null;

  // Preferred/current schema from doctors table editor.
  const modernRow = {
    employee_id: baseEmployeeId,
    user_id: user.id,
    name: baseName,
    email: baseEmail,
    contact_number: baseContact,
    occupation: baseOccupation,
    branch_name: baseBranch,
    active_patients: 0,
    upcoming_sessions: 0,
    pending_assignments: 0,
    status: 'active',
  };

  // Try robust "update-or-insert by user_id" to avoid hard dependency on a unique constraint.
  const { data: existingByUserId, error: existingError } = await supabase
    .from('doctors')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingError) {
    const writeResult = existingByUserId
      ? await supabase.from('doctors').update(modernRow).eq('user_id', user.id)
      : await supabase.from('doctors').insert(modernRow);

    if (!writeResult.error) {
      return { error: null };
    }
  }

  // Fallback for older doctors schema kept in some environments.
  const legacyRow = {
    doctor_id: user.id,
    user_id: user.id,
    name: baseName,
    email: user.email ?? '',
    contact_number: baseContact,
    cnic: (meta.cnic as string) || null,
    occupation: baseOccupation,
    hospital_branch: baseBranch,
    status: 'active',
    last_login: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('doctors').upsert(legacyRow, {
    onConflict: 'doctor_id',
  });

  if (error) {
    console.error('doctors upsert:', error);
    return { error: new Error(error.message) };
  }
  return { error: null };
}