import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Plus, Trash2, Save } from 'lucide-react';
import type { ScoringCriteria } from '../../utils/questionnaireScoring';
import { scoringCriteriaLabel } from '../../utils/questionnaireScoring';

export interface QuestionnaireQuestion {
  id: string;
  text: string;
  isCritical: boolean;
}

export interface Questionnaire {
  id: string;
  name: string;
  description?: string;
  scoringCriteria: ScoringCriteria;
  highRiskScore: number | null;
  moderateRiskScore: number | null;
  lowRiskScore: number | null;
  questions: QuestionnaireQuestion[];
}

export type QuestionnaireScoringDraft = {
  scoringCriteria: ScoringCriteria;
  highRiskScore: string;
  moderateRiskScore: string;
  lowRiskScore: string;
};

interface AssessmentToolsTabProps {
  questionnaires: Questionnaire[];
  selectedQuestionnaireId: string;
  newQuestionnaireName: string;
  newQuestionnaireDescription: string;
  newQuestionText: string;
  newQuestionCritical: boolean;
  isLoadingQuestionnaires: boolean;
  isSavingScoring: boolean;
  onSelectedQuestionnaireChange: (id: string) => void;
  onNewQuestionnaireNameChange: (value: string) => void;
  onNewQuestionnaireDescriptionChange: (value: string) => void;
  onNewQuestionTextChange: (value: string) => void;
  onNewQuestionCriticalChange: (value: boolean) => void;
  onAddQuestionnaire: () => void;
  onDeleteQuestionnaire: (id: string) => void;
  onAddQuestion: () => void;
  onDeleteQuestion: (questionnaireId: string, questionId: string) => void;
  onSaveScoringSettings: (questionnaireId: string, draft: QuestionnaireScoringDraft) => void;
}

export default function AssessmentToolsTab({
  questionnaires,
  selectedQuestionnaireId,
  newQuestionnaireName,
  newQuestionnaireDescription,
  newQuestionText,
  newQuestionCritical,
  isLoadingQuestionnaires,
  isSavingScoring,
  onSelectedQuestionnaireChange,
  onNewQuestionnaireNameChange,
  onNewQuestionnaireDescriptionChange,
  onNewQuestionTextChange,
  onNewQuestionCriticalChange,
  onAddQuestionnaire,
  onDeleteQuestionnaire,
  onAddQuestion,
  onDeleteQuestion,
  onSaveScoringSettings,
}: AssessmentToolsTabProps) {
  const selectedQuestionnaire = questionnaires.find((q) => q.id === selectedQuestionnaireId) || null;

  const [scoringCriteria, setScoringCriteria] = useState<ScoringCriteria>('yes_no');
  const [highRiskScore, setHighRiskScore] = useState('');
  const [moderateRiskScore, setModerateRiskScore] = useState('');
  const [lowRiskScore, setLowRiskScore] = useState('');

  useEffect(() => {
    if (!selectedQuestionnaire) return;
    setScoringCriteria(selectedQuestionnaire.scoringCriteria);
    setHighRiskScore(
      selectedQuestionnaire.highRiskScore != null ? String(selectedQuestionnaire.highRiskScore) : '',
    );
    setModerateRiskScore(
      selectedQuestionnaire.moderateRiskScore != null
        ? String(selectedQuestionnaire.moderateRiskScore)
        : '',
    );
    setLowRiskScore(
      selectedQuestionnaire.lowRiskScore != null ? String(selectedQuestionnaire.lowRiskScore) : '',
    );
  }, [selectedQuestionnaire]);

  const handleSaveScoring = () => {
    if (!selectedQuestionnaire) return;
    onSaveScoringSettings(selectedQuestionnaire.id, {
      scoringCriteria,
      highRiskScore,
      moderateRiskScore,
      lowRiskScore,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questionnaire Management</CardTitle>
        <CardDescription>
          Configure scoring criteria and risk thresholds per questionnaire. Questions use critical-item
          rules for answer scoring.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="New questionnaire name"
              value={newQuestionnaireName}
              onChange={(e) => onNewQuestionnaireNameChange(e.target.value)}
            />
            <Input
              placeholder="Questionnaire details/description"
              value={newQuestionnaireDescription}
              onChange={(e) => onNewQuestionnaireDescriptionChange(e.target.value)}
            />
            <Button variant="outline" onClick={onAddQuestionnaire}>
              <Plus className="h-4 w-4 mr-2" />
              Add Questionnaire
            </Button>
          </div>

          {questionnaires.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="questionnaireSelect">Select Questionnaire</Label>
              <div className="flex gap-2">
                <select
                  id="questionnaireSelect"
                  className="w-full border rounded-md px-3 py-2 bg-white"
                  value={selectedQuestionnaireId}
                  onChange={(e) => onSelectedQuestionnaireChange(e.target.value)}
                >
                  {questionnaires.map((questionnaire) => (
                    <option key={questionnaire.id} value={questionnaire.id}>
                      {questionnaire.name}
                    </option>
                  ))}
                </select>
                {selectedQuestionnaire && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => onDeleteQuestionnaire(selectedQuestionnaire.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}

          {selectedQuestionnaire && (
            <div className="rounded-lg border border-teal-100 bg-teal-50/30 p-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Scoring Criteria</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Applies to the whole test. Non-critical: Yes=0/No=1 or Never=0…Always=3. Critical items
                  flip these values.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scoringCriteria">Answer format</Label>
                <select
                  id="scoringCriteria"
                  className="w-full border rounded-md px-3 py-2 bg-white"
                  value={scoringCriteria}
                  onChange={(e) => setScoringCriteria(e.target.value as ScoringCriteria)}
                >
                  <option value="yes_no">Yes/No</option>
                  <option value="likert">Never/Sometimes/Often/Always</option>
                </select>
                <p className="text-xs text-gray-500">Selected: {scoringCriteriaLabel(scoringCriteria)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="highRiskScore">High risk score (≥)</Label>
                  <Input
                    id="highRiskScore"
                    type="number"
                    min="0"
                    placeholder="e.g. 8"
                    value={highRiskScore}
                    onChange={(e) => setHighRiskScore(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="moderateRiskScore">Moderate risk score (≥)</Label>
                  <Input
                    id="moderateRiskScore"
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={moderateRiskScore}
                    onChange={(e) => setModerateRiskScore(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lowRiskScore">Low risk score (reference max)</Label>
                  <Input
                    id="lowRiskScore"
                    type="number"
                    min="0"
                    placeholder="e.g. 2"
                    value={lowRiskScore}
                    onChange={(e) => setLowRiskScore(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="button"
                className="bg-teal-600 hover:bg-teal-700"
                disabled={isSavingScoring}
                onClick={handleSaveScoring}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingScoring ? 'Saving…' : 'Save Scoring Settings'}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="newQuestion">Question</Label>
              <Input
                id="newQuestion"
                placeholder="Enter question text"
                value={newQuestionText}
                onChange={(e) => onNewQuestionTextChange(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2 h-10">
              <Label htmlFor="criticalItem" className="text-sm">
                Critical Item
              </Label>
              <Switch
                id="criticalItem"
                checked={newQuestionCritical}
                onCheckedChange={onNewQuestionCriticalChange}
              />
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={onAddQuestion}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>

          {selectedQuestionnaire && (
            <div className="space-y-2">
              <h4 className="font-medium">{selectedQuestionnaire.name} Questions</h4>
              {selectedQuestionnaire.description && (
                <p className="text-sm text-gray-600">{selectedQuestionnaire.description}</p>
              )}
              {selectedQuestionnaire.questions.length === 0 ? (
                <p className="text-sm text-gray-500">No questions added yet.</p>
              ) : (
                selectedQuestionnaire.questions.map((question, index) => (
                  <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Question {index + 1}</p>
                      <p className="text-sm text-gray-700">{question.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Critical Item: {question.isCritical ? 'True (scores flipped)' : 'False'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteQuestion(selectedQuestionnaire.id, question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
          {!isLoadingQuestionnaires && questionnaires.length === 0 && (
            <p className="text-sm text-gray-500">No questionnaires found in Supabase. Add one to begin.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
