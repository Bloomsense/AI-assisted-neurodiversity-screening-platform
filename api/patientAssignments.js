/**
 * Patient doctor assignment routes.
 * Validates that entered doctor exists before updating patient assignment.
 */
function registerPatientAssignmentRoutes({ app, requireSupabase, sendJson, getSupabase }) {
  app.patch('/api/patient-assignments/:patientId', async (req, res) => {
    if (!requireSupabase(res)) return;
    const supabase = getSupabase();
    const patientId = String(req.params.patientId || '').trim();
    const nextDoctorId = String(req.body?.doctorId || '').trim();
    const nextDoctorName = String(req.body?.doctorName || '').trim();

    if (!patientId) {
      return sendJson(res, 400, { success: false, error: 'patientId is required' });
    }
    if (!nextDoctorId || !nextDoctorName) {
      return sendJson(res, 400, { success: false, error: 'doctorId and doctorName are required' });
    }

    try {
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('employee_id, name')
        .eq('employee_id', nextDoctorId)
        .maybeSingle();

      if (doctorError) {
        return sendJson(res, 500, { success: false, error: doctorError.message });
      }
      if (!doctor) {
        return sendJson(res, 400, { success: false, error: 'Doctor ID does not exist.' });
      }

      const dbDoctorName = String(doctor.name || '').trim().toLowerCase();
      if (dbDoctorName !== nextDoctorName.toLowerCase()) {
        return sendJson(res, 400, {
          success: false,
          error: `Doctor name does not match ID ${nextDoctorId}. Expected "${doctor.name}".`,
        });
      }

      const { data: updated, error: updateError } = await supabase
        .from('patients')
        .update({ assigned_doctor_id: nextDoctorId })
        .eq('patient_id', patientId)
        .select('patient_id, assigned_doctor_id')
        .single();

      if (updateError) {
        return sendJson(res, 500, { success: false, error: updateError.message });
      }

      return sendJson(res, 200, { success: true, data: updated });
    } catch (error) {
      return sendJson(res, 500, {
        success: false,
        error: error.message || 'Failed to update patient assignment',
      });
    }
  });
}

module.exports = { registerPatientAssignmentRoutes };
