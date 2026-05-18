import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export interface TherapistAccount {
  employee_id: string;
  user_id?: string;
  name: string;
  email: string;
  role: string;
  status: string;
  patients: number;
  contact_number?: string;
  branch_name?: string;
  active_patients?: number;
  upcoming_sessions?: number;
  pending_assignments?: number;
  created_at?: string;
}

interface TherapistAcccountsTabProps {
  therapistAccounts: TherapistAccount[];
  onAddTherapist: () => void;
  onToggleStatus: (doctorId: string, currentStatus: string) => void;
  onLoadTherapistDetails: (employeeId: string) => Promise<TherapistAccount>;
  onSaveTherapistDetails: (employeeId: string, details: TherapistAccount) => Promise<void>;
}

const emptyDraft = (): TherapistAccount => ({
  employee_id: '',
  user_id: '',
  name: '',
  email: '',
  role: '',
  status: 'active',
  patients: 0,
  contact_number: '',
  branch_name: '',
  active_patients: 0,
  upcoming_sessions: 0,
  pending_assignments: 0,
  created_at: '',
});

export default function TherapistAcccountsTab({
  therapistAccounts,
  onToggleStatus,
  onLoadTherapistDetails,
  onSaveTherapistDetails,
}: TherapistAcccountsTabProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<TherapistAccount>(emptyDraft());
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openEditModal = async (therapist: TherapistAccount) => {
    setEditOpen(true);
    setIsLoadingDetails(true);
    setDraft({ ...therapist });
    try {
      const fresh = await onLoadTherapistDetails(therapist.employee_id);
      setDraft(fresh);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load therapist details');
      setEditOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (!editOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [editOpen]);

  const updateDraft = (key: keyof TherapistAccount, value: string | number) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!draft.employee_id || !draft.name.trim() || !draft.email.trim()) {
      toast.error('Name and email are required.');
      return;
    }
    if (!draft.contact_number?.trim() || !draft.role.trim() || !draft.branch_name?.trim()) {
      toast.error('Contact number, occupation, and branch name are required.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveTherapistDetails(draft.employee_id, {
        ...draft,
        name: draft.name.trim(),
        email: draft.email.trim(),
        role: draft.role.trim() || 'Therapist',
        contact_number: draft.contact_number.trim(),
        branch_name: draft.branch_name.trim(),
      });
      setEditOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save therapist details');
    } finally {
      setIsSaving(false);
    }
  };

  const editModalContent = (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            padding: '1rem',
          }}
          onClick={() => setEditOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '672px',
              maxHeight: '90vh',
              overflowY: "hidden",
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
              Edit Therapist Details
            </h3>
            <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#4b5563' }}>
              Update doctor profile fields in the database.
            </p>

            {isLoadingDetails ? (
              <div
                style={{
                  marginTop: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  color: '#4b5563',
                }}
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading therapist details...</span>
              </div>
            ) : (
            <div
              style={{
                marginTop: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
              }}
            >
              <div>
                <Label>Employee ID</Label>
                <Input value={draft.employee_id} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>User ID</Label>
                <Input value={draft.user_id || ''} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={draft.name}
                  disabled={isSaving}
                  onChange={(e) => updateDraft('name', e.target.value)}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={draft.email}
                  disabled={isSaving}
                  onChange={(e) => updateDraft('email', e.target.value)}
                />
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input
                  value={draft.contact_number || ''}
                  disabled={isSaving}
                  onChange={(e) => updateDraft('contact_number', e.target.value)}
                />
              </div>
              <div>
                <Label>Occupation</Label>
                <Input
                  value={draft.role}
                  disabled={isSaving}
                  onChange={(e) => updateDraft('role', e.target.value)}
                />
              </div>
              <div>
                <Label>Branch Name</Label>
                <Input
                  value={draft.branch_name || ''}
                  disabled={isSaving}
                  onChange={(e) => updateDraft('branch_name', e.target.value)}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#ffffff',
                  }}
                  value={draft.status}
                  disabled={isSaving}
                  onChange={(e) => updateDraft('status', e.target.value)}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Label>Created At</Label>
                <Input value={draft.created_at || ''} disabled className="bg-gray-50" />
              </div>
            </div>
            )}

            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
              }}
            >
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={isSaving || isLoadingDetails}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isLoadingDetails}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Therapist Accounts</CardTitle>
          <CardDescription>Manage therapist status and doctor profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {therapistAccounts.map((therapist) => (
              <div key={therapist.employee_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{therapist.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{therapist.name}</h4>
                    <p className="text-sm text-blue-600">{therapist.email}</p>
                    <p className="text-sm text-gray-500">
                      {therapist.role} • {therapist.patients} patients
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={therapist.status === 'active' ? 'default' : 'secondary'}>
                    {therapist.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Edit therapist details"
                    onClick={() => openEditModal(therapist)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={therapist.status === 'active'}
                    onCheckedChange={() => onToggleStatus(therapist.employee_id, therapist.status)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {editOpen && createPortal(editModalContent, document.body)}
    </>
  );
}