import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';

type ScreeningStage = 1 | 2;

const NEURODIVERSITY_ANSWER_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'often', label: 'Often' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'always', label: 'Always' },
] as const;

interface MChatQuestion {
  id: string;
  question: string;
  order?: number;
}

export default function ScreeningWorkflow() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [searchParams] = useSearchParams();
  const questionnaireType = searchParams.get('type') || 'mchat';
  const [currentStage, setCurrentStage] = useState<ScreeningStage>(1);
  const [mchatAnswers, setMchatAnswers] = useState<Record<string, string>>({});
  const [behaviorNotes, setBehaviorNotes] = useState('');
  const [mchatQuestions, setMchatQuestions] = useState<MChatQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Fetch questions from Supabase
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoadingQuestions(true);

        // Decide which table to use based on questionnaire type:
        // - 'mchat' uses existing M-CHAT questions table
        // - 'neurodiversity' uses your new neurodiversity_questions table
        const tableName =
          questionnaireType === 'neurodiversity'
            ? 'neurodiversity_questions'
            : 'questionaire';

        // Fetch all questions for the selected questionnaire
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('question_order', { ascending: true });

        if (error) {
          console.error(`Error querying table ${tableName}:`, error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw error;
        }

        let questions: MChatQuestion[] = [];

        if (data && data.length > 0) {
          questions = data.map((q: any) => ({
            id: q.id?.toString() || q.question_id?.toString() || String(q.question_order || 0),
            question: q.question || q.question_text || q.text || '',
            order: q.question_order || 0,
          }));
          console.log(
            `Successfully fetched ${questions.length} questions from table: ${tableName} for type: ${questionnaireType}`,
          );
        }

        if (questions.length === 0) {
          console.warn('No questions found in database. Using fallback questions.');
          toast.warning('Could not load questions from database. Using default questions.');
          // Fallback to default questions
          questions = [
            { id: '1', question: 'Does your child enjoy being swung, bounced on your knee, etc.?' },
            { id: '2', question: 'Does your child take an interest in other children?' },
            { id: '3', question: 'Does your child like climbing on things, such as up stairs?' },
            { id: '4', question: 'Does your child enjoy playing peek-a-boo/hide-and-seek?' },
            { id: '5', question: 'Does your child ever pretend, for example, to talk on the phone or take care of dolls?' },
            { id: '6', question: 'Does your child ever point with the index finger to ask for something?' },
            { id: '7', question: 'Does your child ever point with the index finger to indicate interest in something?' },
            { id: '8', question: 'Can your child play properly with small toys without just mouthing, fiddling, or dropping them?' },
          ];
        }

        setMchatQuestions(questions);
      } catch (error: any) {
        console.error('Error fetching questions:', error);
        toast.error(`Failed to load questions: ${error?.message || 'Unknown error'}`);
        // Use fallback questions on error
        setMchatQuestions([
          { id: '1', question: 'Does your child enjoy being swung, bounced on your knee, etc.?' },
          { id: '2', question: 'Does your child take an interest in other children?' },
          { id: '3', question: 'Does your child like climbing on things, such as up stairs?' },
          { id: '4', question: 'Does your child enjoy playing peek-a-boo/hide-and-seek?' },
          { id: '5', question: 'Does your child ever pretend, for example, to talk on the phone or take care of dolls?' },
          { id: '6', question: 'Does your child ever point with the index finger to ask for something?' },
          { id: '7', question: 'Does your child ever point with the index finger to indicate interest in something?' },
          { id: '8', question: 'Can your child play properly with small toys without just mouthing, fiddling, or dropping them?' },
        ]);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  const questionnaireLabel = questionnaireType === 'neurodiversity' ? 'Neurodiversity Core' : 'M-CHAT';

  const getStageTitle = (stage: ScreeningStage) => {
    switch (stage) {
      case 1: return `Initial Assessment (${questionnaireLabel})`;
      case 2: return 'Behavior-Based Assessment';
    }
  };

  const handleMchatAnswer = (questionId: string, answer: string) => {
    setMchatAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNextStage = () => {
    if (currentStage === 1) {
      const unanswered = mchatQuestions.find(q => !mchatAnswers[q.id]);
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
    
    // Navigate to results screen with all the data
    navigate('/therapist/screening-results', {
      state: {
        mchatAnswers,
        mchatQuestions,
        behaviorNotes,
        childId,
        questionnaireType,
      },
    });
  };

  const handleSaveDraft = () => {
    toast.success('Draft saved successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                <p className="text-sm text-gray-600">Ahmad Khan • Age 4</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stage <= currentStage ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
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

        {/* Stage 1: M-CHAT Assessment */}
        {currentStage === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{questionnaireLabel} Screening Checklist</CardTitle>
              <p className="text-sm text-gray-600">
                Please answer each question based on your observations of the child's typical behavior.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingQuestions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600 mr-3" />
                  <span className="text-gray-600">Loading questions from database...</span>
                </div>
              ) : mchatQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No questions available. Please add questions to the database.</p>
                </div>
              ) : (
                <>
                  {mchatQuestions.map((question, index) => (
                    <div key={question.id} className="space-y-3">
                      <Label className="text-base font-medium">
                        {index + 1}. {question.question}
                      </Label>
                      <RadioGroup
                        value={mchatAnswers[question.id] || ''}
                        onValueChange={(value) => handleMchatAnswer(question.id, value)}
                      >
                        {questionnaireType === 'neurodiversity' ? (
                          <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {NEURODIVERSITY_ANSWER_OPTIONS.map((opt) => (
                              <div key={opt.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} />
                                <Label htmlFor={`${question.id}-${opt.value}`}>{opt.label}</Label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                              <Label htmlFor={`${question.id}-yes`}>Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`${question.id}-no`} />
                              <Label htmlFor={`${question.id}-no`}>No</Label>
                            </div>
                          </>
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

        {/* Stage 2: Behavior Assessment */}
        {currentStage === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Behavior-Based Assessment</CardTitle>
              <p className="text-sm text-gray-600">
                Provide detailed observations of motor skills and communication cues.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Behavior Observations */}
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

              {/* Summary Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Assessment Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">{questionnaireLabel} Results</p>
                    <p className="font-medium">{Object.keys(mchatAnswers).length}/{mchatQuestions.length} questions answered</p>
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
                <Button onClick={handleFinishScreening}>
                  Finish Screening
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}