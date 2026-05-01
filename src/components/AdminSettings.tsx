import React, { useState, useRef, useEffect } from 'react';
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
import { ArrowLeft, Users, Settings, 
        Download, Upload,Plus,Trash2,Edit,Shield,
        Database,FileText,BarChart,Loader2 
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';
import { getApiBaseUrl } from '../config';
import TherapistAcccountsTab from './admin-settings/TherapistAcccountsTab';
import AssessmentToolsTab from './admin-settings/AssessmentToolsTab';
import DataManagementTab from './admin-settings/DataManagementTab';
import SystemSettingsTab from './admin-settings/SystemSettingsTab';
import type { TherapistAccount } from './admin-settings/TherapistAcccountsTab';

interface QuestionnaireQuestion {
  id: string;
  text: string;
  score: number;
  isCritical: boolean;
}

interface Questionnaire {
  id: string;
  name: string;
  description?: string;
  questions: QuestionnaireQuestion[];
}

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

  const confirmDelete = () => window.confirm('Are you sure you want to delete this item');

  // Normalize CSV row keys (trim, lowercase, replace spaces with underscore)
  const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, '_');
  const getRow = (row: Record<string, string>, key: string) => {
    const k = Object.keys(row).find(k => normalizeKey(k) === normalizeKey(key));
    return k ? (row[k]?.trim() ?? '') : '';
  };

  const [therapistAccounts, setTherapistAccounts] = useState<TherapistAccount[]>([]);

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState('');
  const [newQuestionnaireName, setNewQuestionnaireName] = useState('');
  const [newQuestionnaireDescription, setNewQuestionnaireDescription] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionScore, setNewQuestionScore] = useState('1');
  const [newQuestionCritical, setNewQuestionCritical] = useState(false);
  const [isLoadingQuestionnaires, setIsLoadingQuestionnaires] = useState(false);
  const [totalChildren, setTotalChildren] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetLabel, setConfirmTargetLabel] = useState('');
  const [pendingDeleteType, setPendingDeleteType] = useState<'questionnaire' | 'question' | null>(null);
  const [pendingDeleteQuestionnaireId, setPendingDeleteQuestionnaireId] = useState<string | null>(null);
  const [pendingDeleteQuestionId, setPendingDeleteQuestionId] = useState<string | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
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

  const mapTherapist = (row: any): TherapistAccount => ({
    employee_id: String(row.employee_id || ''),
    name: row.name || 'Unknown',
    email: row.email || 'N/A',
    role: row.occupation || 'Therapist',
    status: row.status || 'active',
    patients: row.active_patients || 0,
  });

  const fetchTherapists = async () => {
    try {
      const result = await assessmentToolsRequest<any[]>('/api/therapists');
      const rows = Array.isArray(result.data) ? result.data : [];
      const mapped = rows.map(mapTherapist);

      // Keep patient numbers accurate by counting assignments from patients table.
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('assigned_doctor_id');
      if (patientsError) throw patientsError;

      const patientCounts: Record<string, number> = {};
      (patientsData || []).forEach((p: any) => {
        const key = String( p.assigned_doctor_id || '').trim();
        if (!key) return;
        patientCounts[key] = (patientCounts[key] || 0) + 1;
      });

      setTherapistAccounts(
        mapped.map((t) => ({
          ...t,
          patients: patientCounts[t.employee_id] ?? t.patients ?? 0,
        }))
      );
    } catch (error: any) {
      toast.error(`Failed to load therapist accounts: ${error.message}`);
    }
  };

  const fetchTotalChildren = async () => {
    try {
      const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      setTotalChildren(count ?? 0);
    } catch (error: any) {
      toast.error(`Failed to load patient count: ${error.message}`);
      setTotalChildren(0);
    }
  };

  const handleAddTherapist = () => {
    toast.info('Add therapist form will be added next.');
  };

  const handleToggleStatus = async (employeeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await assessmentToolsRequest(`/api/therapists/${employeeId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setTherapistAccounts((prev) =>
        prev.map((t) => (t.employee_id === employeeId ? { ...t, status: newStatus } : t))
      );
      toast.success(`Therapist status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(`Failed to update therapist status: ${error.message}`);
    }
  };

  type AssessmentToolsOk<T = unknown> = { success: true; data?: T };

  const assessmentToolsRequest = async <T = unknown>(
    endpoint: string,
    options?: RequestInit
  ): Promise<AssessmentToolsOk<T>> => {
    const base = getApiBaseUrl();
    const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const text = await response.text();
    const trimmed = text.trim();
    const looksJson =
      contentType.includes('application/json') ||
      contentType.includes('+json') ||
      trimmed.startsWith('{') ||
      trimmed.startsWith('[');

    if (!looksJson) {
      if (trimmed.startsWith('<')) {
        throw new Error(
          `HTTP ${response.status}: received HTML instead of JSON. Start the API (e.g. \`npm run dev:api\` on port 3001) and use Vite on 5173 so /api is proxied, or set VITE_API_BASE_URL to your deployed API.`
        );
      }
      if (!trimmed) {
        throw new Error(
          `HTTP ${response.status}: empty response (is the API running on port 3001 and Vite proxying /api?).`
        );
      }
      throw new Error(`HTTP ${response.status}: ${trimmed.slice(0, 200)}`);
    }

    let result: { success?: boolean; error?: string; data?: T };
    try {
      result = JSON.parse(text) as typeof result;
    } catch {
      throw new Error(`HTTP ${response.status}: response is not valid JSON.`);
    }
    if (!response.ok || !result?.success) {
      throw new Error(result?.error || 'Assessment tools request failed');
    }
    return result as AssessmentToolsOk<T>;
  };

  const fetchQuestionnaires = async () => {
    setIsLoadingQuestionnaires(true);
    try {
      const result = await assessmentToolsRequest<any[]>('/api/assessment-tools/questionnaires');
      const rows = Array.isArray(result.data) ? result.data : [];
      const mappedQuestionnaires: Questionnaire[] = rows.map((q: any) => ({
        id: q.id,
        name: q.name || 'Untitled Questionnaire',
        description: q.description || '',
        questions: (q.questions || []).map((question: any) => ({
          id: question.question_id,
          text: question.question_text || '',
          score: question.max_score ?? 0,
          isCritical: !!question.critical_item,
        })),
      }));

      setQuestionnaires(mappedQuestionnaires);
      if (mappedQuestionnaires.length > 0) {
        setSelectedQuestionnaireId((prev) =>
          mappedQuestionnaires.some((q) => q.id === prev) ? prev : mappedQuestionnaires[0].id
        );
      } else {
        setSelectedQuestionnaireId('');
      }
    } catch (error: any) {
      toast.error(`Failed to load questionnaires: ${error.message}`);
    } finally {
      setIsLoadingQuestionnaires(false);
    }
  };

  useEffect(() => {
    fetchQuestionnaires();
    fetchTherapists();
    fetchTotalChildren();
  }, []);

  const systemStats = {
    totalChildren,
    totalTherapists: therapistAccounts.length,
    totalQuestionaires: questionnaires.length,
  };

  const selectedQuestionnaire = questionnaires.find((q) => q.id === selectedQuestionnaireId) || null;

  const handleAddQuestionnaire = async () => {
    const trimmed = newQuestionnaireName.trim();
    if (!trimmed) {
      toast.error('Please enter a questionnaire name.');
      return;
    }

    const exists = questionnaires.some((q) => q.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.error('A questionnaire with this name already exists.');
      return;
    }

    try {
      const code = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const result = await assessmentToolsRequest<{ id: string }>('/api/assessment-tools/questionnaires', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmed,
          description: newQuestionnaireDescription.trim() || null,
          code: code || null,
        }),
      });

      setNewQuestionnaireName('');
      setNewQuestionnaireDescription('');
      toast.success('Questionnaire added.');
      await fetchQuestionnaires();
      if (result.data?.id) setSelectedQuestionnaireId(result.data.id);
    } catch (error: any) {
      toast.error(`Failed to add questionnaire: ${error.message}`);
    }
  };

  const performDeleteQuestionnaire = async (questionnaireId: string) => {
    const target = questionnaires.find((q) => q.id === questionnaireId);
    if (!target) return;

    try {
      await assessmentToolsRequest(`/api/assessment-tools/questionnaires/${questionnaireId}`, {
        method: 'DELETE',
      });

      toast.success(`Deleted questionnaire "${target.name}".`);
      await fetchQuestionnaires();
    } catch (error: any) {
      toast.error(`Failed to delete questionnaire: ${error.message}`);
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedQuestionnaireId) {
      toast.error('Please select a questionnaire first.');
      return;
    }

    const questionText = newQuestionText.trim();
    if (!questionText) {
      toast.error('Please enter a question.');
      return;
    }

    const score = parseInt(newQuestionScore, 10);
    if (Number.isNaN(score) || score < 0) {
      toast.error('Please provide a valid non-negative score.');
      return;
    }

    try {
      await assessmentToolsRequest('/api/assessment-tools/questions', {
        method: 'POST',
        body: JSON.stringify({
          questionnaires_id: selectedQuestionnaireId,
          question_text: questionText,
          max_score: score,
          critical_item: newQuestionCritical,
        }),
      });

      setNewQuestionText('');
      setNewQuestionScore('1');
      setNewQuestionCritical(false);
      toast.success('Question added.');
      await fetchQuestionnaires();
    } catch (error: any) {
      toast.error(`Failed to add question: ${error.message}`);
    }
  };

  const performDeleteQuestion = async (questionId: string) => {
    try {
      await assessmentToolsRequest(`/api/assessment-tools/questions/${questionId}`, {
        method: 'DELETE',
      });

      toast.success('Question removed.');
      await fetchQuestionnaires();
    } catch (error: any) {
      toast.error(`Failed to remove question: ${error.message}`);
    }
  };

  const handleDeleteQuestionnaire = (questionnaireId: string) => {
    const target = questionnaires.find((q) => q.id === questionnaireId);
    if (!target) return;
    setPendingDeleteType('questionnaire');
    setPendingDeleteQuestionnaireId(questionnaireId);
    setPendingDeleteQuestionId(null);
    setConfirmTargetLabel(target.name || 'this questionnaire');
    setConfirmOpen(true);
  };

  const handleDeleteQuestion = (questionnaireId: string, questionId: string) => {
    const questionnaire = questionnaires.find((q) => q.id === questionnaireId);
    const question = questionnaire?.questions.find((q) => q.id === questionId);
    setPendingDeleteType('question');
    setPendingDeleteQuestionnaireId(questionnaireId);
    setPendingDeleteQuestionId(questionId);
    setConfirmTargetLabel(question?.text || 'this question');
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!pendingDeleteType) return;

    const deleteType = pendingDeleteType;
    const questionnaireId = pendingDeleteQuestionnaireId;
    const questionId = pendingDeleteQuestionId;

    // Close immediately to avoid UI lock while network request runs.
    setConfirmOpen(false);
    setPendingDeleteType(null);
    setPendingDeleteQuestionnaireId(null);
    setPendingDeleteQuestionId(null);
    setIsDeletingItem(true);

    try {
      if (deleteType === 'questionnaire' && questionnaireId) {
        await performDeleteQuestionnaire(questionnaireId);
      } else if (deleteType === 'question' && questionId) {
        await performDeleteQuestion(questionId);
      }
    } finally {
      setIsDeletingItem(false);
    }
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
      const result = await assessmentToolsRequest<{
        importedPatients: number;
        importedAssessments: number;
        importedSessions: number;
        skippedRows: number;
      }>('/api/data-import', {
        method: 'POST',
        body: JSON.stringify({
          importType,
          rows,
        }),
      });

      const importedPatients = result.data?.importedPatients ?? 0;
      const importedAssessments = result.data?.importedAssessments ?? 0;
      const importedSessions = result.data?.importedSessions ?? 0;
      const skippedRows = result.data?.skippedRows ?? 0;
      const totalImported = importedPatients + importedAssessments + importedSessions;

      if (totalImported === 0) {
        toast.error('Import failed. No records were inserted.');
      } else {
        toast.success(
          `Import complete. Inserted ${importedPatients} patient(s), ${importedAssessments} assessment(s), ${importedSessions} session(s).` +
            (skippedRows > 0 ? ` Skipped ${skippedRows} row(s).` : '')
        );
      }
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <p className="text-sm text-gray-600">Total Questionaires</p>
                  <p className="text-2xl font-bold">{systemStats.totalQuestionaires}</p>
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
            <TabsTrigger value="system">Assign/Reassign Doctor to Patients</TabsTrigger>
          </TabsList>

          <TabsContent value="therapists" className="space-y-6">
            <TherapistAcccountsTab
              therapistAccounts={therapistAccounts}
              onAddTherapist={handleAddTherapist}
              onToggleStatus={handleToggleStatus}
            />
          </TabsContent>

          <TabsContent value="checklists" className="space-y-6">
            <AssessmentToolsTab
              questionnaires={questionnaires}
              selectedQuestionnaireId={selectedQuestionnaireId}
              newQuestionnaireName={newQuestionnaireName}
              newQuestionnaireDescription={newQuestionnaireDescription}
              newQuestionText={newQuestionText}
              newQuestionScore={newQuestionScore}
              newQuestionCritical={newQuestionCritical}
              isLoadingQuestionnaires={isLoadingQuestionnaires}
              onSelectedQuestionnaireChange={setSelectedQuestionnaireId}
              onNewQuestionnaireNameChange={setNewQuestionnaireName}
              onNewQuestionnaireDescriptionChange={setNewQuestionnaireDescription}
              onNewQuestionTextChange={setNewQuestionText}
              onNewQuestionScoreChange={setNewQuestionScore}
              onNewQuestionCriticalChange={setNewQuestionCritical}
              onAddQuestionnaire={handleAddQuestionnaire}
              onDeleteQuestionnaire={handleDeleteQuestionnaire}
              onAddQuestion={handleAddQuestion}
              onDeleteQuestion={handleDeleteQuestion}
            />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <DataManagementTab
              includePersonal={includePersonal}
              includeScores={includeScores}
              includeSession={includeSession}
              isExporting={isExporting}
              importType={importType}
              isImporting={isImporting}
              fileInputRef={fileInputRef}
              onIncludePersonalChange={setIncludePersonal}
              onIncludeScoresChange={setIncludeScores}
              onIncludeSessionChange={setincludeSession}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
              onImportTypeChange={setImportType}
              onFileChange={onFileChange}
              onDrop={onDrop}
              onDragOver={onDragOver}
            />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
          onClick={() => {
            if (!isDeletingItem) setConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">Confirm deletion</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              This will permanently delete "{confirmTargetLabel}". This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={isDeletingItem}
                className="min-w-24"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirmDelete}
                disabled={isDeletingItem}
                className="min-w-24"
              >
                {isDeletingItem ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}