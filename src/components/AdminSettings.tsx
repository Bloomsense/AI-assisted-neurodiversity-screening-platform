import React, { useState } from 'react';
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

export default function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('therapists');

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

  const handleExportData = () => {
    toast.success('Data export initiated. You will receive an email when ready.');
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
                  <Database className="h-5 w-5 mr-2" />
                  Data Export & Research
                </CardTitle>
                <CardDescription>
                  Export anonymized data for research and policy development
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Data Export Options</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="includePersonal">Include Personal Information</Label>
                        <Switch id="includePersonal" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="includeScores">Include Assessment Scores</Label>
                        <Switch id="includeScores" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="includeTimeline">Include Session Timeline</Label>
                        <Switch id="includeTimeline" defaultChecked />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Export Format</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as CSV
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as JSON
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Research Report
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Import</CardTitle>
                <CardDescription>Import assessment data from external sources</CardDescription>
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