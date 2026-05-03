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
import { getApiBaseUrl } from '../config';

interface Patient {
  id: string;
  name: string;
  age: number;
  status: string;
  lastSession: string;
  riskLevel?: string;
  screeningStage?: string;
}

interface Doctors {
  doctor_id: string;
  name: string;
  email: string;
  occupation: string;
  status: string;
  patients: Patient[];
  totalPatients: number;
  lastLogin: string;
}

interface Questionnaire {
  id: string;
  name: string;
}
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState<Doctors[]>([]);
  const [expandedTherapists, setExpandedTherapists] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTherapists: 0,
    totalPatients: 0,
    totalQuestionaires: 0,
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  

  const loadAdminData = async () => {
    try {
      const adminRequest = async <T = unknown>(endpoint: string, options?: RequestInit): Promise<T> => {
        const base = getApiBaseUrl();
        const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
          },
          ...options,
        });

        const result = await response.json();
        if (!response.ok || !result?.success) {
          throw new Error(result?.error || 'Admin request failed');
        }
        return result.data as T;
      };

      // Fetch doctors/patients and questionnaires.
      const [doctorsResult, patientsResult, questionnairesResult] = await Promise.all([
        supabase.from('doctors').select('*'),
        supabase.from('patients').select('*'),
        supabase.from('questionnaires').select('id', { count: 'exact', head: true }),
      ]);

      if (doctorsResult.error) throw doctorsResult.error;
      if (patientsResult.error) throw patientsResult.error;
      if (questionnairesResult.error) throw questionnairesResult.error;

      const doctors_data = doctorsResult.data || [];
      const patients_data = patientsResult.data || [];
      const questionnairesCount = questionnairesResult.count ?? 0;
      const authUserIds = doctors_data
        .map((doctor: any) => String(doctor.user_id || '').trim())
        .filter(Boolean);
      let usersById: Record<string, string> = {};

      try {
        usersById = await adminRequest<Record<string, string>>('/api/auth/users-emails', {
          method: 'POST',
          body: JSON.stringify({ userIds: authUserIds }),
        });
      } catch (e: any) {
        console.warn('Could not load auth user emails from API:', e?.message || e);
      }

      // Transform data to match AdminDashboard interface
      const therapists: Doctors[] = [];

      for (const doctor of doctors_data) {
        const doctor_id = doctor.employee_id;

        // Get patients assigned to this doctor
        const doctor_patients = patients_data.filter(
          (p: any) => p.assigned_doctor_id === doctor_id
        );

        // Transform patient data
        const formatted_patients: Patient[] = [];
        for (const patient of doctor_patients) {
          const last_session = patient.last_session_date || patient.last_session;
          let last_session_str = 'No sessions yet';

          if (last_session) {
            try {
              const last_session_date = new Date(last_session);
              const now = new Date();
              const days_ago = Math.floor(
                (now.getTime() - last_session_date.getTime()) / (1000 * 60 * 60 * 24)
              );

              if (days_ago === 0) {
                last_session_str = 'Today';
              } else if (days_ago === 1) {
                last_session_str = '1 day ago';
              } else {
                last_session_str = `${days_ago} days ago`;
              }
            } catch {
              last_session_str = 'Recently';
            }
          }

          formatted_patients.push({
            id: String(patient.patient_id || patient.id || ''),
            name: patient.name || 'Unknown',
            age: patient.age || 0,
            status: patient.status || 'In Progress',
            lastSession: last_session_str,
            riskLevel: patient.risk_level,
            screeningStage: patient.profile_tag,
          });
        }

        const email = doctor.email;

        // Use active_patients from doctors table
        const active_patients = doctor.active_patients || formatted_patients.length;

        // Get last login
        const last_login = doctor.last_login || doctor.created_at;
        let last_login_str = '2024-01-20';

        if (last_login) {
          try {
            const login_date = new Date(last_login);
            last_login_str = login_date.toISOString().split('T')[0];
          } catch {
            last_login_str = '2024-01-20';
          }
        }

        therapists.push({
          doctor_id: doctor.employee_id,
          name: doctor.name || `Dr. ${doctor.user_id || 'Unknown'}`,
          email: doctor.email,
          occupation: doctor.occupation || 'Therapist',
          status: doctor.status || 'active',
          lastLogin: last_login_str,
          totalPatients: active_patients,
          patients: formatted_patients,
        });
      }

      setTherapists(therapists);

      // Total patients directly from patients table rows.
      const totalPatients = patients_data.length;
      
      setStats({
        totalTherapists: therapists.length,
        totalPatients,
        totalQuestionaires: questionnairesCount,
      });
    } catch (error: any) {
      console.error('Error loading admin data:', error);
      toast.error(`Failed to load data: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTherapist = (employeeId: string) => {
    const newExpanded = new Set(expandedTherapists);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedTherapists(newExpanded);
  };

  const expandAll = () => {
    setExpandedTherapists(new Set(therapists.map((t) => t.employee_id)));
  };

  const collapseAll = () => {
    setExpandedTherapists(new Set());
  };

  const getRiskLevelColor = (riskLevel: string | undefined) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'bg-orange-100 text-orange-800';
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <p className="text-sm text-gray-600">Total Questionaires</p>
                  <p className="text-2xl">{stats.totalQuestionaires}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
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
                  <div key={therapist.employee_id} className="border rounded-lg overflow-hidden">
                    {/* Therapist Header */}
                    <div 
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => toggleTherapist(therapist.employee_id)}
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
                              {therapist.occupation}
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
                        {expandedTherapists.has(therapist.employee_id) ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>

                    {/* Patients List (Expanded) */}
                    {expandedTherapists.has(therapist.employee_id) && (
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