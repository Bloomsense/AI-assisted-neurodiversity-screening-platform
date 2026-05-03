import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { supabase } from '../../utils/supabase/client';
import { getApiBaseUrl } from '../../config';

type AssignmentRow = {
  patientId: string;
  patientName: string;
  currentDoctorId: string;
  currentDoctorName: string;
  nextDoctorId: string;
  nextDoctorName: string;
};

export default function SystemSettingsTab() {
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingPatientId, setSavingPatientId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    const loadRows = async () => {
      setIsLoading(true);
      try {
        const [patientsResult, doctorsResult] = await Promise.all([
          supabase
            .from('patients')
            .select('patient_id, name, assigned_doctor_id')
            .order('name', { ascending: true }),
          supabase.from('doctors').select('employee_id, name'),
        ]);

        if (patientsResult.error) throw patientsResult.error;
        if (doctorsResult.error) throw doctorsResult.error;

        const doctorsMap: Record<string, string> = {};
        (doctorsResult.data || []).forEach((d: any) => {
          const key = String(d.employee_id || '').trim();
          if (key) doctorsMap[key] = d.name || 'Unknown Doctor';
        });

        const nextRows: AssignmentRow[] = (patientsResult.data || []).map((p: any) => {
          const doctorId = String(p.assigned_doctor_id || '').trim();
          const doctorName = doctorId ? doctorsMap[doctorId] || 'Unknown Doctor' : 'Not Assigned';
          return {
            patientId: String(p.patient_id || ''),
            patientName: p.name || 'Unknown Patient',
            currentDoctorId: doctorId,
            currentDoctorName: doctorName,
            nextDoctorId: doctorId,
            nextDoctorName: doctorId ? doctorName : '',
          };
        });

        setRows(nextRows);
      } catch {
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRows();
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.patientName.toLowerCase().includes(q) ||
        r.patientId.toLowerCase().includes(q) ||
        r.currentDoctorId.toLowerCase().includes(q) ||
        r.currentDoctorName.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const updateRow = (patientId: string, key: 'nextDoctorId' | 'nextDoctorName', value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.patientId === patientId ? { ...r, [key]: value } : r))
    );
  };

  const applyUiUpdate = async (patientId: string) => {
    const row = rows.find((r) => r.patientId === patientId);
    if (!row) return;
    const doctorId = row.nextDoctorId.trim();
    const doctorName = row.nextDoctorName.trim();

    if (!doctorId || !doctorName) {
      setStatusMessage('Doctor ID and doctor name are both required.');
      return;
    }

    setSavingPatientId(patientId);
    setStatusMessage('');
    try {
      const base = getApiBaseUrl();
      const url = `${base}/api/patient-assignments/${encodeURIComponent(patientId)}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, doctorName }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to update assignment');
      }

      setRows((prev) =>
        prev.map((r) =>
          r.patientId === patientId
            ? {
                ...r,
                currentDoctorId: doctorId,
                currentDoctorName: doctorName,
              }
            : r
        )
      );
      setStatusMessage(`Updated assignment for patient ${row.patientName}.`);
    } catch (error: any) {
      setStatusMessage(error?.message || 'Failed to update assignment');
    } finally {
      setSavingPatientId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign / Reassign Doctor to Patients</CardTitle>
        <CardDescription>
          Enter doctor ID and name, then update assignment. Doctor is validated before saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusMessage ? <p className="text-sm text-gray-700">{statusMessage}</p> : null}
        <div className="max-w-md">
          <Label htmlFor="assign-search" className="py-2">Search Patients / Doctors</Label>
          <Input
            id="assign-search"
            placeholder="Search by patient name, patient ID, doctor ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-600">Loading assignments...</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-sm text-gray-600">No patient assignments found.</p>
        ) : (
          <div className="space-y-3">
            {filteredRows.map((row) => (
              <div key={row.patientId} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{row.patientName}</span>
                  <span className="text-xs text-gray-500">Patient ID: {row.patientId}</span>
                </div>
                <p className="text-sm text-gray-600">
                  Current doctor: <span className="font-medium">{row.currentDoctorName}</span> ({row.currentDoctorId || 'Not Assigned'})
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>New Doctor ID</Label>
                    <Input
                      placeholder="e.g. EMP-102"
                      value={row.nextDoctorId}
                      onChange={(e) => updateRow(row.patientId, 'nextDoctorId', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>New Doctor Name</Label>
                    <Input
                      placeholder="e.g. Dr. Sarah Ahmed"
                      value={row.nextDoctorName}
                      onChange={(e) => updateRow(row.patientId, 'nextDoctorName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => applyUiUpdate(row.patientId)}
                    disabled={savingPatientId === row.patientId}
                  >
                    {savingPatientId === row.patientId ? 'Updating...' : 'Update Assignment'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
