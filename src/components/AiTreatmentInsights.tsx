import React from 'react';
import { Badge } from './ui/badge';
import { Lightbulb, ListChecks, Loader2 } from 'lucide-react';

export type AiInsightItem = {
  id: string;
  title: string;
  insight: string;
  activities: string[];
};

export type AiInsightContext = {
  riskLevel?: string;
  questionnaireName?: string;
  totalScore?: number;
  maxScore?: number;
  behaviorNotes?: string;
};

/** Placeholder helpers kept for local UI fallbacks / tests — live flow uses /api/ai/treatment-insights. */
export function buildMockInsights(props: AiInsightContext): AiInsightItem[] {
  const risk = props.riskLevel || 'Unknown';
  const notesHint = props.behaviorNotes?.trim()
    ? 'Therapist observations were included in this draft analysis.'
    : 'No behavior notes were provided; insights are based on questionnaire responses only.';

  return [
    {
      id: '1',
      title: 'Priority Focus Areas',
      insight: `Based on a ${risk.toLowerCase()} screening result${
        props.questionnaireName ? ` for ${props.questionnaireName}` : ''
      }, prioritize supports that address the highest-scoring concern domains first, then layer in complementary skills. ${notesHint}`,
      activities: [
        'Schedule a short follow-up to review top concern domains with the caregiver',
        'Choose 1–2 measurable goals for the next 4 weeks',
        'Align classroom/home strategies so expectations stay consistent',
      ],
    },
    {
      id: '2',
      title: 'Skill-Building Activities',
      insight:
        'Treatment activities work best when they target co-occurring skills rather than isolated deficits—for example pairing social engagement with communication practice, or motor tasks with frustration-tolerance supports.',
      activities: [
        'Use short structured play sessions that mix turn-taking and simple verbal requests',
        'Offer alternative participation methods when motor or writing demands raise frustration',
        'Introduce visual supports (schedules, choice boards) during transitions',
      ],
    },
    {
      id: '3',
      title: 'Caregiver & Environment Supports',
      insight:
        'Environmental and caregiver strategies often amplify therapy gains. Focus on predictable routines, clear cues, and reducing sensory/organizational load where challenges showed up in responses or notes.',
      activities: [
        'Create a simple daily visual routine for home and school',
        'Practice one calm-down / regulation strategy in low-stress moments first',
        'Share a brief strategy sheet with teachers/caregivers for consistency',
      ],
    },
  ];
}

export async function generateMockAiInsights(props: AiInsightContext): Promise<AiInsightItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return buildMockInsights(props);
}

type AiInsightsDisplayProps = {
  insights: AiInsightItem[] | null;
  generating?: boolean;
};

/** Renders generated insight cards (parent owns the Generate button). */
export default function AiInsightsDisplay({ insights, generating = false }: AiInsightsDisplayProps) {
  if (generating) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 text-gray-600">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        Analyzing responses and observations...
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-teal-200 text-teal-700">
          Draft suggestions
        </Badge>
        <span className="text-xs text-gray-500">
          Review and adapt before sharing with caregivers
        </span>
      </div>

      {insights.map((item, index) => (
        <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <h4 className="font-medium text-gray-900">
            {index + 1}. {item.title}
          </h4>

          <div className="flex gap-2 text-sm text-gray-700">
            <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
            <p>{item.insight}</p>
          </div>

          {item.activities.length > 0 && (
            <div className="pl-6">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" />
                Suggested activities
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-gray-700">
                {item.activities.map((activity) => (
                  <li key={activity}>{activity}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
