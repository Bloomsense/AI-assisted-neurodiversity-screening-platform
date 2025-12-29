import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';

type EventType = 'session' | 'assessment' | null;

export default function EventSelection() {
  const navigate = useNavigate();
  const [selectedEventType, setSelectedEventType] = useState<EventType>(null);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock children data - in real app, this would come from Supabase
  const allChildren = [
    { id: 1, name: 'Ahmad Khan', age: 4, lastSession: '2 days ago', status: 'In Progress' },
    { id: 2, name: 'Fatima Ali', age: 6, lastSession: '1 week ago', status: 'Assessment Complete' },
    { id: 3, name: 'Hassan Ahmed', age: 3, lastSession: '3 days ago', status: 'Follow-up Needed' },
    { id: 4, name: 'Aisha Malik', age: 5, lastSession: '5 days ago', status: 'In Progress' },
    { id: 5, name: 'Omar Hassan', age: 7, lastSession: '1 day ago', status: 'In Progress' },
    { id: 6, name: 'Zainab Ibrahim', age: 4, lastSession: '3 days ago', status: 'Assessment Complete' },
    { id: 7, name: 'Ali Mohammed', age: 6, lastSession: '2 weeks ago', status: 'Follow-up Needed' },
    { id: 8, name: 'Maryam Yusuf', age: 5, lastSession: '4 days ago', status: 'In Progress' },
  ];

  // Filter children based on search query
  const filteredChildren = allChildren.filter(child =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEvent = () => {
    if (!selectedEventType || !selectedChild) {
      return;
    }

    // Navigate based on event type
    if (selectedEventType === 'assessment') {
      navigate(`/therapist/screening/${selectedChild}`);
    } else if (selectedEventType === 'session') {
      navigate(`/therapist/session/${selectedChild}`);
    }
  };

  const isFormValid = selectedEventType && selectedChild;

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
            <Button variant="ghost" size="sm" onClick={() => navigate('/therapist/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-3xl text-gray-900">Start New Event</h2>
          <p className="mt-2 text-gray-600">Select the type of event and the child you're working with.</p>
        </div>

        {/* Event Type Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 1: Select Event Type</CardTitle>
            <CardDescription>Choose whether you're starting a session or an assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
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
                  <Calendar className={`h-12 w-12 ${
                    selectedEventType === 'session' ? 'text-teal-600' : 'text-gray-400'
                  }`} />
                  <div className="text-center">
                    <h3 className="font-medium">Start a Session</h3>
                    <p className="text-sm text-gray-500 mt-1">Begin a therapy session with a child</p>
                  </div>
                </div>
              </button>

              <button
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
                  <FileText className={`h-12 w-12 ${
                    selectedEventType === 'assessment' ? 'text-teal-600' : 'text-gray-400'
                  }`} />
                  <div className="text-center">
                    <h3 className="font-medium">Start an Assessment</h3>
                    <p className="text-sm text-gray-500 mt-1">Begin a formal screening assessment</p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Child Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 2: Select Child</CardTitle>
            <CardDescription>Choose the child for this event</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
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

            {/* Children List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredChildren.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No children found matching "{searchQuery}"
                </div>
              ) : (
                filteredChildren.map((child) => (
                  <button
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
                        <AvatarFallback>{child.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium">{child.name}</p>
                        <p className="text-sm text-gray-500">Age {child.age} • Last session: {child.lastSession}</p>
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

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/therapist/dashboard')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartEvent}
            disabled={!isFormValid}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Start Event
          </Button>
        </div>
      </div>
    </div>
  );
}
