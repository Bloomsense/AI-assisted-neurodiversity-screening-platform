import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone, 
  PlayCircle,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  Video,
  Send,
  Plus,
  Loader2,
  Edit2,
  X,
  Check,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../utils/supabase/client';
import { PATIENT_SELECT_COLUMNS } from '../utils/supabase/patients';
import { resolveLoggedInDoctorId } from '../utils/supabase/doctorProfile';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';

type PatientRow = {
  patient_id: string;
  name: string;
  age: number;
  date_of_birth: string | null;
  gender: string | null;
  caregiver_name: string;
  caregiver_contact: string | null;
  remarks: string | null;
  status: string | null;
  profile_created_date: string | null;
  profile_tag: string | null;
  risk_level: string | null;
  assigned_doctor_id: string | null;
};

function parseCaregiverContact(contact: string | null) {
  if (!contact) return { phone: '', email: '' };
  if (contact.includes(' | ')) {
    const [phone, email] = contact.split(' | ', 2);
    return { phone: phone.trim(), email: email.trim() };
  }
  if (contact.includes('@')) return { phone: '', email: contact.trim() };
  return { phone: contact.trim(), email: '' };
}

type AssessmentHistoryItem = {
  id: string;
  date: string;
  questionnaireLabel: string;
  totalScore: number | null;
  riskLevel: string | null;
  notes: string | null;
  doctorName: string | null;
};

type SessionHistoryItem = {
  id: string;
  date: string;
  title: string;
  notes: string;
  duration: number | null;
  status: string | null;
  doctorName: string | null;
};

function normalizeRiskKey(risk: string | null): string {
  if (!risk) return 'unknown';
  const r = risk.toLowerCase();
  if (r.includes('high')) return 'high';
  if (r.includes('low')) return 'low';
  if (r.includes('moderate') || r.includes('medium')) return 'moderate';
  return 'unknown';
}

function questionnaireLabelFromRow(
  questionnaireId: string | null,
  labels: Record<string, string>,
): string {
  if (!questionnaireId) return 'Assessment';
  return labels[questionnaireId] || 'Assessment';
}

function parseSessionNotes(raw: string): { title: string; body: string } {
  const match = raw.match(/^Title:\s*(.+?)\n\n([\s\S]*)$/);
  if (match) return { title: match[1].trim(), body: match[2].trim() };
  return { title: 'Therapy Session', body: raw.trim() };
}

async function fetchQuestionnaireLabels(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};

  const { data, error } = await supabase
    .from('questionnaires')
    .select('id, name, code')
    .in('id', unique);

  if (error) {
    console.error('fetchQuestionnaireLabels:', error);
    return {};
  }

  const map: Record<string, string> = {};
  for (const q of data || []) {
    const id = String(q.id);
    const code = String(q.code || '').toLowerCase();
    if (code === 'neurodiversity') map[id] = 'Neurodiversity Core';
    else if (code === 'mchat') map[id] = 'M-CHAT-R/F';
    else map[id] = String(q.name || 'Assessment');
  }
  return map;
}

type CommentItem = {
  id: number;
  therapist: string;
  doctorId: string;
  date: string;
  text: string;
};

async function fetchDoctorNames(employeeIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(employeeIds.filter(Boolean))];
  if (unique.length === 0) return {};

  const { data, error } = await supabase
    .from('doctors')
    .select('employee_id, name')
    .in('employee_id', unique);

  if (error) {
    console.error('fetchDoctorNames:', error);
    return {};
  }

  const map: Record<string, string> = {};
  for (const row of data || []) {
    const id = String(row.employee_id || '').trim();
    if (id) map[id] = String(row.name || id);
  }
  return map;
}

export default function ChildProfileDetail() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Doctor's Comments State
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [addingComment, setAddingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [loggedInDoctorId, setLoggedInDoctorId] = useState<string | null>(null);
  
  // Follow-Up Meetings State
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(undefined);
  const [meetingTime, setMeetingTime] = useState('');
  const [scheduledMeetings, setScheduledMeetings] = useState<any[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);

  // Custom Tag State
  const [customTag, setCustomTag] = useState('In Progress');
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [tempTag, setTempTag] = useState('');

  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  const [latestAssessment, setLatestAssessment] = useState<AssessmentHistoryItem | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryItem[]>([]);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Use local backend in development, cloud backend in production
  const API_BASE_URL = import.meta.env.DEV 
    ? 'http://localhost:8000/make-server-8d885905'
    : `https://${projectId}.supabase.co/functions/v1/make-server-8d885905`;

  // Load comments, meetings, assessment/session history, and patient profile
  useEffect(() => {
    if (!childId) return;
    loadPatient();
    loadComments();
    loadMeetings();
    loadAssessmentHistory();
    loadSessionHistory();
    resolveLoggedInDoctorId().then(setLoggedInDoctorId);
  }, [childId]);

  const loadPatient = async () => {
    if (!childId) return;

    try {
      setLoadingPatient(true);
      const { data, error } = await supabase
        .from('patients')
        .select(PATIENT_SELECT_COLUMNS)
        .eq('patient_id', childId)
        .maybeSingle();

      if (error) {
        console.error('Error loading patient:', error);
        toast.error('Failed to load child profile');
        setPatient(null);
        return;
      }

      if (!data) {
        setPatient(null);
        return;
      }

      setPatient(data as PatientRow);
      if (data.profile_tag) {
        setCustomTag(String(data.profile_tag));
      }
    } catch (error) {
      console.error('Error loading patient:', error);
      toast.error('Failed to load child profile');
      setPatient(null);
    } finally {
      setLoadingPatient(false);
    }
  };

  const loadComments = async () => {
    if (!childId) return;

    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('comments')
        .select('id, created_at, comment_text, doctor_id')
        .eq('patient_id', childId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading comments:', error);
        toast.error('Failed to load comments');
        setComments([]);
        return;
      }

      const rows = data || [];
      const doctorNames = await fetchDoctorNames(
        rows.map((row) => String(row.doctor_id || '')),
      );

      setComments(
        rows.map((row) => ({
          id: Number(row.id),
          therapist: doctorNames[String(row.doctor_id || '')] || 'Therapist',
          doctorId: String(row.doctor_id || ''),
          date: String(row.created_at),
          text: String(row.comment_text || ''),
        })),
      );
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadMeetings = async () => {
    try {
      setLoadingMeetings(true);
      const response = await fetch(`${API_BASE_URL}/meetings/${childId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setScheduledMeetings(data.meetings);
      }
    } catch (error) {
      console.error('Error loading meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoadingMeetings(false);
    }
  };

  const loadAssessmentHistory = async () => {
    if (!childId) return;
    try {
      setLoadingAssessments(true);
      const { data, error } = await supabase
        .from('assessments')
        .select(
          'assessment_id, total_score, assessment_date, notes, risk_level, questionnaire_type, completed_by_doctor_id, created_at',
        )
        .eq('patient_id', childId)
        .order('assessment_date', { ascending: false });

      if (error) {
        console.error('Error loading assessments:', error);
        toast.error('Failed to load assessment history');
        setAssessmentHistory([]);
        setLatestAssessment(null);
        return;
      }

      const rows = data || [];
      const labels = await fetchQuestionnaireLabels(
        rows.map((r) => r.questionnaire_type as string | null).filter(Boolean) as string[],
      );
      const doctorNames = await fetchDoctorNames(
        rows.map((r) => String(r.completed_by_doctor_id || '')),
      );

      const mapped: AssessmentHistoryItem[] = rows.map((row) => ({
        id: String(row.assessment_id),
        date: String(row.assessment_date || row.created_at),
        questionnaireLabel: questionnaireLabelFromRow(
          row.questionnaire_type as string | null,
          labels,
        ),
        totalScore: row.total_score != null ? Number(row.total_score) : null,
        riskLevel: row.risk_level as string | null,
        notes: row.notes as string | null,
        doctorName: doctorNames[String(row.completed_by_doctor_id || '')] || null,
      }));

      setAssessmentHistory(mapped);
      setLatestAssessment(mapped[0] ?? null);
    } catch (error) {
      console.error('Error loading assessments:', error);
      setAssessmentHistory([]);
      setLatestAssessment(null);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const loadSessionHistory = async () => {
    if (!childId) return;
    try {
      setLoadingSessions(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('session_id, session_date, session_notes, duration, session_status, doctor_id, created_at')
        .eq('patient_id', childId)
        .order('session_date', { ascending: false });

      if (error) {
        console.error('Error loading sessions:', error);
        toast.error('Failed to load session history');
        setSessionHistory([]);
        return;
      }

      const mapped: SessionHistoryItem[] = (data || []).map((row) => {
        const parsed = parseSessionNotes(String(row.session_notes || ''));
        return {
          id: String(row.session_id),
          date: String(row.session_date || row.created_at),
          title: parsed.title,
          notes: parsed.body,
          duration: row.duration != null ? Number(row.duration) : null,
          status: row.session_status as string | null,
          doctorName: row.doctor_id as string | null,
        };
      });

      setSessionHistory(mapped);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessionHistory([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const combinedTimeline = useMemo(() => {
    const entries: {
      id: string;
      date: string;
      type: string;
      description: string;
      status: string;
    }[] = [];

    for (const a of assessmentHistory) {
      entries.push({
        id: `assessment-${a.id}`,
        date: a.date,
        type: a.questionnaireLabel,
        description:
          a.notes ||
          `Risk: ${a.riskLevel || 'N/A'}${a.totalScore != null ? ` · Score: ${a.totalScore}` : ''}`,
        status: 'completed',
      });
    }

    for (const s of sessionHistory) {
      entries.push({
        id: `session-${s.id}`,
        date: s.date,
        type: s.title,
        description: s.notes,
        status: s.status === 'completed' ? 'completed' : 'update',
      });
    }

    if (patient?.profile_created_date) {
      entries.push({
        id: 'profile-created',
        date: patient.profile_created_date,
        type: 'Profile Created',
        description: 'Initial child profile created',
        status: 'created',
      });
    }

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [assessmentHistory, sessionHistory, patient]);

  const contact = parseCaregiverContact(patient?.caregiver_contact ?? null);
  const childData = patient
    ? {
        id: patient.patient_id || childId || '',
        name: patient.name,
        age: patient.age,
        gender: patient.gender || 'Not specified',
        caregiverName: patient.caregiver_name,
        caregiverPhone: contact.phone || contact.email || '—',
        caregiverEmail: contact.email,
        remarks: patient.remarks,
        status: patient.status,
        riskLevel: patient.risk_level,
        createdDate: patient.profile_created_date || new Date().toISOString(),
        lastAssessment: latestAssessment?.date ?? null,
      }
    : null;

  const recommendations = [
    {
      id: 1,
      category: 'Immediate Actions',
      priority: 'high',
      items: [
        'Schedule follow-up assessment in 3 months',
        'Refer to speech therapist for communication evaluation',
        'Begin social skills group therapy'
      ]
    },
    {
      id: 2,
      category: 'Home-based Interventions',
      priority: 'medium',
      items: [
        'Implement visual schedules for daily routines',
        'Practice joint attention activities during play',
        'Use simple, concrete language during interactions'
      ]
    },
    {
      id: 3,
      category: 'Long-term Goals',
      priority: 'low',
      items: [
        'Develop peer interaction skills',
        'Improve functional communication',
        'Increase independent daily living skills'
      ]
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskBadge = (risk: string | null) => {
    switch (normalizeRiskKey(risk)) {
      case 'high':
        return <Badge variant="destructive">{risk || 'High Risk'}</Badge>;
      case 'moderate':
        return <Badge className="bg-orange-100 text-orange-800">{risk || 'Moderate Risk'}</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">{risk || 'Low Risk'}</Badge>;
      default:
        return <Badge variant="secondary">{risk || 'Unknown'}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'update': return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'created': return <Clock className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleAddComment = async () => {
    if (!childId) return;
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setAddingComment(true);
      const doctorEmployeeId = await resolveLoggedInDoctorId();
      if (!doctorEmployeeId) {
        toast.error('Could not find your therapist profile. Please sign in again.');
        return;
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          patient_id: childId,
          doctor_id: doctorEmployeeId,
          comment_text: newComment.trim(),
        })
        .select('id, created_at, comment_text, doctor_id')
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        toast.error(error.message || 'Failed to add comment');
        return;
      }

      const doctorNames = await fetchDoctorNames([String(data.doctor_id || doctorEmployeeId)]);
      const therapistName =
        doctorNames[String(data.doctor_id || doctorEmployeeId)] || 'Therapist';

      setComments([
        {
          id: Number(data.id),
          therapist: therapistName,
          doctorId: String(data.doctor_id || doctorEmployeeId),
          date: String(data.created_at),
          text: String(data.comment_text || ''),
        },
        ...comments,
      ]);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      setDeletingCommentId(commentId);
      const { error } = await supabase.from('comments').delete().eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        toast.error(error.message || 'Failed to delete comment');
        return;
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const generateGoogleMeetLink = () => {
    // Mock Google Meet link generation
    const randomId = Math.random().toString(36).substring(2, 15);
    return `https://meet.google.com/${randomId.slice(0, 3)}-${randomId.slice(3, 7)}-${randomId.slice(7, 10)}`;
  };

  const handleScheduleMeeting = async () => {
    if (!meetingDate || !meetingTime) {
      toast.error('Please select both date and time');
      return;
    }
    if (!childData) return;

    try {
      setSchedulingMeeting(true);
      const response = await fetch(`${API_BASE_URL}/meetings/${childId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          date: meetingDate.toISOString().split('T')[0],
          time: meetingTime,
          parentPhone: childData.caregiverPhone
        })
      });

      const data = await response.json();
      if (data.success) {
        setScheduledMeetings([data.meeting, ...scheduledMeetings]);
        toast.success('Meeting scheduled! WhatsApp notification sent to parent.');
        
        // Reset form
        setMeetingDate(undefined);
        setMeetingTime('');
      } else {
        toast.error(data.error || 'Failed to schedule meeting');
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error('Failed to schedule meeting');
    } finally {
      setSchedulingMeeting(false);
    }
  };

  const handleSendReminder = async (meetingId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${childId}/${meetingId}/reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setScheduledMeetings(scheduledMeetings.map(meeting => 
          meeting.id === meetingId 
            ? { ...meeting, reminderSent: true }
            : meeting
        ));
        toast.success('WhatsApp reminder sent to parent');
      } else {
        toast.error(data.error || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  if (loadingPatient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mr-3" />
        <span className="text-gray-600">Loading child profile...</span>
      </div>
    );
  }

  if (!childData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl text-gray-900 mb-2">Child profile not found</h2>
        <p className="text-gray-600 mb-6 text-center">
          We could not find a profile for this child. It may have been removed or the link is invalid.
        </p>
        <Button onClick={() => navigate('/therapist/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate('/therapist/dashboard')} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <img src={bloomSenseLogo} alt="BloomSense" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-2xl text-gray-900">{childData.name}</h1>
                <p className="text-sm text-gray-600">Age {childData.age} • Child Profile</p>
              </div>
            </div>
            <Button onClick={() => navigate(`/therapist/screening/${childData.id}`)}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Follow-up Screening
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Child Info Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">AK</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl text-gray-900">{childData.name}</h2>
                  {/* Custom Status Tag */}
                  <div className="flex items-center space-x-2">
                    {isEditingTag ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="text"
                          value={tempTag}
                          onChange={(e) => setTempTag(e.target.value)}
                          className="h-8 w-48"
                          placeholder="Enter status..."
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (tempTag.trim()) {
                              setCustomTag(tempTag);
                              setIsEditingTag(false);
                              toast.success('Status updated');
                            }
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsEditingTag(false);
                            setTempTag('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{customTag}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setTempTag(customTag);
                            setIsEditingTag(true);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    Age {childData.age}, {childData.gender}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    Caregiver: {childData.caregiverName}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {childData.caregiverPhone}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Latest Screening Summary */}
        {latestAssessment && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Latest Screening Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Questionnaire</p>
                  <p className="font-medium">{latestAssessment.questionnaireLabel}</p>
                </div>
                <div>
                  <p className="text-gray-600">Risk Level</p>
                  <p className="font-medium">{latestAssessment.riskLevel || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Score</p>
                  <p className="font-medium">
                    {latestAssessment.totalScore != null ? latestAssessment.totalScore : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-medium">
                    {new Date(latestAssessment.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="meetings">Follow-Up</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assessment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Assessment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAssessments ? (
                    <div className="py-8 text-center text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading assessments...
                    </div>
                  ) : assessmentHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">No assessments recorded yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {assessmentHistory.map((assessment) => (
                        <div key={assessment.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{assessment.questionnaireLabel}</h4>
                            {getRiskBadge(assessment.riskLevel)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {new Date(assessment.date).toLocaleDateString()}
                          </p>
                          <div className="space-y-1 text-sm">
                            {assessment.totalScore != null && (
                              <p>
                                <span className="font-medium">Total score:</span> {assessment.totalScore}
                              </p>
                            )}
                            {assessment.doctorName && (
                              <p>
                                <span className="font-medium">Completed by:</span> {assessment.doctorName}
                              </p>
                            )}
                            {assessment.notes && (
                              <p className="text-gray-700 whitespace-pre-wrap mt-2">{assessment.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Session History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Session History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSessions ? (
                    <div className="py-8 text-center text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading sessions...
                    </div>
                  ) : sessionHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">No therapy sessions recorded yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {sessionHistory.map((session) => (
                        <div key={session.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{session.title}</h4>
                            <Badge variant="outline" className="text-xs capitalize">
                              {session.status || 'session'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {new Date(session.date).toLocaleDateString()}
                            {session.duration != null && (
                              <span className="ml-2">· {session.duration} min</span>
                            )}
                          </p>
                          {session.doctorName && (
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Therapist ID:</span> {session.doctorName}
                            </p>
                          )}
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.notes}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Profile Created</span>
                          <span className="text-sm font-medium">
                            {new Date(childData.createdDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Last Assessment</span>
                          <span className="text-sm font-medium">
                            {childData.lastAssessment
                              ? new Date(childData.lastAssessment).toLocaleDateString()
                              : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Sessions</span>
                          <span className="text-sm font-medium">{sessionHistory.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Assessments</span>
                          <span className="text-sm font-medium">{assessmentHistory.length}</span>
                        </div>
                      </div>
                    
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Session Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAssessments || loadingSessions ? (
                  <div className="py-8 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading timeline...
                  </div>
                ) : combinedTimeline.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">No events recorded yet.</p>
                ) : (
                  <div className="space-y-6">
                    {combinedTimeline.map((entry, index) => (
                      <div key={entry.id} className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                          {getStatusIcon(entry.status)}
                          {index < combinedTimeline.length - 1 && (
                            <div className="w-px h-16 bg-gray-200 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{entry.type}</h4>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Doctor's Comments Tab */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Doctor's Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add New Comment */}
                <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                  <Label htmlFor="newComment">Add New Comment</Label>
                  <Textarea
                    id="newComment"
                    placeholder="Enter your observations, notes, or recommendations for this child..."
                    className="min-h-[100px]"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button onClick={handleAddComment} disabled={addingComment}>
                    {addingComment ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {addingComment ? 'Adding...' : 'Add Comment'}
                  </Button>
                </div>

                {/* Comments History */}
                <div className="space-y-4">
                  <h4 className="font-medium">Comment History</h4>
                  {loadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No comments yet. Add your first comment above.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{comment.therapist}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {loggedInDoctorId && comment.doctorId === loggedInDoctorId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deletingCommentId === comment.id}
                                aria-label="Delete comment"
                              >
                                {deletingCommentId === comment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
              
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Follow-Up Meetings Tab */}
          <TabsContent value="meetings">
            <div className="space-y-6">
              {/* Schedule New Meeting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="h-5 w-5 mr-2" />
                    Schedule Follow-Up Meeting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Meeting Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left">
                              <Calendar className="h-4 w-4 mr-2" />
                              {meetingDate ? meetingDate.toLocaleDateString() : 'Select date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={meetingDate}
                              onSelect={setMeetingDate}
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="meetingTime">Meeting Time</Label>
                        <Input
                          id="meetingTime"
                          type="time"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> A Google Meet link will be automatically generated and sent to the parent via WhatsApp. 
                        A reminder will be sent 30 minutes before the scheduled time.
                      </p>
                    </div>

                    <Button onClick={handleScheduleMeeting} className="w-full" disabled={schedulingMeeting}>
                      {schedulingMeeting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {schedulingMeeting ? 'Scheduling...' : 'Schedule Meeting & Send Invitation'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Scheduled Meetings */}
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Meetings</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingMeetings ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                    </div>
                  ) : scheduledMeetings.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No meetings scheduled yet. Schedule one above.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {scheduledMeetings.map((meeting) => (
                        <div key={meeting.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">
                                  {new Date(meeting.date).toLocaleDateString('en-US', { 
                                    weekday: 'long',
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">{meeting.time}</span>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              {meeting.status}
                            </Badge>
                          </div>

                          <div className="bg-gray-50 rounded p-3 mb-3">
                            <p className="text-xs text-gray-600 mb-1">Google Meet Link:</p>
                            <a 
                              href={meeting.meetLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-teal-600 hover:underline break-all"
                            >
                              {meeting.meetLink}
                            </a>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Send className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                {meeting.reminderSent ? 'Reminder sent ✓' : 'Reminder pending'}
                              </span>
                            </div>
                            {!meeting.reminderSent && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSendReminder(meeting.id)}
                              >
                                Send Reminder Now
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}