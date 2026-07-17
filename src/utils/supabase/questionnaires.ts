import type { ScoringCriteria } from '../questionnaireScoring';
import { normalizeScoringCriteria } from '../questionnaireScoring';

export type QuestionnaireRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  ui_icon: string | null;
  is_active: boolean;
  scoring_criteria: ScoringCriteria | string | null;
  high_risk_score: number | null;
  moderate_risk_score: number | null;
  low_risk_score: number | null;
};

export type QuestionRow = {
  question_id: string;
  question_text: string;
  max_score: number | null;
  question_order: number | null;
  critical_item: boolean;
  questionnaires_id: string;
};

export const QUESTIONNAIRE_SELECT_COLUMNS =
  'id, code, name, description, ui_icon, is_active, scoring_criteria, high_risk_score, moderate_risk_score, low_risk_score';

export const QUESTION_SELECT_COLUMNS =
  'question_id, question_text, max_score, question_order, critical_item, questionnaires_id';

export function isYesNoScoring(
  scoringCriteria: string | null | undefined,
  code?: string | null,
  name?: string | null,
): boolean {
  if (scoringCriteria) {
    return normalizeScoringCriteria(scoringCriteria) === 'yes_no';
  }
  const c = String(code || '').toLowerCase();
  if (c === 'mchat' || c === 'm-chat') return true;
  const n = String(name || '').toLowerCase();
  return n.includes('m-chat') || n.includes('mchat');
}

export function scoringConfigFromRow(row: Partial<QuestionnaireRow>) {
  return {
    scoringCriteria: normalizeScoringCriteria(row.scoring_criteria),
    highRiskScore: row.high_risk_score ?? null,
    moderateRiskScore: row.moderate_risk_score ?? null,
    lowRiskScore: row.low_risk_score ?? null,
  };
}

/** @deprecated use isYesNoScoring with scoring_criteria from DB */
export function isMchatQuestionnaire(code: string | null | undefined, name?: string | null): boolean {
  return isYesNoScoring(null, code, name);
}
