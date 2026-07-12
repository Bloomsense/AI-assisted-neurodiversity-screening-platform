import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Download, Home, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { saveAssessmentAndLinkTimeline } from '../utils/supabase/timelineEvents';

interface MChatQuestion {
  id: string;
  question: string;
  order?: number;
}

const LIKERT_MAX_PER_QUESTION = 3;

/** Never=0, Sometimes=1, Often=2, Always=3 */
function likertAnswerScore(answer: string | undefined): number {
  switch (String(answer || '').toLowerCase()) {
    case 'never':
      return 0;
    case 'sometimes':
      return 1;
    case 'often':
      return 2;
    case 'always':
      return 3;
    default:
      return 0;
  }
}

function riskLevelFromPercentage(percentage: number): 'Low Risk' | 'Medium Risk' | 'High Risk' {
  if (percentage <= 30) return 'Low Risk';
  if (percentage <= 60) return 'Medium Risk';
  return 'High Risk';
}

function scoreLikertAssessment(
  answers: Record<string, string>,
  questions: MChatQuestion[],
): {
  totalScore: number;
  maxScore: number;
  percentage: number;
  riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk';
  itemScores: Array<{ question: MChatQuestion; answer: string | undefined; score: number }>;
} {
  const itemScores = questions.map((question) => {
    const answer = answers[question.id];
    return {
      question,
      answer,
      score: likertAnswerScore(answer),
    };
  });
  const totalScore = itemScores.reduce((sum, item) => sum + item.score, 0);
  const maxScore = questions.length * LIKERT_MAX_PER_QUESTION;
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  return {
    totalScore,
    maxScore,
    percentage,
    riskLevel: riskLevelFromPercentage(percentage),
    itemScores,
  };
}

function scoreMchatAssessment(
  answers: Record<string, string>,
  questions: MChatQuestion[],
): {
  totalScore: number;
  riskLevel: 'Low Risk' | 'High Risk';
  failCount: number;
  passCount: number;
  isScreenPositive: boolean;
  itemResults: Array<{ question: MChatQuestion; answer: string | undefined; result: 'Pass' | 'Fail' }>;
} {
  const itemResults = questions.map((question) => {
    const answer = answers[question.id];
    const result: 'Pass' | 'Fail' = answer && answer.toLowerCase() === 'no' ? 'Fail' : 'Pass';
    return { question, answer, result };
  });
  const failCount = itemResults.filter((r) => r.result === 'Fail').length;
  const passCount = itemResults.filter((r) => r.result === 'Pass').length;
  const isScreenPositive = failCount >= 2;
  return {
    totalScore: failCount,
    riskLevel: isScreenPositive ? 'High Risk' : 'Low Risk',
    failCount,
    passCount,
    isScreenPositive,
    itemResults,
  };
}

interface ScreeningResultsProps {
  mchatAnswers?: Record<string, string>;
  mchatQuestions?: MChatQuestion[];
  behaviorNotes?: string;
  childId?: string;
  questionnaireId?: string;
  questionnaireCode?: string | null;
  questionnaireName?: string;
  questionnaireType?: 'mchat' | 'neurodiversity';
  timelineEventId?: string;
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
          questionnaireType = 'mchat',
        } = results;

        const isMchat = questionnaireType === 'mchat';
        const scored = isMchat
          ? scoreMchatAssessment(mchatAnswers, mchatQuestions)
          : scoreLikertAssessment(mchatAnswers, mchatQuestions);

        const { assessmentId: savedId, error } = await saveAssessmentAndLinkTimeline({
          patientId: childId,
          totalScore: scored.totalScore,
          riskLevel: scored.riskLevel,
          notes: behaviorNotes?.trim() || null,
          questionnaireId,
          questionnaireType,
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
    questionnaireType = 'mchat',
  } = results;
  const isMchat = questionnaireType === 'mchat';
  const assessmentTitle = questionnaireName
    ? `${questionnaireName} Screening Results`
    : isMchat
      ? 'M-CHAT-R/F Screening Results'
      : 'Neurodiversity Core Screening Results';
  const assessmentCriteriaLabel = questionnaireName
    ? `${questionnaireName} criteria`
    : isMchat
      ? 'M-CHAT-R/F criteria'
      : 'Neurodiversity Core criteria';
  const scoringDescription = isMchat
    ? 'M-CHAT-R/F Scoring: Each item is scored as Pass or Fail. Screen positive if 2 or more items fail.'
    : 'Scoring: Never = 0, Sometimes = 1, Often = 2, Always = 3. Risk is based on total score as a percentage of the maximum (≤30% Low, ≤60% Medium, >60% High).';

  const formatAnswerDisplay = (answer: string | undefined): string => {
    if (!answer) return 'Not answered';
    if (isMchat) return answer;
    return answer.charAt(0).toUpperCase() + answer.slice(1).toLowerCase();
  };

  const totalQuestions = mchatQuestions.length;
  const mchatScored = isMchat ? scoreMchatAssessment(mchatAnswers, mchatQuestions) : null;
  const likertScored = !isMchat ? scoreLikertAssessment(mchatAnswers, mchatQuestions) : null;

  const totalScore = isMchat ? mchatScored!.totalScore : likertScored!.totalScore;
  const riskLevel = isMchat ? mchatScored!.riskLevel : likertScored!.riskLevel;
  const failCount = mchatScored?.failCount ?? 0;
  const passCount = mchatScored?.passCount ?? 0;
  const isScreenPositive = mchatScored?.isScreenPositive ?? riskLevel === 'High Risk';
  const scorePercentage = likertScored?.percentage ?? 0;
  const maxScore = likertScored?.maxScore ?? 0;

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
    // Create a text report
    const reportTitle = isMchat
      ? 'M-CHAT-R/F Screening Results Report'
      : `${questionnaireName || 'Questionnaire'} Screening Results Report`;
    const summaryBlock = isMchat
      ? `Total Questions: ${totalQuestions}
Passed: ${passCount}
Failed: ${failCount}
Risk Level: ${riskLevel}
Screen Result: ${isScreenPositive ? 'SCREEN POSITIVE' : 'SCREEN NEGATIVE'}`
      : `Total Questions: ${totalQuestions}
Total Score: ${totalScore} / ${maxScore}
Score Percentage: ${scorePercentage.toFixed(1)}%
Risk Level: ${riskLevel}
(Never=0, Sometimes=1, Often=2, Always=3; ≤30% Low, ≤60% Medium, >60% High)`;

    const detailBlock = isMchat
      ? mchatScored!.itemResults
          .map(
            (r, idx) => `${idx + 1}. ${r.question.question}
   Answer: ${formatAnswerDisplay(r.answer)}
   Result: ${r.result}
`,
          )
          .join('\n')
      : likertScored!.itemScores
          .map(
            (r, idx) => `${idx + 1}. ${r.question.question}
   Answer: ${formatAnswerDisplay(r.answer)}
   Score: ${r.score}
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

========================================
${isMchat ? '© 2009 Diana Robins, Deborah Fein, & Marianne Barton\nM-CHAT-R/F™ - Modified Checklist for Autism in Toddlers, Revised, with Follow-Up' : 'Likert Screening Assessment'}
`;

    // Create blob and download
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isMchat
      ? `M-CHAT-R-F_Results_${new Date().toISOString().split('T')[0]}.txt`
      : `Screening_Results_${new Date().toISOString().split('T')[0]}.txt`;
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
        questionnaireName: questionnaireName || (isMchat ? 'M-CHAT-R/F' : 'Screening'),
        questionnaireType,
        riskLevel,
        totalScore,
        maxScore: isMchat ? totalQuestions : maxScore,
        totalQuestions,
        answers: mchatAnswers,
        questions: mchatQuestions.map((q) => ({ id: q.id, question: q.question })),
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
          <AlertTitle className={riskTextClass}>
            {isMchat
              ? isScreenPositive
                ? 'Screen Positive - High Risk'
                : 'Screen Negative - Low Risk'
              : riskLevel}
          </AlertTitle>
          <AlertDescription className={riskDescClass}>
            {isMchat
              ? isScreenPositive
                ? `The child has failed ${failCount} out of ${totalQuestions} items. According to ${assessmentCriteriaLabel}, this indicates a screen positive result. Strongly recommended: referral for early intervention and diagnostic testing.`
                : `The child has failed ${failCount} out of ${totalQuestions} items. According to ${assessmentCriteriaLabel}, this indicates a screen negative result. Continue routine developmental monitoring.`
              : `Total score ${totalScore} out of ${maxScore} (${scorePercentage.toFixed(1)}%). According to ${assessmentCriteriaLabel}: ≤30% Low Risk, ≤60% Medium Risk, >60% High Risk.`}
          </AlertDescription>
        </Alert>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Assessment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
                <p className="text-sm text-gray-600">Total Questions</p>
              </div>
              {isMchat ? (
                <>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{passCount}</p>
                    <p className="text-sm text-gray-600">Passed</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{failCount}</p>
                    <p className="text-sm text-gray-600">Failed</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <p className="text-2xl font-bold text-teal-600">
                      {totalScore}/{maxScore}
                    </p>
                    <p className="text-sm text-gray-600">Total Score</p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <p className="text-2xl font-bold text-indigo-600">{scorePercentage.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Score Percentage</p>
                  </div>
                </>
              )}
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
              {isMchat
                ? mchatScored!.itemResults.map((item, index) => (
                    <div
                      key={item.question.id}
                      className={`p-4 border rounded-lg ${
                        item.result === 'Fail' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">
                              {index + 1}. {item.question.question}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              Answer: <span className="font-medium">{formatAnswerDisplay(item.answer)}</span>
                            </span>
                            <Badge
                              variant={item.result === 'Fail' ? 'destructive' : 'default'}
                              className={item.result === 'Pass' ? 'bg-green-600' : ''}
                            >
                              {item.result === 'Fail' ? (
                                <XCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              )}
                              {item.result}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                : likertScored!.itemScores.map((item, index) => (
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
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              Answer: <span className="font-medium">{formatAnswerDisplay(item.answer)}</span>
                            </span>
                            <Badge variant="outline">Score: {item.score}</Badge>
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

        {/* Copyright Notice - only for M-CHAT */}
        {isMchat && (
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
