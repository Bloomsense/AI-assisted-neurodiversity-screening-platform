import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase/client';

function dobToDateOnly(isoOrDate: string | undefined): string | null {
  if (!isoOrDate) return null;
  const d = isoOrDate.includes('T') ? isoOrDate.split('T')[0] : isoOrDate.slice(0, 10);
  return d || null;
}

/**
 * Upserts a row in helpdesk_staff for this auth user.
 * Requires table helpdesk_staff (see supabase/migrations/helpdesk_staff.sql).
 */
export async function upsertHelpdeskStaffRow(user: User): Promise<{ error: Error | null }> {
  const meta = user.user_metadata || {};
  if (meta.role !== 'helpdesk') {
    return { error: null };
  }

  const branch =
    (meta.hospitalBranch as string) ||
    (meta.hospital_branch as string) ||
    (meta.address as string) ||
    null;

  const row = {
    user_id: user.id,
    email: user.email ?? '',
    full_name: (meta.fullName as string) || user.email || 'Help desk',
    date_of_birth: dobToDateOnly(meta.dob as string | undefined),
    contact_number: (meta.contactNumber as string) || null,
    cnic: (meta.cnic as string) || null,
    hospital_branch: branch,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('helpdesk_staff').upsert(row, {
    onConflict: 'user_id',
  });

  if (error) {
    console.error('helpdesk_staff upsert:', error);
    return { error: new Error(error.message) };
  }
  return { error: null };
}
