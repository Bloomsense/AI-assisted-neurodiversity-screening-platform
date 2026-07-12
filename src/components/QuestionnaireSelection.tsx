import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { EventFlowState } from '../utils/supabase/timelineEvents';
import {
  QUESTIONNAIRE_SELECT_COLUMNS,
  type QuestionnaireRow,
} from '../utils/supabase/questionnaires';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, FileText, BrainCircuit, ClipboardList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';

function questionnaireIcon(code: string | null, uiIcon: string | null) {
  const key = String(uiIcon || code || '').toLowerCase();
  if (key.includes('brain') || key.includes('neuro')) return BrainCircuit;
  if (key.includes('mchat') || key.includes('m-chat') || key.includes('file')) return FileText;
  return ClipboardList;
}

function cardAccentClass(code: string | null, index: number) {
  const c = String(code || '').toLowerCase();
  if (c.includes('neuro')) return 'border-indigo-100 hover:border-indigo-300';
  if (c.includes('mchat') || c.includes('m-chat')) return 'border-teal-100 hover:border-teal-300';
  return index % 2 === 0 ? 'border-teal-100 hover:border-teal-300' : 'border-indigo-100 hover:border-indigo-300';
}

function iconColorClass(code: string | null, index: number) {
  const c = String(code || '').toLowerCase();
  if (c.includes('neuro')) return 'text-indigo-600';
  if (c.includes('mchat') || c.includes('m-chat')) return 'text-teal-600';
  return index % 2 === 0 ? 'text-teal-600' : 'text-indigo-600';
}

export default function QuestionnaireSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { childId } = useParams();
  const flowState = (location.state as EventFlowState | null) ?? {};
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('questionnaires')
        .select(QUESTIONNAIRE_SELECT_COLUMNS)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('QuestionnaireSelection: fetch questionnaires', error);
        toast.error(error.message || 'Failed to load questionnaires');
        setQuestionnaires([]);
      } else {
        setQuestionnaires((data || []) as QuestionnaireRow[]);
      }
      setLoading(false);
    };

    fetchQuestionnaires();
  }, []);

  const handleSelect = (questionnaire: QuestionnaireRow) => {
    const basePath = childId ? `/therapist/screening/${childId}` : '/therapist/screening';
    navigate(`${basePath}?id=${questionnaire.id}`, {
      state: {
        ...flowState,
        questionnaireId: questionnaire.id,
        questionnaireCode: questionnaire.code,
        questionnaireName: questionnaire.name,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-600">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mr-3" />
            Loading questionnaires...
          </div>
        ) : questionnaires.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-600">
              No active questionnaires found. Ask an admin to add questionnaires in Admin Settings.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {questionnaires.map((questionnaire, index) => {
              const Icon = questionnaireIcon(questionnaire.code, questionnaire.ui_icon);
              const accent = cardAccentClass(questionnaire.code, index);
              const iconColor = iconColorClass(questionnaire.code, index);

              return (
                <Card
                  key={questionnaire.id}
                  className={`${accent} hover:shadow-md transition-all cursor-pointer`}
                  onClick={() => handleSelect(questionnaire)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-6 w-6 ${iconColor}`} />
                        <div>
                          <CardTitle className="text-base">{questionnaire.name}</CardTitle>
                          {questionnaire.description && (
                            <CardDescription>{'0-3 Options Questionaire'}</CardDescription>
                          )}
                        </div>
                      </div>
                      {questionnaire.code && (
                        <Badge variant="outline">{questionnaire.code}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {questionnaire.description ||
                        'Structured screening questionnaire for this child.'}
                    </p>
                    <Button className="w-full" onClick={() => handleSelect(questionnaire)}>
                      Start {questionnaire.name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
