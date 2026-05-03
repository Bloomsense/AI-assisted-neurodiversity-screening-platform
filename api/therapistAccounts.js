/**
 * Therapist Accounts API routes (doctors table)
 */
function registerTherapistAccountRoutes({ app, requireSupabase, sendJson, getSupabase }) {
  const TABLE = 'doctors';
  const SELECT_COLUMNS = [
    'employee_id',
    'user_id',
    'email',
    'name',
    'contact_number',
    'occupation',
    'branch_name',
    'active_patients',
    'upcoming_sessions',
    'pending_assignments',
    'status',
    'created_at',
  ].join(', ');

  const normalizeStatus = (value) => {
    const status = String(value || '').trim().toLowerCase();
    if (status === 'active' || status === 'inactive') return status;
    return null;
  };

  // List all therapist accounts
  app.get('/api/therapists', async (req, res) => {
    if (!requireSupabase(res)) return;
    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT_COLUMNS)
        .order('created_at', { ascending: false });

      if (error) return sendJson(res, 500, { success: false, error: error.message });
      return sendJson(res, 200, { success: true, data: data || [] });
    } catch (error) {
      return sendJson(res, 500, { success: false, error: error.message || 'Failed to fetch therapists' });
    }
  });

  // Create therapist account row
  app.post('/api/therapists', async (req, res) => {
    if (!requireSupabase(res)) return;
    const supabase = getSupabase();

    try {
      const {
        user_id,
        name,
        email,
        contact_number,
        occupation,
        branch_name,
        active_patients,
        upcoming_sessions,
        pending_assignments,
        status,
      } = req.body || {};

      if (!user_id || !name || !contact_number || !occupation || !branch_name) {
        return sendJson(res, 400, {
          success: false,
          error: 'Required fields: user_id, name, contact_number, occupation, branch_name',
        });
      }

      const normalizedStatus = normalizeStatus(status) || 'active';
      const payload = {
        user_id: String(user_id).trim(),
        name: String(name).trim(),
        email: String(email).trim(),
        contact_number: String(contact_number).trim(),
        occupation: String(occupation).trim(),
        branch_name: String(branch_name).trim(),
        active_patients: Number.isFinite(Number(active_patients)) ? Number(active_patients) : 0,
        upcoming_sessions: Number.isFinite(Number(upcoming_sessions)) ? Number(upcoming_sessions) : 0,
        pending_assignments: Number.isFinite(Number(pending_assignments)) ? Number(pending_assignments) : 0,
        status: normalizedStatus,
      };

      const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select(SELECT_COLUMNS)
        .single();

      if (error) return sendJson(res, 500, { success: false, error: error.message });
      return sendJson(res, 201, { success: true, data });
    } catch (error) {
      return sendJson(res, 500, { success: false, error: error.message || 'Failed to create therapist' });
    }
  });

  // Update therapist account details
  app.patch('/api/therapists/:employeeId', async (req, res) => {
    if (!requireSupabase(res)) return;
    const supabase = getSupabase();
    const { employeeId } = req.params;

    try {
      const {
        name,
        email,
        contact_number,
        occupation,
        branch_name,
        active_patients,
        upcoming_sessions,
        pending_assignments,
        status,
      } = req.body || {};

      const updates = {};
      if (name !== undefined) updates.name = String(name).trim();
      if (email !== undefined) updates.email = String(email).trim();
      if (contact_number !== undefined) updates.contact_number = String(contact_number).trim();
      if (occupation !== undefined) updates.occupation = String(occupation).trim();
      if (branch_name !== undefined) updates.branch_name = String(branch_name).trim();
      if (active_patients !== undefined && Number.isFinite(Number(active_patients))) updates.active_patients = Number(active_patients);
      if (upcoming_sessions !== undefined && Number.isFinite(Number(upcoming_sessions))) updates.upcoming_sessions = Number(upcoming_sessions);
      if (pending_assignments !== undefined && Number.isFinite(Number(pending_assignments))) updates.pending_assignments = Number(pending_assignments);
      if (status !== undefined) {
        const normalized = normalizeStatus(status);
        if (!normalized) return sendJson(res, 400, { success: false, error: 'status must be active or inactive' });
        updates.status = normalized;
      }

      if (Object.keys(updates).length === 0) {
        return sendJson(res, 400, { success: false, error: 'No valid fields provided for update' });
      }

      const { data, error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('employee_id', employeeId)
        .select(SELECT_COLUMNS)
        .single();

      if (error) return sendJson(res, 500, { success: false, error: error.message });
      return sendJson(res, 200, { success: true, data });
    } catch (error) {
      return sendJson(res, 500, { success: false, error: error.message || 'Failed to update therapist' });
    }
  });

  // Toggle/update therapist status only
  app.patch('/api/therapists/:employeeId/status', async (req, res) => {
    if (!requireSupabase(res)) return;
    const supabase = getSupabase();
    const { employeeId } = req.params;

    try {
      const normalizedStatus = normalizeStatus(req.body?.status);
      if (!normalizedStatus) return sendJson(res, 400, { success: false, error: 'status must be active or inactive' });

      const { data, error } = await supabase
        .from(TABLE)
        .update({ status: normalizedStatus })
        .eq('employee_id', employeeId)
        .select(SELECT_COLUMNS)
        .single();

      if (error) return sendJson(res, 500, { success: false, error: error.message });
      return sendJson(res, 200, { success: true, data });
    } catch (error) {
      return sendJson(res, 500, { success: false, error: error.message || 'Failed to update therapist status' });
    }
  });

  // Delete therapist account row
  app.delete('/api/therapists/:employeeId', async (req, res) => {
    if (!requireSupabase(res)) return;
    const supabase = getSupabase();
    const { employeeId } = req.params;

    try {
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('employee_id', employeeId);

      if (error) return sendJson(res, 500, { success: false, error: error.message });
      return sendJson(res, 200, { success: true });
    } catch (error) {
      return sendJson(res, 500, { success: false, error: error.message || 'Failed to delete therapist' });
    }
  });
}

module.exports = { registerTherapistAccountRoutes };
