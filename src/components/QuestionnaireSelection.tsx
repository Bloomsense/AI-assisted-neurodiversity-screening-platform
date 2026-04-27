import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, FileText, BrainCircuit } from 'lucide-react';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';

export default function QuestionnaireSelection() {
  const navigate = useNavigate();
  const { childId } = useParams();

  const handleSelect = (type: 'mchat' | 'neurodiversity') => {
    // Navigate to the screening workflow with the selected questionnaire type
    const basePath = childId ? `/therapist/screening/${childId}` : '/therapist/screening';
    navigate(`${basePath}?type=${type}`);
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
                <h1 className="text-2xl text-gray-900">Select Questionnaire</h1>
                <p className="text-sm text-gray-600">
                  Choose which assessment you want to run for this child.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* M-CHAT Option */}
          <Card className="border-teal-100 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleSelect('mchat')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-teal-600" />
                  <div>
                    <CardTitle className="text-base">M-CHAT Screening</CardTitle>
                    <CardDescription>
                      Existing toddler autism screening checklist (Yes/No).
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline">Version 1</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Standard M-CHAT questions focusing on early autism indicators in young children.
              </p>
              <Button className="w-full" onClick={() => handleSelect('mchat')}>
                Start M-CHAT
              </Button>
            </CardContent>
          </Card>

          {/* Neurodiversity Core Option */}
          <Card className="border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleSelect('neurodiversity')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BrainCircuit className="h-6 w-6 text-indigo-600" />
                  <div>
                    <CardTitle className="text-base">Neurodiversity Core</CardTitle>
                    <CardDescription>
                      Broader neurodiversity questionnaire with 0–3 Likert responses.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="border-indigo-200 text-indigo-700">
                  New
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Focuses on communication, sensory profiles, attention, and social engagement across the
                neurodiversity spectrum.
              </p>
              <Button className="w-full" variant="outline" onClick={() => handleSelect('neurodiversity')}>
                Start Neurodiversity Screening
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

