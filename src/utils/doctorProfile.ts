import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase/client';

/**
 * Upserts a row in doctors for this auth user.
 * Works alongside DB trigger migration for compatibility/fallback.
 */
export async function upsertDoctorRow(user: User): Promise<{ error: Error | null }> {
  const meta = user.user_metadata || {};
  if (meta.role !== 'therapist') {
    return { error: null };
  }

  const baseName = (meta.fullName as string) || user.email || 'Therapist';
  const baseContact = (meta.contactNumber as string) || null;
  const baseOccupation = (meta.occupation as string) || null;
  const baseBranch =
    (meta.branch_name as string) ||
    (meta.hospitalBranch as string) ||
    (meta.hospital_branch as string) ||
    (meta.address as string) ||
    null;
  const baseEmployeeId = (meta.employeeId as string) || null;

  // Preferred/current schema from doctors table editor.
  const modernRow = {
    employee_id: baseEmployeeId,
    user_id: user.id,
    name: baseName,
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
