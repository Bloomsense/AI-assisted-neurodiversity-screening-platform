import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { 
  Users, 
  LogOut,
  Search,
  ChevronDown,
  ChevronRight,
  Shield,
  FileText,
  Calendar,
  Eye,
  Settings as SettingsIcon,
  Activity
} from 'lucide-react';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';

interface Patient {
  id: number;
  name: string;
  age: number;
  status: string;
  lastSession: string;
  riskLevel?: string;
}

interface Doctors {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  patients: Patient[];
  totalPatients: number;
  lastLogin: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState<Doctors[]>([]);
  const [expandedTherapists, setExpandedTherapists] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTherapists: 0,
    totalPatients: 0,
    activeScreenings: 0,
    completedScreenings: 0
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  

  const loadAdminData = async () => {
    try {
      // Update this URL to your Flask backend
      const API_BASE_URL = import.meta.env.VITE_FLASK_API_URL || '';
      
      const response = await fetch(
        `${API_BASE_URL}/api/admin/therapists`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.therapists) {
          setTherapists(data.therapists || []);
          
          // Calculate stats
          const totalPatients = data.therapists.reduce((sum: number, t: Doctors) => sum + t.totalPatients, 0);
          const activeScreenings = data.therapists.reduce((sum: number, t: Doctors) => 
            sum + t.patients.filter((p: Patient) => p.status !== 'Assessment Complete').length, 0
          );
          const completedScreenings = data.therapists.reduce((sum: number, t: Doctors) => 
            sum + t.patients.filter((p: Patient) => p.status === 'Assessment Complete').length, 0
          );
          setStats({
            totalTherapists: data.therapists.length,
            totalPatients,
            activeScreenings,
            completedScreenings
          });
        } else {
          console.error('API returned unsuccessful response:', data);
          toast.error('Failed to load therapists data');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error:', response.status, errorData);
        toast.error(`Failed to load data: ${errorData.error || 'Server error'}`);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to connect to backend. Please ensure Flask server is running.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTherapist = (therapistId: number) => {
    const newExpanded = new Set(expandedTherapists);
    if (newExpanded.has(therapistId)) {
      newExpanded.delete(therapistId);
    } else {
      newExpanded.add(therapistId);
    }
    setExpandedTherapists(newExpanded);
  };

  const expandAll = () => {
    setExpandedTherapists(new Set(therapists.map(t => t.id)));
  };

  const collapseAll = () => {
    setExpandedTherapists(new Set());
  };

  const getRiskLevelColor = (riskLevel: string | undefined) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'assessment complete': return 'bg-green-100 text-green-800';
      case 'follow-up needed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTherapists = therapists.filter(therapist =>
    therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    therapist.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    therapist.patients.some(patient => 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleLogout = () => {
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src={bloomSenseLogo} alt="BloomSense" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-2xl text-gray-900">BloomSense Admin</h1>
                <p className="text-sm text-gray-600">System Administration Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin/settings')}
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl text-gray-900">System Overview</h2>
          <p className="mt-2 text-gray-600">Manage all therapists and monitor patient progress across the platform.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Therapists</p>
                  <p className="text-2xl">{stats.totalTherapists}</p>
                </div>
                <Shield className="h-8 w-8 text-[#20B2AA]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Patients</p>
                  <p className="text-2xl">{stats.totalPatients}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Screenings</p>
                  <p className="text-2xl">{stats.activeScreenings}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl">{stats.completedScreenings}</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search therapists or patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Therapists and Patients List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Therapists & Their Patients
            </CardTitle>
            <CardDescription>
              View all therapists and their assigned patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredTherapists.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No therapists found</div>
            ) : (
              <div className="space-y-4">
                {filteredTherapists.map((therapist) => (
                  <div key={therapist.id} className="border rounded-lg overflow-hidden">
                    {/* Therapist Header */}
                    <div 
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => toggleTherapist(therapist.id)}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-[#20B2AA] text-white">
                            {therapist.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{therapist.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {therapist.role}
                            </Badge>
                            <Badge 
                              variant={therapist.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {therapist.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{therapist.email}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-500 flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {therapist.totalPatients} patients
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Last login: {therapist.lastLogin}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info('Viewing therapist details...');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {expandedTherapists.has(therapist.id) ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>

                    {/* Patients List (Expanded) */}
                    {expandedTherapists.has(therapist.id) && (
                      <div className="p-4 bg-white border-t">
                        {therapist.patients.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No patients assigned</p>
                        ) : (
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">
                              Patients ({therapist.patients.length})
                            </h5>
                            {therapist.patients.map((patient) => (
                              <div 
                                key={patient.id} 
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center space-x-3 flex-1">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-blue-100 text-blue-700">
                                      {patient.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm text-gray-900">{patient.name}</p>
                                      <Badge variant="secondary" className="text-xs">
                                        Age {patient.age}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-xs text-gray-500">
                                        Last session: {patient.lastSession}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {patient.riskLevel && (
                                    <Badge className={`text-xs ${getRiskLevelColor(patient.riskLevel)}`}>
                                      {patient.riskLevel} Risk
                                    </Badge>
                                  )}
                                  <Badge className={`text-xs ${getStatusColor(patient.status)}`}>
                                    {patient.status}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toast.info(`Viewing details for ${patient.name}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
