import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Download, FileText, Home, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';

interface MChatQuestion {
  id: string;
  question: string;
  order?: number;
}

interface ScreeningResultsProps {
  mchatAnswers?: Record<string, string>;
  mchatQuestions?: MChatQuestion[];
  behaviorNotes?: string;
  childId?: string;
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
        const { mchatAnswers, mchatQuestions, behaviorNotes, childId } = results;

        // Calculate results
        const convertToPassFail = (answer: string): 'Pass' | 'Fail' => {
          return answer.toLowerCase() === 'no' ? 'Fail' : 'Pass';
        };

        const passFailResults = mchatQuestions.map((question) => {
          const answer = mchatAnswers[question.id];
          const result = answer ? convertToPassFail(answer) : 'Pass';
          return {
            question,
            answer,
            result,
          };
        });

        const failCount = passFailResults.filter((r) => r.result === 'Fail').length;
        const passCount = passFailResults.filter((r) => r.result === 'Pass').length;
        const totalQuestions = mchatQuestions.length;
        const isScreenPositive = failCount >= 2;
        const riskLevel = isScreenPositive ? 'High Risk' : 'Low Risk';

        // Prepare assessment data
        const assessmentData = {
          patient_id: childId,
          mchat_answers: mchatAnswers,
          mchat_questions: mchatQuestions,
          behavior_notes: behaviorNotes || null,
          total_questions: totalQuestions,
          pass_count: passCount,
          fail_count: failCount,
          risk_level: riskLevel,
          screen_positive: isScreenPositive,
        };

        // Insert into Supabase assessments table
        const { data, error } = await supabase
          .from('assessments')
          .insert([assessmentData])
          .select()
          .single();

        if (error) {
          console.error('Error saving assessment:', error);
          // Don't show error to user as results are still displayed
          // toast.error(`Failed to save assessment: ${error.message}`);
        } else if (data && data.id) {
          setAssessmentId(data.id);
          console.log('Assessment saved successfully:', data.id);
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

  const { mchatAnswers, mchatQuestions, behaviorNotes, childId } = results;

  // Convert Yes/No answers to Pass/Fail based on M-CHAT-R/F logic
  // For typical M-CHAT questions, "No" indicates risk (Fail), "Yes" indicates no risk (Pass)
  const convertToPassFail = (answer: string): 'Pass' | 'Fail' => {
    // "No" answer typically indicates a risk factor = Fail
    // "Yes" answer typically indicates no risk = Pass
    return answer.toLowerCase() === 'no' ? 'Fail' : 'Pass';
  };

  // Calculate results
  const passFailResults = mchatQuestions.map((question) => {
    const answer = mchatAnswers[question.id];
    const result = answer ? convertToPassFail(answer) : 'Pass'; // Default to Pass if no answer
    return {
      question,
      answer,
      result,
    };
  });

  const failCount = passFailResults.filter((r) => r.result === 'Fail').length;
  const passCount = passFailResults.filter((r) => r.result === 'Pass').length;
  const totalQuestions = mchatQuestions.length;

  // M-CHAT-R/F Logic: Screen positive if 2 or more items fail
  const isScreenPositive = failCount >= 2;
  const riskLevel = isScreenPositive ? 'High Risk' : 'Low Risk';

  const handleDownloadReport = () => {
    // Create a text report
    const report = `M-CHAT-R/F Screening Results Report
Generated: ${new Date().toLocaleString()}

========================================
SCREENING SUMMARY
========================================
Total Questions: ${totalQuestions}
Passed: ${passCount}
Failed: ${failCount}
Risk Level: ${riskLevel}
Screen Result: ${isScreenPositive ? 'SCREEN POSITIVE' : 'SCREEN NEGATIVE'}

========================================
DETAILED RESULTS
========================================
${passFailResults
  .map(
    (r, idx) => `${idx + 1}. ${r.question.question}
   Answer: ${r.answer || 'Not answered'}
   Result: ${r.result}
`
  )
  .join('\n')}

========================================
BEHAVIOR OBSERVATIONS
========================================
${behaviorNotes || 'No behavior observations recorded.'}

========================================
© 2009 Diana Robins, Deborah Fein, & Marianne Barton
M-CHAT-R/F™ - Modified Checklist for Autism in Toddlers, Revised, with Follow-Up
`;

    // Create blob and download
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `M-CHAT-R-F_Results_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully');
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
                <h1 className="text-2xl text-gray-900">M-CHAT-R/F Screening Results</h1>
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
        <Alert className={`mb-6 ${isScreenPositive ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
          {isScreenPositive ? (
            <AlertTriangle className={`h-5 w-5 ${isScreenPositive ? 'text-red-600' : 'text-green-600'}`} />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
          <AlertTitle className={isScreenPositive ? 'text-red-900' : 'text-green-900'}>
            {isScreenPositive ? 'Screen Positive - High Risk' : 'Screen Negative - Low Risk'}
          </AlertTitle>
          <AlertDescription className={isScreenPositive ? 'text-red-800' : 'text-green-800'}>
            {isScreenPositive
              ? `The child has failed ${failCount} out of ${totalQuestions} items. According to M-CHAT-R/F criteria, this indicates a screen positive result. Strongly recommended: referral for early intervention and diagnostic testing.`
              : `The child has failed ${failCount} out of ${totalQuestions} items. According to M-CHAT-R/F criteria, this indicates a screen negative result. Continue routine developmental monitoring.`}
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
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{passCount}</p>
                <p className="text-sm text-gray-600">Passed</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{failCount}</p>
                <p className="text-sm text-gray-600">Failed</p>
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
              M-CHAT-R/F Scoring: Each item is scored as Pass or Fail. Screen positive if 2 or more items fail.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {passFailResults.map((item, index) => (
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
                          Answer: <span className="font-medium">{item.answer || 'Not answered'}</span>
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

        {/* Footer Actions */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/therapist/dashboard')}>
            <Home className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
          <div className="flex gap-3">
            {childId && (
              <Button variant="outline" onClick={() => navigate(`/therapist/child/${childId}`)}>
                <FileText className="h-4 w-4 mr-2" />
                View Child Profile
              </Button>
            )}
            <Button onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Copyright Notice */}
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
      </div>
    </div>
  );
}
