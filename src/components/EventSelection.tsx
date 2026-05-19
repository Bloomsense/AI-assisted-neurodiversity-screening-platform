import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Search,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';
import { resolveLoggedInDoctorId } from '../utils/supabase/doctorProfile';
import { PATIENT_SELECT_COLUMNS } from '../utils/supabase/patients';

type EventType = 'session' | 'assessment' | null;

type ChildRecord = {
  id: string;
  name: string;
  age: number | null;
  status: string;
  lastSession: string;
};

export default function EventSelection() {
  const navigate = useNavigate();
  const [selectedEventType, setSelectedEventType] = useState<EventType>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allChildren, setAllChildren] = useState<ChildRecord[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        setLoadingChildren(true);
        const { data, error } = await supabase
          .from('patients')
          .select(PATIENT_SELECT_COLUMNS)
          .order('name', { ascending: true });

        if (error) {
          console.error('Error loading patients:', error);
          toast.error(`Failed to load children: ${error.message}`);
          setAllChildren([]);
          return;
        }

        const mapped: ChildRecord[] = (data || []).map((row: Record<string, unknown>) => {
          const pid = row.patient_id;
          const last =
            typeof row.last_session_date === 'string' || row.last_session_date instanceof Date
              ? new Date(row.last_session_date as string).toLocaleDateString()
              : 'No session yet';
          return {
            id: String(pid),
            name: String(row.name ?? 'Unnamed'),
            age: typeof row.age === 'number' ? row.age : null,
            status: String(row.status ?? 'active'),
            lastSession: last,
          };
        });
        setAllChildren(mapped);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load children');
        setAllChildren([]);
      } finally {
        setLoadingChildren(false);
      }
    };
    loadChildren();
  }, []);

  const filteredChildren = allChildren.filter((child) =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleStartEvent = async () => {
    if (!selectedEventType || !selectedChild) return;

    const child = allChildren.find((c) => c.id === selectedChild);
    setStarting(true);

    try {
      const doctorEmployeeId = await resolveLoggedInDoctorId();
      if (!doctorEmployeeId) {
        toast.error(
          'Could not find your therapist profile (employee ID). Please sign in again or contact admin.',
        );
        return;
      }

      const eventTitle =
        selectedEventType === 'assessment' ? 'Assessment started' : 'Session started';

      const row = {
        patient_id: selectedChild,
        event_type: selectedEventType,
        event_title: eventTitle,
        event_date: new Date().toISOString(),
        created_by_doctor_id: doctorEmployeeId,
        related_assessment_id: null,
        related_session_id: null,
      };

      const { data: timelineRow, error } = await supabase
        .from('timeline_events')
        .insert([row])
        .select('event_id')
        .single();

      if (error) {
        console.error('timeline_events insert:', error);
        toast.warning(`Event started, but timeline log failed: ${error.message}`);
      }

      const timelineEventId = timelineRow?.event_id as string | undefined;
      const flowState = timelineEventId ? { timelineEventId } : undefined;

      if (selectedEventType === 'assessment') {
        navigate(`/therapist/questionnaire-selection/${selectedChild}`, { state: flowState });
      } else {
        navigate(`/therapist/session/${selectedChild}`, { state: flowState });
      }
      return;
    } catch (e) {
      console.error(e);
      toast.warning('Could not write timeline event');
    } finally {
      setStarting(false);
    }
  };

  const isFormValid = Boolean(selectedEventType && selectedChild);

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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl text-gray-900">Start New Event</h2>
          <p className="mt-2 text-gray-600">
            Select the type of event and the child you&apos;re working with.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 1: Select Event Type</CardTitle>
            <CardDescription>
              Choose whether you&apos;re starting a session or an assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedEventType('session')}
                className={`relative p-6 rounded-lg border-2 transition-all ${
                  selectedEventType === 'session'
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {selectedEventType === 'session' && (
                  <CheckCircle2 className="absolute top-4 right-4 h-6 w-6 text-teal-600" />
                )}
                <div className="flex flex-col items-center space-y-3">
                  <Calendar
                    className={`h-12 w-12 ${
                      selectedEventType === 'session' ? 'text-teal-600' : 'text-gray-400'
                    }`}
                  />
                  <div className="text-center">
                    <h3 className="font-medium">Start a Session</h3>
                    <p className="text-sm text-gray-500 mt-1">Begin a therapy session with a child</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEventType('assessment')}
                className={`relative p-6 rounded-lg border-2 transition-all ${
                  selectedEventType === 'assessment'
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {selectedEventType === 'assessment' && (
                  <CheckCircle2 className="absolute top-4 right-4 h-6 w-6 text-teal-600" />
                )}
                <div className="flex flex-col items-center space-y-3">
                  <FileText
                    className={`h-12 w-12 ${
                      selectedEventType === 'assessment' ? 'text-teal-600' : 'text-gray-400'
                    }`}
                  />
                  <div className="text-center">
                    <h3 className="font-medium">Start an Assessment</h3>
                    <p className="text-sm text-gray-500 mt-1">Begin a formal screening assessment</p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 2: Select Child</CardTitle>
            <CardDescription>Choose the child for this event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search child by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loadingChildren ? (
                <div className="py-10 text-center text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading children...
                </div>
              ) : filteredChildren.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No children found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredChildren.map((child) => (
                  <button
                    type="button"
                    key={child.id}
                    onClick={() => setSelectedChild(child.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      selectedChild === child.id
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {child.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium">{child.name}</p>
                        <p className="text-sm text-gray-500">
                          {child.age != null ? `Age ${child.age} • ` : ''}
                          Last session: {child.lastSession}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={child.status === 'Assessment Complete' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {child.status}
                      </Badge>
                      {selectedChild === child.id && (
                        <CheckCircle2 className="h-5 w-5 text-teal-600" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate('/therapist/dashboard')}>
            Cancel
          </Button>
          <Button
            onClick={handleStartEvent}
            disabled={!isFormValid || starting}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              'Start Event'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
