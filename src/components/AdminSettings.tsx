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

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState('');
  const [newQuestionnaireName, setNewQuestionnaireName] = useState('');
  const [newQuestionnaireDescription, setNewQuestionnaireDescription] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionScore, setNewQuestionScore] = useState('1');
  const [newQuestionCritical, setNewQuestionCritical] = useState(false);
  const [isLoadingQuestionnaires, setIsLoadingQuestionnaires] = useState(false);

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
  }, []);

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

  const handleDeleteQuestionnaire = async (questionnaireId: string) => {
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

  const handleDeleteQuestion = async (questionnaireId: string, questionId: string) => {
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
      let importedPatients = 0;
      let importedAssessments = 0;
      let importedSessions = 0;
      let skippedRows = 0;
      const importErrors: string[] = [];

      // Required columns per import type
      const patientsRequired = ['patient_id', 'name', 'age', 'gender', 'caregiver_contact'];
      const assessmentsRequired = ['patient_id', 'total_score'];
      const sessionsRequired = ['patient_id', 'session_date', 'session_notes'];
      const fullRequired = ['patient_id', 'name', 'age', 'gender', 'caregiver_contact', 'total_score', 'session_date', 'session_notes'];

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
              const hpId = getRow(r, 'patient_id');
              if (!hpId || seen.has(hpId)) return false;
              seen.add(hpId);
              return true;
            })
          : rows;

        for (const row of patientRows) {
          const hpId = getRow(row, 'patient_id');
          const age = parseInt(getRow(row, 'age'), 10);
          const p = {
            patient_id: hpId || null,
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
            .upsert(p, { onConflict: 'patient_id', ignoreDuplicates: false })
            .select('id, patient_id')
            .single();
          if (error) {
            const { data: inserted, error: insertError } = await supabase
              .from('patients')
              .insert(p)
              .select('id, patient_id')
              .single();
            if (inserted && inserted.id && p.patient_id) {
              hospitalIdToUuid.set(p.patient_id, inserted.id);
              importedPatients += 1;
            } else {
              importErrors.push(insertError?.message || error.message);
            }
          } else if (data?.id && p.patient_id) {
            hospitalIdToUuid.set(p.patient_id, data.id);
            importedPatients += 1;
          }
        }
      }

      // 2. Build patient_id -> uuid map (for assessments/sessions - patients must exist)
      if (type === 'patients_assessments' || type === 'patients_sessions' || type === 'patients_full') {
        const { data: existing } = await supabase
          .from('patients')
          .select('id, patient_id')
          .not('patient_id', 'is', null);
        (existing || []).forEach((p: { id: string; patient_id: string }) => {
          hospitalIdToUuid.set(p.patient_id, p.id);
        });

        // Auto-create missing patients so assessment/session rows can still be imported.
        const uniqueHospitalIds = new Set(rows.map((r) => getRow(r, 'patient_id')).filter(Boolean));
        for (const hpId of uniqueHospitalIds) {
          if (hospitalIdToUuid.has(hpId)) continue;

          const sourceRow = rows.find((r) => getRow(r, 'patient_id') === hpId);
          const fallbackAge = sourceRow ? parseInt(getRow(sourceRow, 'age'), 10) : NaN;
          const fallbackPatient = {
            patient_id: hpId,
            name: sourceRow ? getRow(sourceRow, 'name') || `Patient ${hpId}` : `Patient ${hpId}`,
            age: isNaN(fallbackAge) ? 0 : fallbackAge,
            gender: sourceRow ? getRow(sourceRow, 'gender') || null : null,
            caregiver_name: sourceRow ? getRow(sourceRow, 'caregiver_name') || getRow(sourceRow, 'caregiver_contact') || 'N/A' : 'N/A',
            caregiver_contact: sourceRow ? getRow(sourceRow, 'caregiver_contact') || null : null,
            date_of_birth: sourceRow ? getRow(sourceRow, 'date_of_birth') || null : null,
            remarks: sourceRow ? getRow(sourceRow, 'remarks') || 'Auto-created during CSV import' : 'Auto-created during CSV import',
            status: sourceRow ? getRow(sourceRow, 'status') || 'active' : 'active',
          };

          const { data: created, error: createErr } = await supabase
            .from('patients')
            .upsert(fallbackPatient, { onConflict: 'patient_id', ignoreDuplicates: false })
            .select('id, patient_id')
            .single();

          if (createErr || !created?.id) {
            importErrors.push(`Patient auto-create for patient_id "${hpId}" failed: ${createErr?.message || 'Unknown error'}`);
            continue;
          }

          hospitalIdToUuid.set(hpId, created.id);
          importedPatients += 1;
        }
      }

      // 3. Import assessments
      if (type === 'patients_assessments' || type === 'patients_full') {
        for (const row of rows) {
          const hpId = getRow(row, 'patient_id');
          const patientId = hospitalIdToUuid.get(hpId);
          if (!patientId) {
            skippedRows += 1;
            continue;
          }
          const totalScore = parseInt(getRow(row, 'total_score'), 10);
          if (isNaN(totalScore)) {
            skippedRows += 1;
            continue;
          }

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
          if (error) {
            importErrors.push(`Assessment for patient_id "${hpId}": ${error.message}`);
          } else {
            importedAssessments += 1;
          }
        }
      }

      // 4. Import sessions
      if (type === 'patients_sessions' || type === 'patients_full') {
        for (const row of rows) {
          const hpId = getRow(row, 'patient_id');
          const patientId = hospitalIdToUuid.get(hpId);
          if (!patientId) {
            skippedRows += 1;
            continue;
          }
          const sessionDate = getRow(row, 'session_date');
          const sessionNotes = getRow(row, 'session_notes');
          if (!sessionDate || !sessionNotes) {
            skippedRows += 1;
            continue;
          }

          const sessionData = {
            patient_id: patientId,
            session_date: sessionDate,
            session_notes: sessionNotes,
            duration: getRow(row, 'duration') ? parseInt(getRow(row, 'duration'), 10) : null,
            session_status: getRow(row, 'session_status_type') || getRow(row, 'session_status') || null,
          };
          const { error } = await supabase.from('sessions').insert(sessionData);
          if (error) {
            importErrors.push(`Session for patient_id "${hpId}": ${error.message}`);
          } else {
            importedSessions += 1;
          }
        }
      }

      const totalImported = importedPatients + importedAssessments + importedSessions;
      if (totalImported === 0) {
        const firstError = importErrors[0];
        toast.error(firstError ? `Import failed. ${firstError}` : 'Import failed. No records were inserted.');
      } else {
        toast.success(
          `Import complete. Inserted ${importedPatients} patient(s), ${importedAssessments} assessment(s), ${importedSessions} session(s).` +
          (skippedRows > 0 ? ` Skipped ${skippedRows} row(s).` : '')
        );
      }
      if (importErrors.length > 0) {
        console.error('CSV import errors:', importErrors);
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
            <TabsTrigger value="system">Assign Doctor to Imported Patients</TabsTrigger>
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
                <CardTitle>Questionnaire Management</CardTitle>
                <CardDescription>Add questionnaire names, then manage questions with score and critical-item flags</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="New questionnaire name"
                      value={newQuestionnaireName}
                      onChange={(e) => setNewQuestionnaireName(e.target.value)}
                    />
                    <Input
                      placeholder="Questionnaire details/description"
                      value={newQuestionnaireDescription}
                      onChange={(e) => setNewQuestionnaireDescription(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleAddQuestionnaire}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Questionnaire
                    </Button>
                  </div>

                  {questionnaires.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="questionnaireSelect">Select Questionnaire</Label>
                      <div className="flex gap-2">
                        <select
                          id="questionnaireSelect"
                          className="w-full border rounded-md px-3 py-2 bg-white"
                          value={selectedQuestionnaireId}
                          onChange={(e) => setSelectedQuestionnaireId(e.target.value)}
                        >
                          {questionnaires.map((questionnaire) => (
                            <option key={questionnaire.id} value={questionnaire.id}>
                              {questionnaire.name}
                            </option>
                          ))}
                        </select>
                        {selectedQuestionnaire && (
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => handleDeleteQuestionnaire(selectedQuestionnaire.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Trash2 className="h-4 w-4" />

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="md:col-span-2">
                      <Label htmlFor="newQuestion">Question</Label>
                      <Input
                        id="newQuestion"
                        placeholder="Enter question text"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="questionScore">Score</Label>
                      <Input
                        id="questionScore"
                        type="number"
                        min="0"
                        value={newQuestionScore}
                        onChange={(e) => setNewQuestionScore(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between border rounded-md px-3 py-2 h-10">
                      <Label htmlFor="criticalItem" className="text-sm">Critical Item</Label>
                      <Switch
                        id="criticalItem"
                        checked={newQuestionCritical}
                        onCheckedChange={setNewQuestionCritical}
                      />
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" onClick={handleAddQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>

                  {selectedQuestionnaire && (
                    <div className="space-y-2">
                      <h4 className="font-medium">{selectedQuestionnaire.name} Questions</h4>
                      {selectedQuestionnaire.description && (
                        <p className="text-sm text-gray-600">{selectedQuestionnaire.description}</p>
                      )}
                      {selectedQuestionnaire.questions.length === 0 ? (
                        <p className="text-sm text-gray-500">No questions added yet.</p>
                      ) : (
                        selectedQuestionnaire.questions.map((question, index) => (
                          <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium">Question {index + 1}</p>
                              <p className="text-sm text-gray-700">{question.text}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Score: {question.score} | Critical Item: {question.isCritical ? 'True' : 'False'}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(selectedQuestionnaire.id, question.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {!isLoadingQuestionnaires && questionnaires.length === 0 && (
                    <p className="text-sm text-gray-500">No questionnaires found in Supabase. Add one to begin.</p>
                  )}
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
                    
                    <li><b>To Import Patient data, enter a valid CSV file with the following columns:</b>  patient_id, name, age, gender, caregiver_contact.<br/> Optional fields include: caregiver_name, date_of_birth, remarks, status(active/inactive) </li>
                    <li><b>To Import Patient data along with Assessment scores, enter a valid CSV file with the following columns:</b> patient_id, total_score. <br/> Optional fields include iq_score, notes, risk_level(moderate/high/low)</li> 
                    <li><b>To Import Patient data along with Session History, enter a valid CSV file with the following columns:</b> patient_id, session_date, session_notes. <br/> Optional fields include duration, session_status_type(scheduled/completed/cancelled)</li>
                    <li><b>To Import Patient data along with Assessment & Session history, enter a valid CSV file with the following columns:</b> patient_id, name, age, gender, caregiver_contact, total_score, session_date, session_notes. <br/> Optional fields include as above of all files</li>
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
        </Tabs>
      </div>
    </div>
  );
}