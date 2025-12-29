import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { 
  Brain, 
  Calendar, 
  MessageCircle, 
  BookOpen, 
  Download, 
  User, 
  Heart,
  LogOut,
  ExternalLink,
  TrendingUp,
  Clock
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export default function CaregiverPortal() {
  const navigate = useNavigate();

  const childProgress = {
    name: 'Ahmad Khan',
    age: 4,
    lastAssessment: '2024-01-20',
    nextSession: '2024-01-25',
    overallProgress: 75,
    recentMilestones: [
      'Improved eye contact during meals',
      'Started using pointing gestures',
      'Better response to name calling'
    ]
  };

  const upcomingSessions = [
    {
      id: 1,
      date: '2024-01-25',
      time: '10:00 AM',
      type: 'Follow-up Assessment',
      therapist: 'Dr. Sarah Ahmed',
      location: 'Clinic Room 2'
    },
    {
      id: 2,
      date: '2024-02-01',
      time: '2:00 PM',
      type: 'Therapy Session',
      therapist: 'Dr. Sarah Ahmed',
      location: 'Clinic Room 2'
    }
  ];

  const therapistNotes = [
    {
      id: 1,
      date: '2024-01-20',
      note: 'Ahmad showed great improvement in social engagement. Continue with home activities focusing on joint attention.',
      priority: 'medium'
    },
    {
      id: 2,
      date: '2024-01-15',
      note: 'Initial assessment completed. Recommend daily structured play activities and visual schedules.',
      priority: 'high'
    }
  ];

  const educationalResources = [
    {
      id: 1,
      title: 'Understanding Autism Spectrum Disorders in Pakistani Children',
      type: 'Article',
      duration: '8 min read',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=300&h=200&fit=crop'
    },
    {
      id: 2,
      title: 'Early Intervention Strategies for Parents',
      type: 'Video',
      duration: '15 min watch',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop'
    },
    {
      id: 3,
      title: 'Communication Activities for Daily Routines',
      type: 'Guide',
      duration: '12 page PDF',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=200&fit=crop'
    },
    {
      id: 4,
      title: 'نیوروڈائیورسٹی کی سمجھ: والدین کے لیے رہنمائی',
      type: 'Article (Urdu)',
      duration: '10 min read',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl text-gray-900">Caregiver Portal</h1>
                <p className="text-sm text-gray-600">Welcome, Fatima Khan</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message Therapist
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Child Progress Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              {childProgress.name}'s Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-start space-x-4 mb-6">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl">AK</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl text-gray-900 mb-1">{childProgress.name}</h3>
                    <p className="text-gray-600 mb-2">Age {childProgress.age}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Last Assessment: {new Date(childProgress.lastAssessment).toLocaleDateString()}</span>
                      <span>Next Session: {new Date(childProgress.nextSession).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-gray-600">{childProgress.overallProgress}%</span>
                    </div>
                    <Progress value={childProgress.overallProgress} />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 text-green-700">Recent Milestones</h4>
                    <ul className="space-y-1">
                      {childProgress.recentMilestones.map((milestone, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-700">
                          <Heart className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                          {milestone}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Improvement Rate</p>
                      <p className="text-2xl font-bold text-green-600">+15%</p>
                      <p className="text-xs text-gray-500">Since last month</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{session.type}</h4>
                      <Badge variant="outline">
                        {new Date(session.date).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {session.time}
                      </p>
                      <p className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {session.therapist}
                      </p>
                      <p>{session.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Therapist Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Therapist Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {therapistNotes.map((note) => (
                  <div key={note.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={note.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                        {note.priority.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(note.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{note.note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Educational Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Educational Resources
            </CardTitle>
            <CardDescription>
              Articles, guides, and videos to support your child's development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {educationalResources.map((resource) => (
                <Card key={resource.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <ImageWithFallback
                      src={resource.image}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {resource.type}
                      </Badge>
                      <span className="text-xs text-gray-500">{resource.duration}</span>
                    </div>
                    <h4 className="font-medium text-sm mb-2 line-clamp-2">{resource.title}</h4>
                    <Button size="sm" variant="ghost" className="w-full">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Resource
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="h-auto p-4 flex flex-col items-center space-y-2">
            <MessageCircle className="h-8 w-8" />
            <span>Message Therapist</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
            <Download className="h-8 w-8" />
            <span>Download Reports</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
            <Calendar className="h-8 w-8" />
            <span>Schedule Session</span>
          </Button>
        </div>
      </div>
    </div>
  );
}