import React, { useState, useEffect } from 'react';
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
  Lightbulb,
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
  Check
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';

export default function ChildProfileDetail() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Doctor's Comments State
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [addingComment, setAddingComment] = useState(false);
  
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

  // Use local backend in development, cloud backend in production
  const API_BASE_URL = import.meta.env.DEV 
    ? 'http://localhost:8000/make-server-8d885905'
    : `https://${projectId}.supabase.co/functions/v1/make-server-8d885905`;

  // Load comments and meetings on component mount
  useEffect(() => {
    if (childId) {
      loadComments();
      loadMeetings();
    }
  }, [childId]);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const response = await fetch(`${API_BASE_URL}/comments/${childId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
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

  // Mock child data
  const childData = {
    id: childId || '1',
    name: 'Ahmad Khan',
    age: 4,
    gender: 'Male',
    caregiverName: 'Fatima Khan',
    caregiverPhone: '+92 300 1234567',
    createdDate: '2024-01-15',
    lastAssessment: '2024-01-20'
  };

  const assessmentHistory = [
    {
      id: 1,
      date: '2024-01-20',
      type: 'Complete Screening',
      mchatScore: '6/8 Red Flags',
      adosScore: '12',
      iqScore: '85',
      status: 'completed',
      risk: 'moderate'
    },
    {
      id: 2,
      date: '2024-01-15',
      type: 'Initial Assessment',
      mchatScore: '4/8 Red Flags',
      status: 'completed',
      risk: 'low'
    }
  ];

  const sessionTimeline = [
    {
      id: 1,
      date: '2024-01-20',
      type: 'Assessment Complete',
      description: 'Full screening workflow completed including M-CHAT, behavior analysis, and ADOS testing',
      status: 'completed'
    },
    {
      id: 2,
      date: '2024-01-18',
      type: 'Caregiver Update',
      description: 'Parent reported improved eye contact during meal times',
      status: 'update'
    },
    {
      id: 3,
      date: '2024-01-15',
      type: 'Profile Created',
      description: 'Initial child profile created with basic information',
      status: 'created'
    }
  ];

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

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high': return <Badge variant="destructive">High Risk</Badge>;
      case 'moderate': return <Badge className="bg-orange-100 text-orange-800">Moderate Risk</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
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
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setAddingComment(true);
      const response = await fetch(`${API_BASE_URL}/comments/${childId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          text: newComment,
          therapist: 'Dr. Sarah Ahmed'
        })
      });

      const data = await response.json();
      if (data.success) {
        setComments([data.comment, ...comments]);
        setNewComment('');
        toast.success('Comment added successfully');
      } else {
        toast.error(data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setAddingComment(false);
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
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
                  <div className="space-y-4">
                    {assessmentHistory.map((assessment) => (
                      <div key={assessment.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{assessment.type}</h4>
                          {getRiskBadge(assessment.risk)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {new Date(assessment.date).toLocaleDateString()}
                        </p>
                        <div className="space-y-1 text-sm">
                          {assessment.mchatScore && (
                            <p><span className="font-medium">M-CHAT:</span> {assessment.mchatScore}</p>
                          )}
                          {assessment.adosScore && (
                            <p><span className="font-medium">ADOS:</span> {assessment.adosScore}</p>
                          )}
                          {assessment.iqScore && (
                            <p><span className="font-medium">IQ:</span> {assessment.iqScore}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <div className="space-y-4">
                    {/* Mock session data - in real app, this would come from Supabase */}
                    {[
                      {
                        id: 1,
                        title: 'Social Skills Development',
                        date: '2024-01-22',
                        notes: 'Child showed good progress in maintaining eye contact during structured activities. Responded positively to social games.'
                      },
                      {
                        id: 2,
                        title: 'Behavioral Assessment',
                        date: '2024-01-18',
                        notes: 'Observed repetitive behaviors during free play. Recommend sensory integration activities for future sessions.'
                      }
                    ].map((session) => (
                      <div key={session.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{session.title}</h4>
                          <Badge variant="outline" className="text-xs">Session</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {new Date(session.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-700">{session.notes}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Summary Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Latest Screening Results</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">M-CHAT Risk Factors</span>
                          <span className="text-sm font-medium">6/8</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">ADOS Score</span>
                          <span className="text-sm font-medium">12</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">IQ Assessment</span>
                          <span className="text-sm font-medium">85</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Profile Information</h4>
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
                            {new Date(childData.lastAssessment).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Sessions</span>
                          <span className="text-sm font-medium">3</span>
                        </div>
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
                <div className="space-y-6">
                  {sessionTimeline.map((session, index) => (
                    <div key={session.id} className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        {getStatusIcon(session.status)}
                        {index < sessionTimeline.length - 1 && (
                          <div className="w-px h-16 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{session.type}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(session.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <div className="space-y-6">
              {recommendations.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Lightbulb className="h-5 w-5 mr-2" />
                        {category.category}
                      </div>
                      <Badge className={getPriorityColor(category.priority)}>
                        {category.priority.toUpperCase()} PRIORITY
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.items.map((item, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="bg-teal-50 border-teal-200">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <img src={bloomSenseLogo} alt="BloomSense" className="h-6 w-6 mt-1" />
                    <div>
                      <h4 className="font-medium text-teal-900 mb-2">AI-Generated Insights</h4>
                      <p className="text-sm text-teal-800">
                        Based on the assessment results, Ahmad shows moderate risk indicators. 
                        Early intervention focusing on communication and social skills is recommended. 
                        The combination of structured activities and caregiver training should yield positive outcomes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                          <MessageSquare className="h-4 w-4 text-gray-400" />
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