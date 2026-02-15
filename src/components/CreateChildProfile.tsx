import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Save, PlayCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';

export default function CreateChildProfile() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    childName: '',
    age: '',
    gender: '',
    contactInfo: '',
    caregiverName: '',
    caregiverPhone: '',
    remarks: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (startScreening = false) => {
    if (!formData.childName || !formData.age || !formData.caregiverName) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate age is a valid number
    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 18) {
      toast.error('Please enter a valid age (0-18 years)');
      return;
    }

    setIsSaving(true);

    try {
      // Prepare data for database
      const patientData = {
        name: formData.childName.trim(),
        age: ageNum,
        gender: formData.gender || null,
        caregiver_name: formData.caregiverName.trim(),
        caregiver_contact: formData.caregiverPhone.trim() || null,
        remarks: formData.remarks.trim() || null,
      };

      // Insert into Supabase patients table
      const { data, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();

      if (error) {
        console.error('Error saving patient:', error);
        toast.error(`Failed to save patient: ${error.message}`);
        setIsSaving(false);
        return;
      }

      if (!data || !data.id) {
        toast.error('Failed to save patient: No data returned');
        setIsSaving(false);
        return;
      }

      const childId = data.id;
      toast.success('Child profile created successfully');

      if (startScreening) {
        navigate(`/therapist/screening/${childId}`);
      } else {
        navigate(`/therapist/child/${childId}`);
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      toast.error(`Failed to save patient: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate('/therapist/dashboard')} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <img src={bloomSenseLogo} alt="BloomSense" className="h-8 w-8 mr-3" />
              <h1 className="text-2xl text-gray-900">Create Child Profile</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Child Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Child Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Child Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="childName">Child Name *</Label>
                  <Input
                    id="childName"
                    placeholder="Enter child's full name"
                    value={formData.childName}
                    onChange={(e) => handleInputChange('childName', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Age in years"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactInfo">Contact Information</Label>
                  <Input
                    id="contactInfo"
                    placeholder="Email or additional contact info"
                    value={formData.contactInfo}
                    onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                  />
                </div>
              </div>

              {/* Caregiver Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Caregiver Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="caregiverName">Caregiver Name *</Label>
                  <Input
                    id="caregiverName"
                    placeholder="Primary caregiver's name"
                    value={formData.caregiverName}
                    onChange={(e) => handleInputChange('caregiverName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caregiverPhone">Phone Number</Label>
                  <Input
                    id="caregiverPhone"
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={formData.caregiverPhone}
                    onChange={(e) => handleInputChange('caregiverPhone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Remarks Section */}
            <div className="space-y-2">
              <Label htmlFor="remarks">Initial Notes/Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Any initial observations, concerns, or relevant background information..."
                className="min-h-[100px]"
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                className="flex-1"
                onClick={() => handleSave(true)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Save & Start Screening
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleSave(false)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-gray-500 text-center">
              * Required fields. You can update this information at any time.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}