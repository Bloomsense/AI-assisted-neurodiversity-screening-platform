import { getApiBaseUrl } from '../config';
import type { AiInsightItem } from '../components/AiTreatmentInsights';

export type TreatmentInsightsRequest = {
  questionnaireName?: string;
  questionnaireType?: string;
  riskLevel?: string;
  totalScore?: number;
  maxScore?: number;
  behaviorNotes?: string;
  answers?: Record<string, string>;
  questions?: Array<{ id: string; question: string }>;
};

export type TreatmentInsightsResponse = {
  provider: string;
  insights: AiInsightItem[];
};

export async function requestTreatmentInsights(
  payload: TreatmentInsightsRequest,
): Promise<TreatmentInsightsResponse> {
  const base = getApiBaseUrl();
  const url = `${base}/api/ai/treatment-insights`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const text = await response.text();
  const trimmed = text.trim();
  const looksJson =
    contentType.includes('application/json') ||
    contentType.includes('+json') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[');

  if (!looksJson) {
    if (trimmed.startsWith('<')) {
      throw new Error(
        `HTTP ${response.status}: received HTML instead of JSON. Start the API (\`npm run dev:api\` on port 3001) so /api is proxied.`,
      );
    }
    throw new Error(
      `HTTP ${response.status}: ${trimmed.slice(0, 200) || 'empty response from API'}`,
    );
  }

  const result = JSON.parse(text) as {
    success?: boolean;
    error?: string;
    data?: TreatmentInsightsResponse;
  };

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || `Failed to generate insights (HTTP ${response.status})`);
  }

  return result.data;
}
