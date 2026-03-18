import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
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
  BarChart,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('therapists');
  const [includePersonal, setIncludePersonal] = useState(false); 
  const [includeScores, setIncludeScores] = useState(true);
  const [includeSession, setincludeSession] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [includePatientData, setIncludePatientData] = useState(false); 
  const [importType, setImportType] = useState<'patients' | 'patients_assessments' | 'patients_sessions' | 'patients_full'>('patients');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize CSV row keys (trim, lowercase, replace spaces with underscore)
  const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, '_');
  const getRow = (row: Record<string, string>, key: string) => {
    const k = Object.keys(row).find(k => normalizeKey(k) === normalizeKey(key));
    return k ? (row[k]?.trim() ?? '') : '';
  };

  const therapistAccounts = [
    {
      id: 1,
      name: 'Dr. Sarah Ahmed',
      email: 'sarah.ahmed@neurodetect.com',
      role: 'Senior Therapist',
      status: 'active',
      patients: 24,
      lastLogin: '2024-01-20'
    },
    {
      id: 2,
      name: 'Dr. Ali Hassan',
      email: 'ali.hassan@neurodetect.com',
      role: 'Therapist',
      status: 'active',
      patients: 18,
      lastLogin: '2024-01-19'
    },
    {
      id: 3,
      name: 'Dr. Fatima Khan',
      email: 'fatima.khan@neurodetect.com',
      role: 'Therapist',
      status: 'inactive',
      patients: 12,
      lastLogin: '2024-01-15'
    }
  ];

  const mchatQuestions = [
    'Does your child enjoy being swung, bounced on your knee, etc.?',
    'Does your child take an interest in other children?',
    'Does your child like climbing on things, such as up stairs?',
    'Does your child enjoy playing peek-a-boo/hide-and-seek?',
    'Does your child ever pretend, for example, to talk on the phone or take care of dolls?'
  ];

  const systemStats = {
    totalChildren: 156,
    totalTherapists: 8,
    totalCaregivers: 142,
    completedScreenings: 89,
    pendingAssessments: 23
  };

  // Fetch patient data from Supabase
  const fetchPatients = async () => {
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

    // Fetch assessment data from Supabase
    const fetchAssessments = async () => {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('patient_id, assessment_date, total_score, iq_score, risk_level, notes, last_updated');
  
        if (error) {
          throw error;
        }
  
        return data || [];
      } catch (error: any) {
        console.error('Error fetching assessment data:', error);
        throw new Error(`Failed to fetch assessment data: ${error.message}`);
      }
    };

    // Fetch session data from Supabase
    const fetchSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('patient_id, session_date, session_notes, duration, session_status, doctor_id, created_at');
  
        if (error) {
          throw error;
        }
  
        return data || [];
      } catch (error: any) {
        console.error('Error fetching session data:', error);
        throw new Error(`Failed to fetch session data: ${error.message}`);
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
    setIsExporting(true);
    try {
      const patients = await fetchPatients();
      if (patients.length === 0) { toast.warning('No patient data found.'); return; }
  
      const timestamp = new Date().toISOString().split('T')[0];
  
      // Strip personal info if toggle is off
      const patientsToExport = includePersonal
        ? patients
        : patients.map(({ name, contact, date_of_birth, ...rest }) => rest);
  
      // Always download patients CSV
      downloadFile(convertToCSV(patientsToExport), `patients_${timestamp}.csv`, 'text/csv');
  
      // If assessments toggle ON — download assessments CSV separately
      if (includeScores) {
        const assessments = await fetchAssessments();
        if (assessments.length > 0) {
          downloadFile(convertToCSV(assessments), `assessments_${timestamp}.csv`, 'text/csv');
        }
      }
  
      // If session toggle ON — download sessions CSV separately
      if (includeSession) {
        const sessions = await fetchSessions();
        if (sessions.length > 0) {
          downloadFile(convertToCSV(sessions), `sessions_${timestamp}.csv`, 'text/csv');
        }
      }
  
      toast.success(`CSV export complete. ${[true, includeScores, includeSession].filter(Boolean).length} file(s) downloaded.`);
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Build nested JSON structure merging all tables
const buildExportData = (patients: any[], assessments: any[], sessions: any[]) => {
  return patients.map(patient => {
    const patientExport: any = { ...patient };

    if (includeScores) {
      patientExport.assessments = assessments.filter(a => a.patient_id === patient.patient_id);
    }

    if (includeSession) {
      patientExport.sessions = sessions.filter(s => s.patient_id === patient.patient_id);
    }

    return patientExport;
  });
};

  // Export as JSON
  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const patients = await fetchPatients();
      if (patients.length === 0) { toast.warning('No patient data found.'); return; }
  
      const assessments = includeScores ? await fetchAssessments() : [];
      const sessions = includeSession ? await fetchSessions() : [];
  
      // Strip personal info if toggle is off
      const patientsToExport = includePersonal
        ? patients
        : patients.map(({ name, age,  date_of_birth, gender, caregiver_name, caregiver_contact, remarks, assigned_doctor_id, status, profile_created_date,  ...rest }) => rest);
  
      const exportData = buildExportData(patientsToExport, assessments, sessions);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(JSON.stringify(exportData, null, 2), `patients_export_${timestamp}.json`, 'application/json');
      toast.success(`Exported ${patients.length} patient records as JSON.`);
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
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

  // Data Import: parse CSV and validate required columns
  const parseCSVFile = (file: File): Promise<Record<string, string>[]> => {
    return new Promise((resolve, reject) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        reject(new Error('File must be a CSV (.csv)'));
        return;
      }
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(results.errors[0].message || 'CSV parse error'));
            return;
          }
          const rows = results.data as Record<string, string>[];
          if (!rows || rows.length === 0) {
            reject(new Error('CSV file is empty or has no data rows'));
            return;
          }
          resolve(rows);
        },
        error: (err) => reject(err),
      });
    });
  };

  const validateRequiredColumns = (
    rows: Record<string, string>[],
    required: string[],
    optional?: string[]
  ): string | null => {
    if (rows.length === 0) return 'No data rows';
    const first = rows[0];
    const keys = Object.keys(first).map(normalizeKey);
    for (const req of required) {
      const r = req.toLowerCase().replace(/\s+/g, '_');
      if (!keys.includes(r)) return `Missing required column: ${req}`;
    }
    return null;
  };

  const handleImportCSV = async (file: File) => {
    setIsImporting(true);
    try {
      const rows = await parseCSVFile(file);
      const type = importType;

      // Required columns per import type
      const patientsRequired = ['hospital_patient_id', 'name', 'age', 'gender', 'caregiver_contact'];
      const assessmentsRequired = ['hospital_patient_id', 'total_score'];
      const sessionsRequired = ['hospital_patient_id', 'session_date', 'session_notes'];
      const fullRequired = ['hospital_patient_id', 'name', 'age', 'gender', 'caregiver_contact', 'total_score', 'session_date', 'session_notes'];

      if (type === 'patients') {
        const err = validateRequiredColumns(rows, patientsRequired);
        if (err) { toast.error(err); return; }
      } else if (type === 'patients_assessments') {
        const err = validateRequiredColumns(rows, assessmentsRequired);
        if (err) { toast.error(err); return; }
      } else if (type === 'patients_sessions') {
        const err = validateRequiredColumns(rows, sessionsRequired);
        if (err) { toast.error(err); return; }
      } else {
        const err = validateRequiredColumns(rows, fullRequired);
        if (err) { toast.error(err); return; }
      }

      const hospitalIdToUuid = new Map<string, string>();

      // 1. Import patients (when type includes patient data)
      if (type === 'patients' || type === 'patients_full') {
        const seen = new Set<string>();
        const patientRows = type === 'patients_full'
          ? rows.filter((r) => {
              const hpId = getRow(r, 'hospital_patient_id');
              if (!hpId || seen.has(hpId)) return false;
              seen.add(hpId);
              return true;
            })
          : rows;

        for (const row of patientRows) {
          const hpId = getRow(row, 'hospital_patient_id');
          const age = parseInt(getRow(row, 'age'), 10);
          const p = {
            hospital_patient_id: hpId || null,
            name: getRow(row, 'name') || 'Unknown',
            age: isNaN(age) ? 0 : age,
            gender: getRow(row, 'gender') || null,
            caregiver_name: getRow(row, 'caregiver_name') || getRow(row, 'caregiver_contact') || 'N/A',
            caregiver_contact: getRow(row, 'caregiver_contact') || null,
            date_of_birth: getRow(row, 'date_of_birth') || null,
            remarks: getRow(row, 'remarks') || null,
            status: getRow(row, 'status') || 'active',
          };

          const { data, error } = await supabase
            .from('patients')
            .upsert(p, { onConflict: 'hospital_patient_id', ignoreDuplicates: false })
            .select('id, hospital_patient_id')
            .single();
          if (error) {
            const { data: inserted } = await supabase.from('patients').insert(p).select('id, hospital_patient_id').single();
            if (inserted && inserted.id && p.hospital_patient_id) {
              hospitalIdToUuid.set(p.hospital_patient_id, inserted.id);
            } else throw error;
          } else if (data?.id && p.hospital_patient_id) {
            hospitalIdToUuid.set(p.hospital_patient_id, data.id);
          }
        }
      }

      // 2. Build hospital_patient_id -> uuid map (for assessments/sessions - patients must exist)
      if (type === 'patients_assessments' || type === 'patients_sessions' || type === 'patients_full') {
        const { data: existing } = await supabase
          .from('patients')
          .select('id, hospital_patient_id')
          .not('hospital_patient_id', 'is', null);
        (existing || []).forEach((p: { id: string; hospital_patient_id: string }) => {
          hospitalIdToUuid.set(p.hospital_patient_id, p.id);
        });
      }

      // 3. Import assessments
      if (type === 'patients_assessments' || type === 'patients_full') {
        for (const row of rows) {
          const hpId = getRow(row, 'hospital_patient_id');
          const patientId = hospitalIdToUuid.get(hpId);
          if (!patientId) {
            toast.warning(`Skipping row: no patient found for hospital_patient_id "${hpId}"`);
            continue;
          }
          const totalScore = parseInt(getRow(row, 'total_score'), 10);
          if (isNaN(totalScore)) continue;

          const assessmentData: Record<string, unknown> = {
            patient_id: patientId,
            total_score: totalScore,
            iq_score: getRow(row, 'iq_score') ? parseInt(getRow(row, 'iq_score'), 10) : null,
            notes: getRow(row, 'notes') || null,
            risk_level: getRow(row, 'risk_level') || 'low',
            mchat_answers: {},
            mchat_questions: [],
            total_questions: 0,
            pass_count: 0,
            fail_count: 0,
            screen_positive: false,
          };
          const dob = getRow(row, 'date_of_birth') || getRow(row, 'assessment_date');
          if (dob) assessmentData.assessment_date = dob;

          const { error } = await supabase.from('assessments').insert(assessmentData);
          if (error) toast.error(`Assessment insert failed: ${error.message}`);
        }
      }

      // 4. Import sessions
      if (type === 'patients_sessions' || type === 'patients_full') {
        for (const row of rows) {
          const hpId = getRow(row, 'hospital_patient_id');
          const patientId = hospitalIdToUuid.get(hpId);
          if (!patientId) {
            toast.warning(`Skipping row: no patient found for hospital_patient_id "${hpId}"`);
            continue;
          }
          const sessionDate = getRow(row, 'session_date');
          const sessionNotes = getRow(row, 'session_notes');
          if (!sessionDate || !sessionNotes) continue;

          const sessionData = {
            patient_id: patientId,
            session_date: sessionDate,
            session_notes: sessionNotes,
            duration: getRow(row, 'duration') ? parseInt(getRow(row, 'duration'), 10) : null,
            session_status: getRow(row, 'session_status_type') || getRow(row, 'session_status') || null,
          };
          const { error } = await supabase.from('sessions').insert(sessionData);
          if (error) toast.error(`Session insert failed: ${error.message}`);
        }
      }

      toast.success(`Import complete. Processed ${rows.length} row(s).`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      toast.error(msg);
    } finally {
      setIsImporting(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImportCSV(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) handleImportCSV(file);
    else if (file) toast.error('Please select a CSV file.');
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

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
                  {therapistAccounts.map((therapist) => (
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
                  ))}
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
                  {mchatQuestions.map((question, index) => (
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
                  ))}
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
                        <Label htmlFor="includeSession">Include Session History</Label>
                        <Switch 
                          id="includeSession" 
                          checked={includeSession}
                          onCheckedChange={setincludeSession}
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
                <div className="mb-6 space-y-2 text-left">
                  <p className="font-medium text-sm text-gray-800">Select CSV Information Option: </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importType"
                        value="patients"
                        className="mt-1"
                        checked={importType === 'patients'}
                        onChange={() => setImportType('patients')}
                      />
                      <span>
                        <span className="font-semibold block">Patient data only</span>
                      </span>
                    </label>
                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importType"
                        value="patients_assessments"
                        className="mt-1"
                        checked={importType === 'patients_assessments'}
                        onChange={() => setImportType('patients_assessments')}
                      />
                      <span>
                        <span className="font-semibold block">Patients + Assessment scores</span>
                      </span>
                    </label>
                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importType"
                        value="patients_sessions"
                        className="mt-1"
                        checked={importType === 'patients_sessions'}
                        onChange={() => setImportType('patients_sessions')}
                      />
                      <span>
                        <span className="font-semibold block">Patients + Session history</span>
                      </span>
                    </label>
                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importType"
                        value="patients_full"
                        className="mt-1"
                        checked={importType === 'patients_full'}
                        onChange={() => setImportType('patients_full')}
                      />
                      <span>
                        <span className="font-semibold block">Patients + Assessments + Sessions</span>
                      </span>
                    </label>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={onFileChange}
                />
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                      <p className="text-gray-600">Importing...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Drag and drop a CSV file here, or click to browse</p>
                      <Button variant="outline" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose CSV File
                      </Button>
                    </>
                  )}
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