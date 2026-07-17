import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ArrowLeft, CheckCircle2, AlertTriangle, Download, Home, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { saveAssessmentAndLinkTimeline } from '../utils/supabase/timelineEvents';
import {
  normalizeScoringCriteria,
  scoreQuestionnaireAssessment,
  scoringDescriptionText,
  type QuestionnaireScoringConfig,
} from '../utils/questionnaireScoring';

interface ScreeningQuestion {
  id: string;
  question: string;
  order?: number;
  criticalItem?: boolean;
}

interface ScreeningResultsProps {
  mchatAnswers?: Record<string, string>;
  mchatQuestions?: ScreeningQuestion[];
  behaviorNotes?: string;
  childId?: string;
  questionnaireId?: string;
  questionnaireCode?: string | null;
  questionnaireName?: string;
  /** @deprecated use scoringConfig */
  questionnaireType?: 'mchat' | 'neurodiversity';
  scoringConfig?: QuestionnaireScoringConfig;
  timelineEventId?: string;
}

function resolveScoringConfig(results: ScreeningResultsProps): QuestionnaireScoringConfig {
  if (results.scoringConfig) return results.scoringConfig;
  return {
    scoringCriteria:
      results.questionnaireType === 'neurodiversity' ? 'likert' : normalizeScoringCriteria(null),
    highRiskScore: null,
    moderateRiskScore: null,
    lowRiskScore: null,
  };
}

export default function ScreeningResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState<ScreeningResultsProps | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  // Get data from location state or props
  useEffect(() => {
    if (location.state) {
      setResults(location.state as ScreeningResultsProps);
    }
  }, [location.state]);

  // Save assessment to database when results are loaded
  useEffect(() => {
    const saveAssessment = async () => {
      if (!results || !results.mchatAnswers || !results.mchatQuestions || !results.childId) {
        return;
      }

      // Check if assessment already saved (to avoid duplicates)
      if (assessmentId) {
        return;
      }

      setIsSaving(true);

      try {
        const {
          mchatAnswers,
          mchatQuestions,
          behaviorNotes,
          childId,
          questionnaireId,
        } = results;

        const scoringConfig = resolveScoringConfig(results);
        const scored = scoreQuestionnaireAssessment(mchatAnswers, mchatQuestions, scoringConfig);

        const { assessmentId: savedId, error } = await saveAssessmentAndLinkTimeline({
          patientId: childId,
          totalScore: scored.totalScore,
          riskLevel: scored.riskLevel,
          notes: behaviorNotes?.trim() || null,
          questionnaireId,
          timelineEventId: results.timelineEventId,
        });

        if (error) {
          console.error('Error saving assessment:', error);
          toast.error(`Failed to save assessment: ${error.message}`);
        } else if (savedId) {
          setAssessmentId(savedId);
        }
      } catch (error: any) {
        console.error('Error saving assessment:', error);
        // Don't show error to user as results are still displayed
      } finally {
        setIsSaving(false);
      }
    };

    saveAssessment();
  }, [results, assessmentId]);

  // If no data, redirect back
  if (!results || !results.mchatAnswers || !results.mchatQuestions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Results Data</AlertTitle>
              <AlertDescription>
                No screening results found. Please complete the screening first.
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/therapist/dashboard')} className="mt-4 w-full">
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    mchatAnswers,
    mchatQuestions,
    behaviorNotes,
    childId,
    questionnaireName,
    questionnaireType,
  } = results;

  const scoringConfig = resolveScoringConfig(results);
  const scored = scoreQuestionnaireAssessment(mchatAnswers, mchatQuestions, scoringConfig);
  const { totalScore, riskLevel, itemScores } = scored;

  const assessmentTitle = questionnaireName
    ? `${questionnaireName} Screening Results`
    : 'Screening Results';
  const assessmentCriteriaLabel = questionnaireName ? `${questionnaireName} criteria` : 'Configured criteria';
  const scoringDescription = scoringDescriptionText(scoringConfig);
  const totalQuestions = mchatQuestions.length;

  const formatAnswerDisplay = (answer: string | undefined): string => {
    if (!answer) return 'Not answered';
    return answer.charAt(0).toUpperCase() + answer.slice(1).toLowerCase();
  };

  const riskAlertClass =
    riskLevel === 'High Risk'
      ? 'border-red-500 bg-red-50'
      : riskLevel === 'Medium Risk'
        ? 'border-amber-500 bg-amber-50'
        : 'border-green-500 bg-green-50';
  const riskTextClass =
    riskLevel === 'High Risk'
      ? 'text-red-900'
      : riskLevel === 'Medium Risk'
        ? 'text-amber-900'
        : 'text-green-900';
  const riskDescClass =
    riskLevel === 'High Risk'
      ? 'text-red-800'
      : riskLevel === 'Medium Risk'
        ? 'text-amber-800'
        : 'text-green-800';
  const riskIconClass =
    riskLevel === 'High Risk'
      ? 'text-red-600'
      : riskLevel === 'Medium Risk'
        ? 'text-amber-600'
        : 'text-green-600';

  const handleDownloadReport = () => {
    const reportTitle = `${questionnaireName || 'Questionnaire'} Screening Results Report`;
    const summaryBlock = `Total Questions: ${totalQuestions}
Total Score: ${totalScore}
Risk Level: ${riskLevel}
Thresholds — High: ≥${scoringConfig.highRiskScore ?? '—'}, Moderate: ≥${scoringConfig.moderateRiskScore ?? '—'}, Low ref: ≤${scoringConfig.lowRiskScore ?? '—'}`;

    const detailBlock = itemScores
      .map(
        (r, idx) => `${idx + 1}. ${r.question.question}
   Answer: ${formatAnswerDisplay(r.answer)}
   Points: ${r.score}${r.question.criticalItem ? ' (critical item)' : ''}
`,
      )
      .join('\n');

    const report = `${reportTitle}
Generated: ${new Date().toLocaleString()}

========================================
SCREENING SUMMARY
========================================
${summaryBlock}

========================================
DETAILED RESULTS
========================================
${detailBlock}

========================================
BEHAVIOR OBSERVATIONS
========================================
${behaviorNotes || 'No behavior observations recorded.'}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Screening_Results_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully');
  };

  const handleFinishAssessment = () => {
    if (!childId) {
      navigate('/therapist/dashboard');
      return;
    }
    navigate(`/therapist/child/${childId}`);
  };

  const handleDraftTreatmentPlan = () => {
    if (!childId) {
      toast.error('Missing child profile');
      return;
    }
    navigate('/therapist/treatment-plan', {
      state: {
        assessmentId,
        childId,
        behaviorNotes,
        questionnaireName: questionnaireName || 'Screening',
        questionnaireType,
        riskLevel,
        totalScore,
        totalQuestions,
        answers: mchatAnswers,
        questions: mchatQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          criticalItem: q.criticalItem,
        })),
        scoringConfig,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate(childId ? `/therapist/child/${childId}` : '/therapist/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <img src={bloomSenseLogo} alt="BloomSense" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-2xl text-gray-900">{assessmentTitle}</h1>
                <p className="text-sm text-gray-600">
                  Assessment completed
                  {isSaving && (
                    <span className="ml-2 inline-flex items-center text-teal-600">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Saving...
                    </span>
                  )}
                  {assessmentId && !isSaving && (
                    <span className="ml-2 text-green-600">✓ Saved</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Risk Level Alert */}
        <Alert className={`mb-6 ${riskAlertClass}`}>
          {riskLevel === 'Low Risk' ? (
            <CheckCircle2 className={`h-5 w-5 ${riskIconClass}`} />
          ) : (
            <AlertTriangle className={`h-5 w-5 ${riskIconClass}`} />
          )}
          <AlertTitle className={riskTextClass}>{riskLevel}</AlertTitle>
          <AlertDescription className={riskDescClass}>
            Total score is {totalScore}. According to {assessmentCriteriaLabel}: High if ≥
            {scoringConfig.highRiskScore ?? '—'}, Moderate if ≥{scoringConfig.moderateRiskScore ?? '—'},
            otherwise Low (low reference ≤{scoringConfig.lowRiskScore ?? '—'}).
          </AlertDescription>
        </Alert>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Assessment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
                <p className="text-sm text-gray-600">Total Questions</p>
              </div>
              <div className="text-center p-4 bg-teal-50 rounded-lg">
                <p className="text-2xl font-bold text-teal-600">{totalScore}</p>
                <p className="text-sm text-gray-600">Total Score</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{riskLevel}</p>
                <p className="text-sm text-gray-600">Risk Level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detailed Results</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {scoringDescription}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {itemScores.map((item, index) => (
                <div
                  key={item.question.id}
                  className={`p-4 border rounded-lg ${
                    item.score >= 2
                      ? 'border-red-200 bg-red-50'
                      : item.score === 1
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {index + 1}. {item.question.question}
                        </span>
                        {item.question.criticalItem && (
                          <Badge variant="outline" className="text-xs">
                            Critical
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Answer: <span className="font-medium">{formatAnswerDisplay(item.answer)}</span>
                        </span>
                        <Badge variant="outline">Points: {item.score}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Behavior Observations */}
        {behaviorNotes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Behavior Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{behaviorNotes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-teal-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600" />
              Next: Treatment Plan
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Draft a treatment plan and optionally generate AI suggestions from this screening.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleDraftTreatmentPlan}
              disabled={!childId || isSaving || !assessmentId}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Draft a treatment plan & generate AI Insights
            </Button>
            {isSaving && (
              <p className="text-xs text-gray-500 mt-2">Saving assessment before treatment plan...</p>
            )}
            {!isSaving && !assessmentId && childId && (
              <p className="text-xs text-amber-600 mt-2">
                Assessment must save successfully before drafting a treatment plan.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/therapist/dashboard')}>
            <Home className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            {childId && (
              <Button
                onClick={handleFinishAssessment}
                disabled={isSaving}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finish Assessment
              </Button>
            )}
          </div>
        </div>

        {/* Copyright Notice - optional for Yes/No (M-CHAT-style) questionnaires */}
        {scoringConfig.scoringCriteria === 'yes_no' && (
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              M-CHAT-R/F™ - Modified Checklist for Autism in Toddlers, Revised, with Follow-Up
            </p>
            <p>© 2009 Diana Robins, Deborah Fein, & Marianne Barton</p>
            <p className="mt-1">
              For more information, visit{' '}
              <a href="https://www.mchatscreen.com" target="_blank" rel="noopener noreferrer" className="underline">
                www.mchatscreen.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
