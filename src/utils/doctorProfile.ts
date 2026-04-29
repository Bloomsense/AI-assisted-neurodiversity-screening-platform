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

  const row = {
    doctor_id: user.id,
    user_id: user.id,
    name: (meta.fullName as string) || user.email || 'Therapist',
    email: user.email ?? '',
    contact_number: (meta.contactNumber as string) || null,
    cnic: (meta.cnic as string) || null,
    occupation: (meta.occupation as string) || null,
    hospital_branch:
      (meta.hospitalBranch as string) ||
      (meta.hospital_branch as string) ||
      (meta.address as string) ||
      null,
    status: 'active',
    last_login: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('doctors').upsert(row, {
    onConflict: 'doctor_id',
  });

  if (error) {
    console.error('doctors upsert:', error);
    return { error: new Error(error.message) };
  }
  return { error: null };
}
