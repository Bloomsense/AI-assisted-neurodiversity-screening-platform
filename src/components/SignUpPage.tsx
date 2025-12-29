import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState<Date>();
  const [contactNumber, setContactNumber] = useState('');
  const [hospitalEmail, setHospitalEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
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

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Validate CNIC format
    if (cnic.replace(/\D/g, '').length !== 13) {
      alert('Please enter a valid CNIC number (13 digits)');
      return;
    }

    // Here you would typically send the data to your backend/database
    const therapistData = {
      fullName,
      dob: dob?.toISOString(),
      contactNumber,
      hospitalEmail,
      cnic,
      address,
      occupation,
      password, // In production, this would be hashed
    };

    console.log('New therapist registration:', therapistData);
    
    // For now, show success message and redirect to login
    alert('Registration successful! Please sign in with your credentials.');
    navigate('/');
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

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dob ? format(dob, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dob}
                        onSelect={setDob}
                        initialFocus
                        disabled={(date) => date > new Date() || date < new Date('1940-01-01')}
                      />
                    </PopoverContent>
                  </Popover>
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

                {/* Address */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Enter your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
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
