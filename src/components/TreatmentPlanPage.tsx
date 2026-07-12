import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ArrowLeft, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';
import {
  composeNotesWithTreatmentPlan,
} from '../utils/treatmentPlan';
import AiInsightsDisplay, { type AiInsightItem } from './AiTreatmentInsights';
import { requestTreatmentInsights } from '../utils/aiInsightsApi';

export type TreatmentPlanLocationState = {
  assessmentId?: string | null;
  childId?: string;
  behaviorNotes?: string;
  questionnaireName?: string;
  questionnaireType?: 'mchat' | 'neurodiversity';
  riskLevel?: string;
  totalScore?: number;
  maxScore?: number;
  totalQuestions?: number;
  answers?: Record<string, string>;
  questions?: Array<{ id: string; question: string }>;
};

export default function TreatmentPlanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as TreatmentPlanLocationState | null) ?? {};

  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [insights, setInsights] = useState<AiInsightItem[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const childId = state.childId;
  const assessmentId = state.assessmentId;

  const handleGenerateInsights = async () => {
    setGenerating(true);
    try {
      const result = await requestTreatmentInsights({
        riskLevel: state.riskLevel,
        questionnaireName: state.questionnaireName,
        questionnaireType: state.questionnaireType,
        totalScore: state.totalScore,
        maxScore: state.maxScore ?? state.totalQuestions,
        behaviorNotes: state.behaviorNotes,
        answers: state.answers,
        questions: state.questions,
      });
      setInsights(result.insights);
      toast.success(
        `AI insights generated${result.provider ? ` (${result.provider})` : ''}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate insights';
      console.error('AI insights error:', error);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleFinishTreatmentPlan = async () => {
    if (!treatmentPlan.trim()) {
      toast.error('Please add a treatment plan before finishing');
      return;
    }
    if (!childId) {
      toast.error('Missing child profile');
      return;
    }

    setSaving(true);
    try {
      if (assessmentId) {
        const planText = treatmentPlan.trim();

        // Prefer dedicated column when present in the live schema.
        const withColumn = await supabase
          .from('assessments')
          .update({ treatment_plan: planText })
          .eq('assessment_id', assessmentId)
          .select('assessment_id')
          .maybeSingle();

        if (withColumn.error) {
          const msg = (withColumn.error.message || '').toLowerCase();
          const missingColumn =
            msg.includes('treatment_plan') ||
            msg.includes('column') ||
            withColumn.error.code === 'PGRST204';

          if (missingColumn) {
            // Fallback: store under notes with a marker (keeps behavior notes intact).
            const composed = composeNotesWithTreatmentPlan(state.behaviorNotes, planText);
            const fallback = await supabase
              .from('assessments')
              .update({ notes: composed })
              .eq('assessment_id', assessmentId);

            if (fallback.error) {
              throw fallback.error;
            }
          } else {
            throw withColumn.error;
          }
        }
      } else {
        toast.warning('Assessment was not saved yet; treatment plan will only show if you reopen results.');
      }

      toast.success('Treatment plan saved');
      navigate(`/therapist/child/${childId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving treatment plan:', error);
      toast.error(`Failed to save treatment plan: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!childId && !state.riskLevel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 space-y-4 text-center">
            <p className="text-gray-600">
              No screening results found. Complete a screening first, then draft a treatment plan.
            </p>
            <Button onClick={() => navigate('/therapist/dashboard')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <img src={bloomSenseLogo} alt="BloomSense" className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-2xl text-gray-900">Treatment Plan</h1>
              <p className="text-sm text-gray-600">
                {state.questionnaireName || 'Screening'} · {state.riskLevel || 'Risk pending'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Treatment Plan</CardTitle>
            <CardDescription>
              Write your treatment plan for this patient. You can use AI suggestions below as a
              starting point.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="treatmentPlan" className="sr-only">
              Treatment plan
            </Label>
            <Textarea
              id="treatmentPlan"
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              placeholder="Enter the treatment plan, goals, and recommended activities..."
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>

        <Card className="border-teal-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600" />
              AI Insights
            </CardTitle>
            <CardDescription>
              AI analyzes the responses and behaviour notes to aid in drafting a treatment plan by
              suggesting helpful activities. Add the suggested treatments to your treatment plan if
              they seem beneficial for the patient.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateInsights}
              disabled={generating}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {insights ? 'Regenerate AI Insights' : 'Generate AI Insights'}
                </>
              )}
            </Button>

            <AiInsightsDisplay insights={insights} generating={generating} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleFinishTreatmentPlan}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finish Treatment Plan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
