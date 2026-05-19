import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';
import { PATIENT_SELECT_COLUMNS } from '../utils/supabase/patients';
import { saveSessionAndLinkTimeline, type EventFlowState } from '../utils/supabase/timelineEvents';

export default function SessionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { childId } = useParams();
  const flowState = (location.state as EventFlowState | null) ?? {};
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [childName, setChildName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!childId) return;
    const loadChild = async () => {
      const { data, error } = await supabase
        .from('patients')
        .select(PATIENT_SELECT_COLUMNS)
        .eq('patient_id', childId)
        .maybeSingle();

      if (error) {
        console.error('Error loading patient:', error);
        return;
      }
      if (data?.name) setChildName(String(data.name));
    };
    loadChild();
  }, [childId]);

  const handleFinishSession = async () => {
    if (!childId) {
      toast.error('Missing patient id');
      return;
    }
    if (!sessionTitle.trim()) {
      toast.error('Please enter a session title');
      return;
    }
    if (!sessionNotes.trim()) {
      toast.error('Please enter session notes');
      return;
    }

    setIsSaving(true);

    try {
      const duration =
        durationMinutes.trim() === '' ? null : parseInt(durationMinutes, 10);
      if (durationMinutes.trim() !== '' && (duration == null || Number.isNaN(duration) || duration < 0)) {
        toast.error('Duration must be a valid number of minutes');
        setIsSaving(false);
        return;
      }

      const combinedNotes = `Title: ${sessionTitle.trim()}\n\n${sessionNotes.trim()}`;

      const { sessionId, error } = await saveSessionAndLinkTimeline({
        patientId: childId,
        sessionNotes: combinedNotes,
        durationMinutes: duration,
        timelineEventId: flowState.timelineEventId,
      });

      if (error) {
        toast.error(`Failed to save session: ${error.message}`);
        return;
      }

      toast.success('Session saved successfully!');
      navigate(`/therapist/child/${childId}`);
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src={bloomSenseLogo} alt="BloomSense" className="h-8 w-8 mr-3" />
              <h1 className="text-2xl text-gray-900">BloomSense</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/therapist/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl text-gray-900">Therapy Session</h2>
          <p className="mt-2 text-gray-600">
            Recording session for{' '}
            <span className="font-medium">{childName || 'selected child'}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>Enter the title and notes for this therapy session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sessionTitle">Session Title *</Label>
              <Input
                id="sessionTitle"
                type="text"
                placeholder="e.g., Social Skills Development, Behavioral Assessment..."
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                type="number"
                min={0}
                placeholder="Optional"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionNotes">Session Notes *</Label>
              <Textarea
                id="sessionNotes"
                placeholder="Enter detailed notes about the session..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full min-h-[300px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/therapist/child/${childId}`)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFinishSession}
            disabled={isSaving || !sessionTitle.trim() || !sessionNotes.trim()}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Finish Session
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
