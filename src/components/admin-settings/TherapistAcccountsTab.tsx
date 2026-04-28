import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Edit, Plus } from 'lucide-react';

export interface TherapistAccount {
  doctor_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  patients: number;
}

interface TherapistAcccountsTabProps {
  therapistAccounts: TherapistAccount[];
  onAddTherapist: () => void;
  onToggleStatus: (doctorId: string, currentStatus: string) => void;
}

export default function TherapistAcccountsTab({
  therapistAccounts,
  onAddTherapist,
  onToggleStatus,
}: TherapistAcccountsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Therapist Accounts</CardTitle>
            <CardDescription>Manage therapist status</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {therapistAccounts.map((therapist) => (
            <div key={therapist.doctor_id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>{therapist.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{therapist.name}</h4>
                  <p className="text-sm text-blue-600">{therapist.email}</p>
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
                  onCheckedChange={() => onToggleStatus(therapist.doctor_id, therapist.status)}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

