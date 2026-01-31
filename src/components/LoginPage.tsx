import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, UserCircle, Headphones } from 'lucide-react';
import { toast } from 'sonner';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';
import { supabase } from '../utils/supabase/client';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [helpdeskEmail, setHelpdeskEmail] = useState('');
  const [helpdeskPassword, setHelpdeskPassword] = useState('');
  const navigate = useNavigate();

const handleTherapistLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Logged in successfully");
    navigate("/therapist/dashboard");
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple admin check - in production, this would be validated via backend
    if (adminEmail === 'admin@bloomsense.com' || adminPassword === 'admin') {
      toast.success('Logged in as administrator');
      navigate('/admin/dashboard');
    } else {
      toast.error('Invalid admin credentials');
    }
  };

  const handleHelpdeskLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Logged in as help desk staff');
    navigate('/registration/portal');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img src={bloomSenseLogo} alt="BloomSense" className="h-16 w-16 mr-4" />
            <h1 className="text-4xl text-gray-900">BloomSense</h1>
          </div>
          <p className="mt-2 text-gray-500">
            Professional therapist portal for comprehensive child assessments
          </p>
        </div>

        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img src={bloomSenseLogo} alt="BloomSense" className="h-10 w-10 mr-3" />
              <CardTitle className="text-2xl">BloomSense</CardTitle>
            </div>
            <CardDescription>
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="therapist" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="therapist" className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Therapist
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="helpdesk" className="flex items-center gap-2">
                  <Headphones className="h-4 w-4" />
                  Help Desk
                </TabsTrigger>
              </TabsList>

              {/* Therapist Login */}
              <TabsContent value="therapist">
                <form onSubmit={handleTherapistLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="therapist@bloomsense.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Sign In as Therapist
                    </Button>
                  </div>
                </form>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full">
                    Forgot Password?
                  </Button>
                  
                  <div className="text-center mt-4">
                    <span className="text-gray-600">Don't have an account? </span>
                    <Button
                      type="button"
                      variant="link"
                      className="text-[#20B2AA] p-0"
                      onClick={() => navigate('/signup')}
                    >
                      Sign Up
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Admin Login */}
              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Admin Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@bloomsense.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Admin Password</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="Enter admin password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-[#20B2AA] hover:bg-[#1a9890]">
                      <Shield className="h-4 w-4 mr-2" />
                      Sign In as Admin
                    </Button>
                  </div>
                </form>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">
                    <strong>Demo credentials:</strong><br />
                    Email: admin@bloomsense.com<br />
                    Password: admin
                  </p>
                </div>
              </TabsContent>

              {/* Help Desk Login */}
              <TabsContent value="helpdesk">
                <form onSubmit={handleHelpdeskLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="helpdesk-email">Help Desk Email</Label>
                      <Input
                        id="helpdesk-email"
                        type="email"
                        placeholder="helpdesk@bloomsense.com"
                        value={helpdeskEmail}
                        onChange={(e) => setHelpdeskEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="helpdesk-password">Password</Label>
                      <Input
                        id="helpdesk-password"
                        type="password"
                        placeholder="Enter your password"
                        value={helpdeskPassword}
                        onChange={(e) => setHelpdeskPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-[#20B2AA] hover:bg-[#1a9890]">
                      <Headphones className="h-4 w-4 mr-2" />
                      Sign In as Help Desk
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}