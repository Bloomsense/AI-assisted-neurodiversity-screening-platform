export type QuestionnaireRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  ui_icon: string | null;
  is_active: boolean;
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
  'id, code, name, description, ui_icon, is_active';

export const QUESTION_SELECT_COLUMNS =
  'question_id, question_text, max_score, question_order, critical_item, questionnaires_id';

/** M-CHAT uses Yes/No; other questionnaires use Likert-style options. */
export function isMchatQuestionnaire(code: string | null | undefined, name?: string | null): boolean {
  const c = String(code || '').toLowerCase();
  if (c === 'mchat' || c === 'm-chat') return true;
  const n = String(name || '').toLowerCase();
  return n.includes('m-chat') || n.includes('mchat');
}
