const { randomUUID } = require('crypto');

function registerDataImportRoutes({ app, requireSupabase, sendJson, getSupabase }) {
  const normalizeKey = (key) => String(key || '').trim().toLowerCase().replace(/\s+/g, '_');

  const getRowValue = (row, key) => {
    const target = normalizeKey(key);
    const matched = Object.keys(row || {}).find((k) => normalizeKey(k) === target);
    return matched ? String(row[matched] ?? '').trim() : '';
  };

  const validateRequiredColumns = (rows, required) => {
    if (!Array.isArray(rows) || rows.length === 0) return 'CSV has no data rows.';
    const keys = Object.keys(rows[0] || {}).map(normalizeKey);
    for (const req of required) {
      if (!keys.includes(normalizeKey(req))) return `Missing required column: ${req}`;
    }
    return null;
  };

  app.post('/api/data-import', async (req, res) => {
    if (!requireSupabase(res)) return;
    const supabase = getSupabase();

    try {
      const importType = String(req.body?.importType || '').trim();
      const rows = req.body?.rows;
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJson(res, 400, { success: false, error: 'rows must be a non-empty array' });
      }

      const patientsRequired = ['patient_id', 'name', 'age', 'gender'];
      const assessmentsRequired = ['patient_id', 'total_score'];
      const sessionsRequired = ['patient_id', 'session_date', 'session_notes'];
      const fullRequired = ['patient_id', 'name', 'age', 'gender', 'total_score', 'session_date', 'session_notes'];

      const requiredByType = {
        patients: patientsRequired,
        patients_assessments: assessmentsRequired,
        patients_sessions: sessionsRequired,
        patients_full: fullRequired,
      };

      if (!requiredByType[importType]) {
        return sendJson(res, 400, { success: false, error: `Unsupported import type: ${importType}` });
      }

      const columnsError = validateRequiredColumns(rows, requiredByType[importType]);
      if (columnsError) {
        return sendJson(res, 400, { success: false, error: columnsError });
      }

      let importedPatients = 0;
      let importedAssessments = 0;
      let importedSessions = 0;
      const csvPatientToUuid = new Map();

      if (importType === 'patients' || importType === 'patients_full') {
        for (const row of rows) {
          const sourcePatientId = getRowValue(row, 'patient_id');
          if (!sourcePatientId) {
            return sendJson(res, 400, { success: false, error: 'patient_id is required in every row' });
          }

          if (importType === 'patients_full' && csvPatientToUuid.has(sourcePatientId)) {
            continue;
          }

          const parsedAge = Number.parseInt(getRowValue(row, 'age'), 10);
          const patientPayload = {
            patient_id: randomUUID(),
            name: getRowValue(row, 'name') || 'Unknown',
            age: Number.isFinite(parsedAge) ? parsedAge : 0,
            gender: getRowValue(row, 'gender') || null,
            caregiver_name: getRowValue(row, 'caregiver_name') || getRowValue(row, 'caregiver_contact') || 'N/A',
            caregiver_contact: getRowValue(row, 'caregiver_contact') || null,
            date_of_birth: getRowValue(row, 'date_of_birth') || null,
            remarks: getRowValue(row, 'remarks') || null,
            assigned_doctor_id: getRowValue(row, 'assigned_doctor_id') || null,
            status: getRowValue(row, 'status') || 'active',
            profile_created_date: getRowValue(row, 'profile_created_date') || null,
          };

          const { data: inserted, error: insertError } = await supabase
            .from('patients')
            .insert(patientPayload)
            .select('patient_id')
            .single();

          if (insertError || !inserted?.patient_id) {
            return sendJson(res, 500, {
              success: false,
              error: insertError?.message || `Failed to insert patient for row patient_id=${sourcePatientId}`,
            });
          }

          csvPatientToUuid.set(sourcePatientId, inserted.patient_id);
          importedPatients += 1;
        }
      }

      if (importType === 'patients_assessments' || importType === 'patients_full') {
        for (const row of rows) {
          const sourcePatientId = getRowValue(row, 'patient_id');
          const patientUuid =
            importType === 'patients_full'
              ? csvPatientToUuid.get(sourcePatientId)
              : sourcePatientId;

          if (!patientUuid) {
            return sendJson(res, 400, {
              success: false,
              error: `No patient mapping found for patient_id "${sourcePatientId}"`,
            });
          }

          const totalScore = Number.parseInt(getRowValue(row, 'total_score'), 10);
          if (!Number.isFinite(totalScore)) {
            return sendJson(res, 400, {
              success: false,
              error: `Invalid total_score for patient_id "${sourcePatientId}"`,
            });
          }

          const { error } = await supabase.from('assessments').insert({
            patient_id: patientUuid,
            total_score: totalScore,
            iq_score: getRowValue(row, 'iq_score') ? Number.parseInt(getRowValue(row, 'iq_score'), 10) : null,
            notes: getRowValue(row, 'notes') || null,
            risk_level: getRowValue(row, 'risk_level') || 'low',
            mchat_answers: {},
            mchat_questions: [],
            total_questions: 0,
            pass_count: 0,
            fail_count: 0,
            screen_positive: false,
            assessment_date: getRowValue(row, 'assessment_date') || getRowValue(row, 'date_of_birth') || null,
          });

          if (error) return sendJson(res, 500, { success: false, error: error.message });
          importedAssessments += 1;
        }
      }

      if (importType === 'patients_sessions' || importType === 'patients_full') {
        for (const row of rows) {
          const sourcePatientId = getRowValue(row, 'patient_id');
          const patientUuid =
            importType === 'patients_full'
              ? csvPatientToUuid.get(sourcePatientId)
              : sourcePatientId;
          if (!patientUuid) {
            return sendJson(res, 400, {
              success: false,
              error: `No patient mapping found for patient_id "${sourcePatientId}"`,
            });
          }

          const sessionDate = getRowValue(row, 'session_date');
          const sessionNotes = getRowValue(row, 'session_notes');
          if (!sessionDate || !sessionNotes) {
            return sendJson(res, 400, {
              success: false,
              error: `session_date and session_notes are required for patient_id "${sourcePatientId}"`,
            });
          }

          const durationValue = getRowValue(row, 'duration');
          const duration = durationValue ? Number.parseInt(durationValue, 10) : null;

          const { error } = await supabase.from('sessions').insert({
            patient_id: patientUuid,
            session_date: sessionDate,
            session_notes: sessionNotes,
            duration: Number.isFinite(duration) ? duration : null,
            session_status: getRowValue(row, 'session_status_type') || getRowValue(row, 'session_status') || null,
          });

          if (error) return sendJson(res, 500, { success: false, error: error.message });
          importedSessions += 1;
        }
      }

      return sendJson(res, 200, {
        success: true,
        data: {
          importedPatients,
          importedAssessments,
          importedSessions,
          skippedRows: 0,
        },
      });
    } catch (error) {
      return sendJson(res, 500, {
        success: false,
        error: error.message || 'Data import failed',
      });
    }
  });
}

module.exports = { registerDataImportRoutes };
