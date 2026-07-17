export type ScoringCriteria = 'yes_no' | 'likert';

export type QuestionnaireScoringConfig = {
  scoringCriteria: ScoringCriteria;
  highRiskScore: number | null;
  moderateRiskScore: number | null;
  lowRiskScore: number | null;
};

export type ScoringQuestion = {
  id: string;
  question: string;
  order?: number;
  criticalItem?: boolean;
};

export const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

export const LIKERT_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
  { value: 'always', label: 'Always' },
] as const;

export function normalizeScoringCriteria(value: string | null | undefined): ScoringCriteria {
  const v = String(value || '').toLowerCase();
  if (v === 'likert' || v.includes('never') || v.includes('sometimes')) return 'likert';
  return 'yes_no';
}

export function scoringCriteriaLabel(criteria: ScoringCriteria): string {
  return criteria === 'yes_no' ? 'Yes/No' : 'Never/Sometimes/Often/Always';
}

/** Score a single answer using critical-item flip rules. */
export function scoreAnswerValue(
  answer: string | undefined,
  criteria: ScoringCriteria,
  criticalItem: boolean,
): number {
  const a = String(answer || '').toLowerCase();

  if (criteria === 'yes_no') {
    if (!criticalItem) {
      if (a === 'yes') return 0;
      if (a === 'no') return 1;
    } else {
      if (a === 'yes') return 1;
      if (a === 'no') return 0;
    }
    return 0;
  }

  if (!criticalItem) {
    if (a === 'never') return 0;
    if (a === 'sometimes') return 1;
    if (a === 'often') return 2;
    if (a === 'always') return 3;
  } else {
    if (a === 'never') return 3;
    if (a === 'sometimes') return 2;
    if (a === 'often') return 1;
    if (a === 'always') return 0;
  }
  return 0;
}

export function riskLevelFromTotalScore(
  totalScore: number,
  thresholds: Pick<QuestionnaireScoringConfig, 'highRiskScore' | 'moderateRiskScore' | 'lowRiskScore'>,
): 'Low Risk' | 'Medium Risk' | 'High Risk' {
  const high = thresholds.highRiskScore;
  const moderate = thresholds.moderateRiskScore;

  if (high != null && totalScore >= high) return 'High Risk';
  if (moderate != null && totalScore >= moderate) return 'Medium Risk';
  return 'Low Risk';
}

export function scoreQuestionnaireAssessment(
  answers: Record<string, string>,
  questions: ScoringQuestion[],
  config: QuestionnaireScoringConfig,
) {
  const itemScores = questions.map((question) => {
    const answer = answers[question.id];
    const score = scoreAnswerValue(answer, config.scoringCriteria, Boolean(question.criticalItem));
    return { question, answer, score };
  });

  const totalScore = itemScores.reduce((sum, item) => sum + item.score, 0);
  const riskLevel = riskLevelFromTotalScore(totalScore, config);

  return { totalScore, riskLevel, itemScores };
}

export function scoringDescriptionText(config: QuestionnaireScoringConfig): string {
  const criteria = scoringCriteriaLabel(config.scoringCriteria);
  const high = config.highRiskScore ?? '—';
  const moderate = config.moderateRiskScore ?? '—';
  const low = config.lowRiskScore ?? '—';

  if (config.scoringCriteria === 'yes_no') {
    return `${criteria}: non-critical Yes=0, No=1; critical Yes=1, No=0. Critical items flip scoring. Total score ≥ ${high} = High, ≥ ${moderate} = Medium, below = Low (low ref: ${low}).`;
  }
  return `${criteria}: non-critical Never=0, Sometimes=1, Often=2, Always=3; critical items flip (Never=3…Always=0). Total score ≥ ${high} = High, ≥ ${moderate} = Medium, below = Low (low ref: ${low}).`;
}
