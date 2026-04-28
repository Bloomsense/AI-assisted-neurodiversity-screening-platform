import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export default function SystemSettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Doctor to Imported Patients</CardTitle>
        <CardDescription>
          This section is reserved for assigning doctors after patient imports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          You can add doctor-assignment workflow here when you are ready.
        </p>
        <Button variant="outline" disabled>
          Coming Soon
        </Button>
      </CardContent>
    </Card>
  );
}
