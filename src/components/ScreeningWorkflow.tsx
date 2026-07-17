import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { EventFlowState } from '../utils/supabase/timelineEvents';
import {
  isYesNoScoring,
  QUESTION_SELECT_COLUMNS,
  QUESTIONNAIRE_SELECT_COLUMNS,
  scoringConfigFromRow,
  type QuestionnaireRow,
} from '../utils/supabase/questionnaires';
import {
  LIKERT_OPTIONS,
  YES_NO_OPTIONS,
  type QuestionnaireScoringConfig,
} from '../utils/questionnaireScoring';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';

type ScreeningStage = 1 | 2;

interface ScreeningQuestion {
  id: string;
  question: string;
  order: number;
  maxScore: number | null;
  criticalItem: boolean;
}

type ScreeningFlowState = EventFlowState & {
  questionnaireId?: string;
  questionnaireCode?: string | null;
  questionnaireName?: string;
};

export default function ScreeningWorkflow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { childId } = useParams();
  const [searchParams] = useSearchParams();
  const flowState = (location.state as ScreeningFlowState | null) ?? {};
  const questionnaireId = searchParams.get('id') || flowState.questionnaireId || '';
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireRow | null>(null);
  const [currentStage, setCurrentStage] = useState<ScreeningStage>(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [behaviorNotes, setBehaviorNotes] = useState('');
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useEffect(() => {
    const fetchQuestionnaireAndQuestions = async () => {
      if (!questionnaireId) {
        toast.error('No questionnaire selected. Please choose one from the list.');
        setLoadingQuestions(false);
        return;
      }

      try {
        setLoadingQuestions(true);

        const { data: questionnaireData, error: questionnaireError } = await supabase
          .from('questionnaires')
          .select(QUESTIONNAIRE_SELECT_COLUMNS)
          .eq('id', questionnaireId)
          .eq('is_active', true)
          .maybeSingle();

        if (questionnaireError) {
          throw questionnaireError;
        }

        if (!questionnaireData) {
          toast.error('Questionnaire not found or inactive.');
          setQuestionnaire(null);
          setQuestions([]);
          return;
        }

        setQuestionnaire(questionnaireData as QuestionnaireRow);

        const { data, error } = await supabase
          .from('questionaire')
          .select(QUESTION_SELECT_COLUMNS)
          .eq('questionnaires_id', questionnaireId)
          .order('question_order', { ascending: true });

        if (error) {
          console.error('Error querying questionaire:', error);
          throw error;
        }

        const mappedQuestions: ScreeningQuestion[] = (data || []).map((q) => ({
          id: String(q.question_id),
          question: String(q.question_text || ''),
          order: typeof q.question_order === 'number' ? q.question_order : 0,
          maxScore: q.max_score ?? null,
          criticalItem: Boolean(q.critical_item),
        }));

        if (mappedQuestions.length === 0) {
          toast.warning('No questions found for this questionnaire.');
        } else {
          console.log(
            `Loaded ${mappedQuestions.length} questions for questionnaire ${questionnaireId}`,
          );
        }

        setQuestions(mappedQuestions);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching questions:', error);
        toast.error(`Failed to load questions: ${message}`);
        setQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestionnaireAndQuestions();
  }, [questionnaireId]);

  const questionnaireLabel = questionnaire?.name || flowState.questionnaireName || 'Screening';
  const scoringConfig: QuestionnaireScoringConfig = questionnaire
    ? scoringConfigFromRow(questionnaire)
    : {
        scoringCriteria: 'yes_no',
        highRiskScore: null,
        moderateRiskScore: null,
        lowRiskScore: null,
      };
  const useYesNoAnswers = isYesNoScoring(
    questionnaire?.scoring_criteria,
    questionnaire?.code ?? flowState.questionnaireCode,
    questionnaire?.name ?? flowState.questionnaireName,
  );

  const getStageTitle = (stage: ScreeningStage) => {
    switch (stage) {
      case 1:
        return `Initial Assessment (${questionnaireLabel})`;
      case 2:
        return 'Behavior-Based Assessment';
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNextStage = () => {
    if (currentStage === 1) {
      const unanswered = questions.find((q) => !answers[q.id]);
      if (unanswered) {
        toast.error('Please answer all questions before proceeding');
        return;
      }
      setCurrentStage(2);
      toast.success('Progress saved successfully');
    }
  };

  const handleFinishScreening = () => {
    if (!behaviorNotes.trim()) {
      toast.error('Please add behavior observations before completing');
      return;
    }

    navigate('/therapist/screening-results', {
      state: {
        mchatAnswers: answers,
        mchatQuestions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          order: q.order,
          criticalItem: q.criticalItem,
        })),
        behaviorNotes,
        childId,
        questionnaireId,
        questionnaireCode: questionnaire?.code ?? flowState.questionnaireCode ?? null,
        questionnaireName: questionnaire?.name ?? flowState.questionnaireName,
        scoringConfig,
        timelineEventId: flowState.timelineEventId,
      },
    });
  };

  if (!questionnaireId && !loadingQuestions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 space-y-4 text-center">
            <p className="text-gray-600">No questionnaire selected.</p>
            <Button onClick={() => navigate(childId ? `/therapist/questionnaire-selection/${childId}` : '/therapist/questionnaire-selection')}>
              Choose a questionnaire
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <img src={bloomSenseLogo} alt="BloomSense" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-2xl text-gray-900">Screening Workflow</h1>
                <p className="text-sm text-gray-600">{questionnaireLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Step {currentStage} of 2</span>
              <span className="text-sm text-gray-600">{Math.round((currentStage / 2) * 100)}% Complete</span>
            </div>
            <Progress value={(currentStage / 2) * 100} className="mb-4" />
            <div className="flex justify-between">
              {[1, 2].map((stage) => (
                <div key={stage} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      stage <= currentStage ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stage}
                  </div>
                  <span className={`ml-2 text-sm ${stage <= currentStage ? 'text-teal-600' : 'text-gray-600'}`}>
                    {getStageTitle(stage as ScreeningStage)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {currentStage === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{questionnaireLabel} Screening Checklist</CardTitle>
              <p className="text-sm text-gray-600">
                Please answer each question based on your observations of the child&apos;s typical behavior.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingQuestions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600 mr-3" />
                  <span className="text-gray-600">Loading questions from database...</span>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No questions available for this questionnaire.</p>
                </div>
              ) : (
                <>
                  {questions.map((question, index) => (
                    <div key={question.id} className="space-y-3">
                      <Label className="text-base font-medium">
                        {index + 1}. {question.question}
                        {question.criticalItem && (
                          <span className="ml-2 text-xs font-normal text-amber-700">(Critical item)</span>
                        )}
                      </Label>
                      <RadioGroup
                        value={answers[question.id] || ''}
                        onValueChange={(value) => handleAnswer(question.id, value)}
                      >
                        {useYesNoAnswers ? (
                          <>
                            {YES_NO_OPTIONS.map((opt) => (
                              <div key={opt.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} />
                                <Label htmlFor={`${question.id}-${opt.value}`}>{opt.label}</Label>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {LIKERT_OPTIONS.map((opt) => (
                              <div key={opt.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} />
                                <Label htmlFor={`${question.id}-${opt.value}`}>{opt.label}</Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </RadioGroup>
                    </div>
                  ))}

                  <div className="pt-6 flex justify-end">
                    <Button onClick={handleNextStage}>
                      Continue to Stage 2
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {currentStage === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Behavior-Based Assessment</CardTitle>
              <p className="text-sm text-gray-600">
                Provide detailed observations of motor skills and communication cues.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="behaviorNotes">Motor Skills & Communication Observations</Label>
                <Textarea
                  id="behaviorNotes"
                  placeholder="Document observations about:
• Motor coordination and movement patterns
• Eye contact and social engagement
• Verbal and non-verbal communication
• Response to social interactions
• Repetitive behaviors or movements
• Sensory sensitivities
• Play and interaction style"
                  className="min-h-[200px]"
                  value={behaviorNotes}
                  onChange={(e) => setBehaviorNotes(e.target.value)}
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Assessment Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">{questionnaireLabel} Results</p>
                    <p className="font-medium">
                      {Object.keys(answers).length}/{questions.length} questions answered
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Behavior Assessment</p>
                    <p className="font-medium">{behaviorNotes.trim() ? 'Complete' : 'In progress'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStage(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Stage 1
                </Button>
                <Button onClick={handleFinishScreening}>Finish Screening</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
