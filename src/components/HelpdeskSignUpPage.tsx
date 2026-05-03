import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import { upsertHelpdeskStaffRow } from '../utils/helpdeskProfile';

export default function HelpdeskSignUpPage() {
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [hospitalBranch, setHospitalBranch] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const formatCNIC = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) {
      return digits;
    }
    if (digits.length <= 12) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnic(formatCNIC(e.target.value));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: workEmail,
        password,
        options: {
          data: {
            fullName,
            contactNumber,
            cnic,
            hospitalBranch,
            role: 'helpdesk',
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session?.user) {
        const { error: profileError } = await upsertHelpdeskStaffRow(data.session.user);
        if (profileError) {
          toast.warning(
            'Account created, but saving your profile failed. Run supabase/migrations/helpdesk_staff.sql in the Supabase SQL editor, then sign in once to sync.'
          );
        }
      }

      toast.success(
        data.session
          ? 'Help desk account ready. You can sign in now.'
          : 'Registration successful. Please check your email to confirm, then sign in.'
      );
      navigate('/login', { state: { defaultTab: 'helpdesk' } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={bloomSenseLogo} alt="BloomSense" className="h-12 w-12 mr-3" />
            <h1 className="text-3xl text-gray-900">BloomSense</h1>
          </div>
          <p className="text-gray-600">Create your help desk account</p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>Register as help desk staff to access the registration portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hd-fullName">Full Name *</Label>
                  <Input
                    id="hd-fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hd-contactNumber">Contact Number *</Label>
                  <Input
                    id="hd-contactNumber"
                    type="tel"
                    placeholder="03XX-XXXXXXX"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hd-workEmail">Work Email Address *</Label>
                  <Input
                    id="hd-workEmail"
                    type="email"
                    placeholder="helpdesk@hospital.com"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hd-cnic">CNIC No *</Label>
                  <Input
                    id="hd-cnic"
                    type="text"
                    placeholder="XXXXX-XXXXXXX-X"
                    value={cnic}
                    onChange={handleCnicChange}
                    maxLength={15}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hd-hospitalBranch">Hospital branch *</Label>
                  <Input
                    id="hd-hospitalBranch"
                    type="text"
                    placeholder="e.g. Main campus, North wing"
                    value={hospitalBranch}
                    onChange={(e) => setHospitalBranch(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hd-password">Password *</Label>
                  <Input
                    id="hd-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hd-confirmPassword">Confirm Password *</Label>
                  <Input
                    id="hd-confirmPassword"
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
                <Button
                  type="submit"
                  className="w-full bg-[#20B2AA] hover:bg-[#1a9d96]"
                  disabled={submitting}
                >
                  {submitting ? 'Signing up…' : 'Sign Up'}
                </Button>

                <div className="text-center">
                  <span className="text-gray-600">Already have an account? </span>
                  <Button type="button" variant="link" className="text-[#20B2AA] p-0" asChild>
                    <Link to="/login" state={{ defaultTab: 'helpdesk' }}>
                      Sign In
                    </Link>
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
