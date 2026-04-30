import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import { upsertDoctorRow } from '../utils/doctorProfile';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [hospitalEmail, setHospitalEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [hospitalBranch, setHospitalBranch] = useState('');
  const [occupation, setOccupation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const formatCNIC = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXXXX-XXXXXXX-X
    if (digits.length <= 5) {
      return digits;
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    }
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNIC(e.target.value);
    setCnic(formatted);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: hospitalEmail,
      password,
      options: {
        data: {
          fullName,
          employeeId,
          contactNumber,
          cnic,
          occupation,
          hospitalBranch,
          role: 'therapist',
        },
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    const authUser = data.user ?? data.session?.user ?? null;
    if (authUser) {
      const { error: profileError } = await upsertDoctorRow(authUser);
      if (profileError) {
        toast.warning(
          'Account created, but saving therapist profile failed. Run supabase/migrations/auth_profile_sync.sql and sign in again.'
        );
      }
    }

    toast.success('Registration successful. Please check your email to confirm.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={bloomSenseLogo} alt="BloomSense" className="h-12 w-12 mr-3" />
            <h1 className="text-3xl text-gray-900">BloomSense</h1>
          </div>
          <p className="text-gray-600">
            Create your therapist account
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>
              Register as a new therapist to access BloomSense
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* EmployeeId */}
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee Id *</Label>
                  <Input
                    id="employeeId"
                    type="text"
                    placeholder='Enter your Hosiptal Id'
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                  />
                </div>

                {/* Contact Number */}
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    placeholder="03XX-XXXXXXX"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                  />
                </div>

                {/* Hospital Email Address */}
                <div className="space-y-2">
                  <Label htmlFor="hospitalEmail">Hospital Email Address *</Label>
                  <Input
                    id="hospitalEmail"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={hospitalEmail}
                    onChange={(e) => setHospitalEmail(e.target.value)}
                    required
                  />
                </div>

                {/* CNIC Number */}
                <div className="space-y-2">
                  <Label htmlFor="cnic">CNIC No *</Label>
                  <Input
                    id="cnic"
                    type="text"
                    placeholder="XXXXX-XXXXXXX-X"
                    value={cnic}
                    onChange={handleCnicChange}
                    maxLength={15}
                    required
                  />
                </div>

                {/* Occupation */}
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation *</Label>
                  <Input
                    id="occupation"
                    type="text"
                    placeholder="e.g., Pediatric Therapist"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    required
                  />
                </div>

                {/* Hospital branch */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hospitalBranch">Hospital branch *</Label>
                  <Input
                    id="hospitalBranch"
                    type="text"
                    placeholder="e.g. Main campus, North wing ,Clifton Branch"
                    value={hospitalBranch}
                    onChange={(e) => setHospitalBranch(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <Button type="submit" className="w-full bg-[#20B2AA] hover:bg-[#1a9d96]">
                  Sign Up
                </Button>
                
                <div className="text-center">
                  <span className="text-gray-600">Already have an account? </span>
                  <Button
                    type="button"
                    variant="link"
                    className="text-[#20B2AA] p-0"
                    onClick={() => navigate('/')}
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
