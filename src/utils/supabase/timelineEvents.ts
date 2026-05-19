import { supabase } from './client';
import { resolveLoggedInDoctorId } from './doctorProfile';

export type EventFlowState = {
  timelineEventId?: string;
};

/** Resolve questionnaires.id from workflow type (matches questionnaires.code when set). */
export async function resolveQuestionnaireTypeId(
  type: 'mchat' | 'neurodiversity',
): Promise<string | null> {
  const { data: byCode, error: codeError } = await supabase
    .from('questionnaires')
    .select('id')
    .eq('code', type)
    .eq('is_active', true)
    .maybeSingle();

  if (!codeError && byCode?.id) return byCode.id;

  const { data: rows, error } = await supabase
    .from('questionnaires')
    .select('id, name')
    .eq('is_active', true);

  if (error) {
    console.error('resolveQuestionnaireTypeId:', error);
    return null;
  }

  const match = (rows || []).find((q) => {
    const n = String(q.name || '').toLowerCase();
    if (type === 'mchat') return n.includes('m-chat') || n.includes('mchat');
    return n.includes('neurodiversity');
  });

  return match?.id ?? null;
}

export async function linkTimelineToAssessment(
  timelineEventId: string,
  assessmentId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('timeline_events')
    .update({
      related_assessment_id: assessmentId,
      event_title: 'Assessment completed',
    })
    .eq('event_id', timelineEventId);

  if (error) {
    console.error('linkTimelineToAssessment:', error);
    return { error: new Error(error.message) };
  }
  return { error: null };
}

export async function linkTimelineToSession(
  timelineEventId: string,
  sessionId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('timeline_events')
    .update({
      related_session_id: sessionId,
      event_title: 'Session completed',
    })
    .eq('event_id', timelineEventId);

  if (error) {
    console.error('linkTimelineToSession:', error);
    return { error: new Error(error.message) };
  }
  return { error: null };
}

export type SaveAssessmentInput = {
  patientId: string;
  totalScore: number;
  riskLevel: string;
  notes: string | null;
  questionnaireType: 'mchat' | 'neurodiversity';
  timelineEventId?: string;
};

export async function saveAssessmentAndLinkTimeline(
  input: SaveAssessmentInput,
): Promise<{ assessmentId: string | null; error: Error | null }> {
  const doctorId = await resolveLoggedInDoctorId();
  if (!doctorId) {
    return { assessmentId: null, error: new Error('Therapist profile (employee ID) not found') };
  }

  const questionnaireTypeId = await resolveQuestionnaireTypeId(input.questionnaireType);
  if (!questionnaireTypeId) {
    return {
      assessmentId: null,
      error: new Error(
        `No questionnaire registered for "${input.questionnaireType}". Add it in Admin Settings.`,
      ),
    };
  }

  const payload: Record<string, unknown> = {
    patient_id: input.patientId,
    total_score: input.totalScore,
    notes: input.notes,
    risk_level: input.riskLevel,
    questionnaire_type: questionnaireTypeId,
    completed_by_doctor_id: doctorId,
    assessment_date: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('assessments')
    .insert([payload])
    .select('assessment_id')
    .single();

  if (error) {
    console.error('assessments insert:', error);
    return { assessmentId: null, error: new Error(error.message) };
  }

  const assessmentId = data?.assessment_id as string | undefined;
  if (!assessmentId) {
    return { assessmentId: null, error: new Error('Assessment saved but no id returned') };
  }

  if (input.timelineEventId) {
    const link = await linkTimelineToAssessment(input.timelineEventId, assessmentId);
    if (link.error) return { assessmentId, error: link.error };
  }

  return { assessmentId, error: null };
}

export type SaveSessionInput = {
  patientId: string;
  sessionNotes: string;
  durationMinutes?: number | null;
  timelineEventId?: string;
};

export async function saveSessionAndLinkTimeline(
  input: SaveSessionInput,
): Promise<{ sessionId: string | null; error: Error | null }> {
  const doctorId = await resolveLoggedInDoctorId();
  if (!doctorId) {
    return { sessionId: null, error: new Error('Therapist profile (employee ID) not found') };
  }

  const today = new Date().toISOString().slice(0, 10);
  const payload: Record<string, unknown> = {
    patient_id: input.patientId,
    session_date: today,
    session_notes: input.sessionNotes.trim(),
    session_status: 'completed',
    doctor_id: doctorId,
  };

  if (input.durationMinutes != null && Number.isFinite(input.durationMinutes)) {
    payload.duration = input.durationMinutes;
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert([payload])
    .select('session_id')
    .single();

  if (error) {
    console.error('sessions insert:', error);
    return { sessionId: null, error: new Error(error.message) };
  }

  const sessionId = data?.session_id as string | undefined;
  if (!sessionId) {
    return { sessionId: null, error: new Error('Session saved but no id returned') };
  }

  if (input.timelineEventId) {
    const link = await linkTimelineToSession(input.timelineEventId, sessionId);
    if (link.error) return { sessionId, error: link.error };
  }

  return { sessionId, error: null };
}
