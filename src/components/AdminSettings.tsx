import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  Download, 
  Upload,
  Plus,
  Trash2,
  Edit,
  Shield,
  Database,
  FileText,
  BarChart
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('therapists');
  const [includePersonal, setIncludePersonal] = useState(false); 
  const [includeScores, setIncludeScores] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [therapistAccounts, setTherapistAccounts] = useState<Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    patients: number;
    lastLogin: string;
  }>>([]);
  const [mchatQuestions, setMchatQuestions] = useState<string[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalChildren: 0,
    totalTherapists: 0,
    totalCaregivers: 0,
    completedScreenings: 0,
    pendingAssessments: 0,
  });

  useEffect(() => {
    const loadAdminSettingsData = async () => {
      const nowIso = new Date().toISOString();

      const [patientsResult, doctorsResult, caregiversResult, assessmentsResult, pendingSessionsResult] =
        await Promise.all([
          supabase.from('patients').select('id', { count: 'exact', head: true }),
          supabase.from('doctors').select('*'),
          supabase.from('helpdesk_staff').select('user_id', { count: 'exact', head: true }),
          supabase.from('assessments').select('id', { count: 'exact', head: true }),
          supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .in('status', ['scheduled', 'pending'])
            .gte('appointment_date', nowIso),
        ]);

      if (doctorsResult.error) {
        console.error('Error loading therapist accounts:', doctorsResult.error);
        setTherapistAccounts([]);
      } else {
        const mappedTherapists = (doctorsResult.data || []).map((doctor: any, index: number) => ({
          id: index + 1,
          name: doctor.name || `Doctor ${index + 1}`,
          email: doctor.email || 'N/A',
          role: doctor.occupation || 'Therapist',
          status: doctor.status || 'active',
          patients: Number(doctor.active_patients) || 0,
          lastLogin: doctor.last_login
            ? new Date(doctor.last_login).toISOString().split('T')[0]
            : 'N/A',
        }));
        setTherapistAccounts(mappedTherapists);
      }

      if (
        patientsResult.error ||
        caregiversResult.error ||
        assessmentsResult.error ||
        pendingSessionsResult.error
      ) {
        console.error('Error loading admin settings stats:', {
          patients: patientsResult.error,
          caregivers: caregiversResult.error,
          assessments: assessmentsResult.error,
          pendingSessions: pendingSessionsResult.error,
        });
      }

      setSystemStats({
        totalChildren: patientsResult.count ?? 0,
        totalTherapists: doctorsResult.data?.length ?? 0,
        totalCaregivers: caregiversResult.count ?? 0,
        completedScreenings: assessmentsResult.count ?? 0,
        pendingAssessments: pendingSessionsResult.count ?? 0,
      });

      const { data: questionsData } = await supabase
        .from('questionaire')
        .select('questions')
        .order('questions_order', { ascending: true });

      setMchatQuestions((questionsData || []).map((q: any) => q.questions).filter(Boolean));
    };

    loadAdminSettingsData();
  }, []);

  // Fetch patient data from Supabase
  const fetchPatientData = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      throw new Error(`Failed to fetch patient data: ${error.message}`);
    }
  };

  // Convert data to CSV format
  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    // Get all unique keys from all objects
    const headers = Array.from(
      new Set(data.flatMap(obj => Object.keys(obj)))
    );

    // Create CSV header
    const csvHeader = headers.join(',');

    // Create CSV rows
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    return [csvHeader, ...csvRows].join('\n');
  };

  // Download file helper
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const handleExportCSV = async () => {
    if (!includePersonal) {
      toast.error('Please enable "Include Personal Information" to export patient data.');
      return;
    }

    setIsExporting(true);
    try {
      const patientData = await fetchPatientData();
      
      if (patientData.length === 0) {
        toast.warning('No patient data found to export.');
        setIsExporting(false);
        return;
      }

      // Filter data based on options
      let exportData = patientData.map(patient => ({ ...patient }));
      
      // If includeScores is false, remove score-related fields
      if (!includeScores) {
        exportData = exportData.map(patient => {
          const { total_score, iq_score, risk_level, screening_results, ...rest } = patient;
          return rest;
        });
      }

      // If includeTimeline is false, remove timeline-related fields
      if (!includeTimeline) {
        exportData = exportData.map(patient => {
          const { session_date, session_notes, duration, session_status_type, ...rest } = patient;
          return rest;
        });
      }

      const csvContent = convertToCSV(exportData);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(csvContent, `patients_export_${timestamp}.csv`, 'text/csv');
      
      toast.success(`Successfully exported ${patientData.length} patient records as CSV.`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Failed to export data: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Export as JSON
  const handleExportJSON = async () => {
    if (!includePersonal) {
      toast.error('Please enable "Include Personal Information" to export patient data.');
      return;
    }

    setIsExporting(true);
    try {
      const patientData = await fetchPatientData();
      
      if (patientData.length === 0) {
        toast.warning('No patient data found to export.');
        setIsExporting(false);
        return;
      }

      // Filter data based on options
      let exportData = patientData.map(patient => ({ ...patient }));
      
      // If includeScores is false, remove score-related fields
      if (!includeScores) {
        exportData = exportData.map(patient => {
          const { total_score, iq_score, risk_level, screening_results, ...rest } = patient;
          return rest;
        });
      }

      // If includeTimeline is false, remove timeline-related fields
      if (!includeTimeline) {
        exportData = exportData.map(patient => {
          const { session_date, session_notes, duration, session_status_type, ...rest } = patient;
          return rest;
        });
      }

      const jsonContent = JSON.stringify(exportData, null, 2);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(jsonContent, `patients_export_${timestamp}.json`, 'application/json');
      
      toast.success(`Successfully exported ${patientData.length} patient records as JSON.`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Failed to export data: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddTherapist = () => {
    toast.success('Therapist invitation sent successfully');
  };

  const handleToggleStatus = (therapistId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    toast.success(`Therapist status updated to ${newStatus}`);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <img src={bloomSenseLogo} alt="BloomSense" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-2xl text-gray-900">Admin Settings</h1>
                <p className="text-sm text-gray-600">System administration and management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Children</p>
                  <p className="text-2xl font-bold">{systemStats.totalChildren}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Therapists</p>
                  <p className="text-2xl font-bold">{systemStats.totalTherapists}</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Caregivers</p>
                  <p className="text-2xl font-bold">{systemStats.totalCaregivers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{systemStats.completedScreenings}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{systemStats.pendingAssessments}</p>
                </div>
                <BarChart className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="therapists">Therapist Accounts</TabsTrigger>
            <TabsTrigger value="checklists">Assessment Tools</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
          </TabsList>

          {/* Therapist Accounts Tab */}
          <TabsContent value="therapists" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Therapist Accounts</CardTitle>
                    <CardDescription>Manage therapist access and permissions</CardDescription>
                  </div>
                  <Button onClick={handleAddTherapist}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Therapist
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {therapistAccounts.length === 0 ? (
                    <div className="text-sm text-gray-500 py-6 text-center">
                      No therapist accounts found in database.
                    </div>
                  ) : (
                    therapistAccounts.map((therapist) => (
                      <div key={therapist.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>{therapist.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{therapist.name}</h4>
                            <p className="text-sm text-gray-600">{therapist.email}</p>
                            <p className="text-sm text-gray-500">{therapist.role} • {therapist.patients} patients</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={therapist.status === 'active' ? 'default' : 'secondary'}>
                            {therapist.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={therapist.status === 'active'}
                            onCheckedChange={() => handleToggleStatus(therapist.id, therapist.status)}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessment Tools Tab */}
          <TabsContent value="checklists" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>M-CHAT Question Set</CardTitle>
                <CardDescription>Manage screening questions and assessment criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mchatQuestions.length === 0 ? (
                    <div className="text-sm text-gray-500 py-6 text-center">
                      No assessment questions found in database.
                    </div>
                  ) : (
                    mchatQuestions.map((question, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Question {index + 1}</p>
                          <p className="text-sm text-gray-600">{question}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Question
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>M-CHAT Risk Thresholds</CardTitle>
                <CardDescription>Configure M-CHAT assessment risk indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lowRisk">Low Risk Threshold</Label>
                    <Input id="lowRisk" defaultValue="0-2 red flags" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="moderateRisk">Moderate Risk Threshold</Label>
                    <Input id="moderateRisk" defaultValue="3-5 red flags" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="highRisk">High Risk Threshold</Label>
                    <Input id="highRisk" defaultValue="6+ red flags" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" /> Data Export
                </CardTitle>
                <CardDescription>
                  Export Patient data for data backups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Data Export Options</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="includePersonal">Include Personal Information</Label>
                        <Switch 
                          id="includePersonal" 
                          checked={includePersonal}
                          onCheckedChange={setIncludePersonal}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="includeScores">Include Assessment Scores</Label>
                        <Switch 
                          id="includeScores" 
                          checked={includeScores}
                          onCheckedChange={setIncludeScores}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="includeTimeline">Include Session Timeline</Label>
                        <Switch 
                          id="includeTimeline" 
                          checked={includeTimeline}
                          onCheckedChange={setIncludeTimeline}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Export Format</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        onClick={handleExportCSV}
                        disabled={isExporting || !includePersonal}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Export as CSV'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        onClick={handleExportJSON}
                        disabled={isExporting || !includePersonal}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Export as JSON'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Import</CardTitle>
                <CardDescription>Import existing patient data : (Data must be in CSV format)
                  <ul className="list-disc list-outside ml-4 mt-2 space-y-1">
                    <li><b>To Import Patient data, enter a valid CSV file with the following columns:</b>  Hospital_patient_id, name, age, gender, caregiver_contact.<br/> Optional fields include: caregiver_name, date_of_birth, remarks, status(active/inactive) </li>
                    <li><b>To Import Patient data along with Assessment scores, enter a valid CSV file with the following columns:</b> Hospital_patient_id, total_score. <br/> Optional fields include iq_score, notes, risk_level(moderate/high/low)</li> 
                    <li><b>To Import Patient data along with Session History, enter a valid CSV file with the following columns:</b> Hospital_patient_id, session_date, session_notes. <br/> Optional fields include duration, session_status_type(scheduled/completed/cancelled)</li>
                    <li><b>To Import Patient data along with Assessment & Session history, enter a valid CSV file with the following columns:</b> Hospital_patient_id, name, age, gender, caregiver_contact, total_score, session_date, session_notes. <br/> Optional fields include as above of all files</li>
                  </ul>

                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">General Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoBackup">Automatic Data Backup</Label>
                        <Switch id="autoBackup" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <Switch id="emailNotifications" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="aiAnalysis">AI-Powered Analysis</Label>
                        <Switch id="aiAnalysis" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dataRetention">30-Day Data Retention</Label>
                        <Switch id="dataRetention" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Security Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                        <Switch id="twoFactor" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sessionTimeout">Auto Session Timeout</Label>
                        <Switch id="sessionTimeout" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auditLog">Audit Logging</Label>
                        <Switch id="auditLog" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dataEncryption">Data Encryption</Label>
                        <Switch id="dataEncryption" defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button className="w-full">
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}