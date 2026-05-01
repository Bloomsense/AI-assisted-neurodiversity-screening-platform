import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Database, Download, Loader2, Upload } from 'lucide-react';

type ImportType = 'patients' | 'patients_assessments' | 'patients_sessions' | 'patients_full';

interface DataManagementTabProps {
  includePersonal: boolean;
  includeScores: boolean;
  includeSession: boolean;
  isExporting: boolean;
  importType: ImportType;
  isImporting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onIncludePersonalChange: (value: boolean) => void;
  onIncludeScoresChange: (value: boolean) => void;
  onIncludeSessionChange: (value: boolean) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportTypeChange: (value: ImportType) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
}

export default function DataManagementTab({
  includePersonal,
  includeScores,
  includeSession,
  isExporting,
  importType,
  isImporting,
  fileInputRef,
  onIncludePersonalChange,
  onIncludeScoresChange,
  onIncludeSessionChange,
  onExportCSV,
  onExportJSON,
  onImportTypeChange,
  onFileChange,
  onDrop,
  onDragOver,
}: DataManagementTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" /> Data Export
          </CardTitle>
          <CardDescription>Export Patient data for data backups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Data Export Options</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="includePersonal">Include Personal Information</Label>
                  <Switch id="includePersonal" checked={includePersonal} onCheckedChange={onIncludePersonalChange} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeScores">Include Assessment Scores</Label>
                  <Switch id="includeScores" checked={includeScores} onCheckedChange={onIncludeScoresChange} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeSession">Include Session History</Label>
                  <Switch id="includeSession" checked={includeSession} onCheckedChange={onIncludeSessionChange} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Export Format</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={onExportCSV}
                  disabled={isExporting || !includePersonal}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export as CSV'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={onExportJSON}
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
          <CardDescription>
            Import existing patient data into the BloomSense Database: (Data must be in CSV format)
            <ul className="list-disc list-outside ml-4 mt-2 space-y-1">
              <li><b>Enter a valid CSV file with the following columns:</b> patient_id, name, age, gender, caregiver_contact.</li>
              <li> Optional fields include: caregiver_name,caregiver_contact,assigned_doctor_id, date_of_birth, remarks, status(active/inactive)</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent>

          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
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
    </>
  );
}
