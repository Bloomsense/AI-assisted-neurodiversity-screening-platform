import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Alert, AlertDescription } from './ui/alert';
import { CalendarIcon, LogOut, UserPlus, Clock } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import bloomSenseLogo from 'figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png';

interface Doctor {
  id: string;
  name: string;
  email: string;
}

interface Appointment {
  id: string;
  doctor_id: string;
  appointment_date: string;
  patient_name: string;
  patient_age: number;
  notes?: string;
  status: string;
}

export default function RegistrationPortal() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  
  // Form state
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && appointmentDate) {
      fetchDoctorAppointments(selectedDoctor, appointmentDate);
    }
  }, [selectedDoctor, appointmentDate]);

  // Generate time slots (9 AM to 5 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute of [0, 30]) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const fetchDoctors = async () => {
    try {
      // Fetch doctors from the doctors table
      const { data, error } = await supabase
        .from('doctors')
        .select('*');

      if (error) {
        console.error('Error fetching doctors:', error);
        toast.error(`Failed to load doctors: ${error.message}`);
        return;
      }

      console.log('Raw doctors data from Supabase:', data);

      // Map the data to match the expected interface
      // Handle both possible data structures: {doctor_id, user_id} or {id, name, email}
      const mappedDoctors = (data || []).map((doctor: any) => {
        // If the doctor already has id, name, email, use them directly
        if (doctor.id && doctor.name && doctor.email) {
          return {
            id: doctor.id,
            name: doctor.name,
            email: doctor.email
          };
        }
        
        // Otherwise, map from doctor_id/user_id structure
        const doctorId = doctor.doctor_id || doctor.id;
        const userId = doctor.user_id || '';
        
        return {
          id: doctorId,
          name: doctor.name || `Doctor ${userId || doctorId?.slice(0, 8) || 'Unknown'}`,
          email: doctor.email || `doctor${userId || ''}@bloomsense.com`
        };
      });

      console.log('Mapped doctors data:', mappedDoctors);
      setDoctors(mappedDoctors);
      
      if (!mappedDoctors || mappedDoctors.length === 0) {
        console.warn('No doctors found in the database');
        toast.info('No doctors found. Please add doctors to the database.');
      }
    } catch (error: any) {
      console.error('Unexpected error fetching doctors:', error);
      toast.error(`Failed to load doctors: ${error?.message || 'Unknown error'}`);
    }
  };

  const fetchDoctorAppointments = async (doctorId: string, date: Date) => {
    try {
      // Get start and end of the selected date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('appointment_date', startOfDay.toISOString())
        .lte('appointment_date', endOfDay.toISOString())
        .order('appointment_date', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }

      const appointmentsData = data || [];
      setAppointments(appointmentsData);
      
      // Create set of booked time slots
      const booked = new Set(
        appointmentsData.map((apt: Appointment) => {
          const time = new Date(apt.appointment_date);
          return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        })
      );
      setBookedSlots(booked);

      // Calculate available slots
      const allSlots = generateTimeSlots();
      const available = allSlots.filter(slot => !booked.has(slot));
      setAvailableSlots(available);

    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    }
  };

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!patientName.trim()) {
      toast.error('Please enter patient name');
      return;
    }
    
    if (!patientAge || parseInt(patientAge) <= 0 || parseInt(patientAge) > 18) {
      toast.error('Please enter a valid patient age (1-18)');
      return;
    }
    
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }
    
    if (!appointmentDate) {
      toast.error('Please select an appointment date');
      return;
    }
    
    if (!appointmentTime) {
      toast.error('Please select an appointment time');
      return;
    }

    // Check if slot is already booked
    if (bookedSlots.has(appointmentTime)) {
      toast.error('This time slot is already booked. Please select another time.');
      return;
    }

    setLoading(true);

    try {
      const appointmentDateTime = new Date(appointmentDate);
      const [hours, minutes] = appointmentTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const appointmentData = {
        patient_name: patientName,
        patient_age: parseInt(patientAge),
        doctor_id: selectedDoctor,
        appointment_date: appointmentDateTime.toISOString(),
        notes: notes || null,
        status: 'scheduled'
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select();

      if (error) {
        console.error('Error scheduling appointment:', error);
        throw error;
      }

      toast.success('Appointment scheduled successfully!');
      
      // Refresh appointments
      if (selectedDoctor && appointmentDate) {
        await fetchDoctorAppointments(selectedDoctor, appointmentDate);
      }
      
      // Reset form
      setPatientName('');
      setPatientAge('');
      setSelectedDoctor('');
      setAppointmentDate(undefined);
      setAppointmentTime('');
      setNotes('');
      
    } catch (error: any) {
      console.error('Error scheduling appointment:', error);
      toast.error(error?.message || 'Failed to schedule appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isSlotBooked = (time: string) => {
    return bookedSlots.has(time);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src={bloomSenseLogo} alt="BloomSense" className="h-8 w-8 mr-3" />
              <h1 className="text-2xl font-semibold text-gray-900">BloomSense - Registration</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Appointment Scheduling</h2>
          <p className="mt-2 text-gray-600">Schedule new appointments for patients with doctors</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2 text-teal-600" />
              Schedule New Appointment
            </CardTitle>
            <CardDescription>
              Enter patient details and select appointment time with a doctor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Patient Name *</Label>
                    <Input
                      id="patientName"
                      placeholder="Enter patient's full name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="patientAge">Patient Age *</Label>
                    <Input
                      id="patientAge"
                      type="number"
                      min="1"
                      max="18"
                      placeholder="Enter age (1-18)"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="doctor">Select Doctor *</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Appointment Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formatDate(appointmentDate)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={appointmentDate}
                          onSelect={setAppointmentDate}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointmentTime">Appointment Time *</Label>
                    <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeSlots().map((slot) => (
                          <SelectItem 
                            key={slot} 
                            value={slot}
                            disabled={isSlotBooked(slot)}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{slot}</span>
                              {isSlotBooked(slot) && (
                                <span className="ml-2 text-xs text-red-500">(Booked)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedDoctor && appointmentDate && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      {availableSlots.length > 0 ? (
                        <span className="text-green-700">
                          {availableSlots.length} time slot(s) available for {formatDate(appointmentDate)}
                        </span>
                      ) : (
                        <span className="text-red-700">
                          No available slots for this date. Please select another date.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requirements or notes about the appointment..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPatientName('');
                    setPatientAge('');
                    setSelectedDoctor('');
                    setAppointmentDate(undefined);
                    setAppointmentTime('');
                    setNotes('');
                  }}
                >
                  Clear Form
                </Button>
                <Button 
                  onClick={handleScheduleAppointment}
                  className="bg-teal-600 hover:bg-teal-700"
                  disabled={loading || (selectedDoctor && appointmentDate && availableSlots.length === 0)}
                >
                  {loading ? 'Scheduling...' : 'Schedule Appointment'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedDoctor && appointmentDate && appointments.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Scheduled Appointments for {formatDate(appointmentDate)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {appointments.map((apt) => {
                  const time = new Date(apt.appointment_date);
                  return (
                    <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
                        </span>
                        <span className="text-gray-600">- {apt.patient_name}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-red-100 px-2 py-1 rounded">Booked</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}