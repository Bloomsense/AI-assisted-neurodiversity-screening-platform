import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Plus, Trash2 } from 'lucide-react';

export interface QuestionnaireQuestion {
  id: string;
  text: string;
  score: number;
  isCritical: boolean;
}

export interface Questionnaire {
  id: string;
  name: string;
  description?: string;
  questions: QuestionnaireQuestion[];
}

interface AssessmentToolsTabProps {
  questionnaires: Questionnaire[];
  selectedQuestionnaireId: string;
  newQuestionnaireName: string;
  newQuestionnaireDescription: string;
  newQuestionText: string;
  newQuestionScore: string;
  newQuestionCritical: boolean;
  isLoadingQuestionnaires: boolean;
  onSelectedQuestionnaireChange: (id: string) => void;
  onNewQuestionnaireNameChange: (value: string) => void;
  onNewQuestionnaireDescriptionChange: (value: string) => void;
  onNewQuestionTextChange: (value: string) => void;
  onNewQuestionScoreChange: (value: string) => void;
  onNewQuestionCriticalChange: (value: boolean) => void;
  onAddQuestionnaire: () => void;
  onDeleteQuestionnaire: (id: string) => void;
  onAddQuestion: () => void;
  onDeleteQuestion: (questionnaireId: string, questionId: string) => void;
}

export default function AssessmentToolsTab({
  questionnaires,
  selectedQuestionnaireId,
  newQuestionnaireName,
  newQuestionnaireDescription,
  newQuestionText,
  newQuestionScore,
  newQuestionCritical,
  isLoadingQuestionnaires,
  onSelectedQuestionnaireChange,
  onNewQuestionnaireNameChange,
  onNewQuestionnaireDescriptionChange,
  onNewQuestionTextChange,
  onNewQuestionScoreChange,
  onNewQuestionCriticalChange,
  onAddQuestionnaire,
  onDeleteQuestionnaire,
  onAddQuestion,
  onDeleteQuestion,
}: AssessmentToolsTabProps) {
  const selectedQuestionnaire = questionnaires.find((q) => q.id === selectedQuestionnaireId) || null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questionnaire Management</CardTitle>
        <CardDescription>Add questionnaire names, then manage questions with score and critical-item flags</CardDescription>
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="newQuestion">Question</Label>
              <Input
                id="newQuestion"
                placeholder="Enter question text"
                value={newQuestionText}
                onChange={(e) => onNewQuestionTextChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="questionScore">Score</Label>
              <Input
                id="questionScore"
                type="number"
                min="0"
                value={newQuestionScore}
                onChange={(e) => onNewQuestionScoreChange(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2 h-10">
              <Label htmlFor="criticalItem" className="text-sm">Critical Item</Label>
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
                        Score: {question.score} | Critical Item: {question.isCritical ? 'True' : 'False'}
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
