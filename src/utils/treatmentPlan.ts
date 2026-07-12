const TREATMENT_PLAN_MARKER = '--- Treatment Plan ---';

export function parseTreatmentPlanFromNotes(notes: string | null): {
  behaviorNotes: string | null;
  treatmentPlan: string | null;
} {
  if (!notes) return { behaviorNotes: null, treatmentPlan: null };
  const idx = notes.indexOf(TREATMENT_PLAN_MARKER);
  if (idx === -1) return { behaviorNotes: notes, treatmentPlan: null };
  const behaviorNotes = notes.slice(0, idx).trim() || null;
  const treatmentPlan = notes.slice(idx + TREATMENT_PLAN_MARKER.length).trim() || null;
  return { behaviorNotes, treatmentPlan };
}

export function composeNotesWithTreatmentPlan(
  behaviorNotes: string | null | undefined,
  treatmentPlan: string,
): string {
  const base = (behaviorNotes || '').trim();
  const plan = treatmentPlan.trim();
  if (!base) return `${TREATMENT_PLAN_MARKER}\n${plan}`;
  return `${base}\n\n${TREATMENT_PLAN_MARKER}\n${plan}`;
}
