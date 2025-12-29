import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { 
  ArrowLeft, 
  Save,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';

export default function SessionScreen() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Mock child data - in real app, fetch from Supabase
  const childName = 'Ahmad Khan'; // Would be fetched based on childId

  const handleFinishSession = async () => {
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
      // In real app, save to Supabase
      // const { data, error } = await supabase
      //   .from('sessions')
      //   .insert({
      //     child_id: childId,
      //     therapist_id: currentTherapistId,
      //     session_title: sessionTitle,
      //     session_notes: sessionNotes,
      //     session_date: new Date().toISOString()
      //   });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Session saved successfully!');
      
      // Navigate to child profile
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src={bloomSenseLogo} alt="BloomSense" className="h-8 w-8 mr-3" />
              <h1 className="text-2xl text-gray-900">BloomSense</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/therapist/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-3xl text-gray-900">Therapy Session</h2>
          <p className="mt-2 text-gray-600">
            Recording session for <span className="font-medium">{childName}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Session Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>
              Enter the title and notes for this therapy session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Session Title */}
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
              <p className="text-sm text-gray-500">
                Provide a brief title that describes this session
              </p>
            </div>

            {/* Session Notes */}
            <div className="space-y-2">
              <Label htmlFor="sessionNotes">Session Notes *</Label>
              <Textarea
                id="sessionNotes"
                placeholder="Enter detailed notes about the session, including observations, activities, child's responses, progress, and any recommendations..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full min-h-[300px]"
              />
              <p className="text-sm text-gray-500">
                Document observations, activities, and outcomes from this session
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
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
                <Save className="h-4 w-4 mr-2 animate-spin" />
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
