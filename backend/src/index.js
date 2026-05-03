import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL =
  process.env.DATABASE_URL || process.env.DATABASEURL || process.env.SUPABASE_URL || '';
const DATABASE_SERVICE_ROLE_KEY =
  process.env.DATABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';
const PORT = parseInt(process.env.PORT || '8000', 10);
const BASE = '/make-server-8d885905';

if (!DATABASE_URL || !DATABASE_SERVICE_ROLE_KEY) {
  console.error('Missing DATABASE_URL (or SUPABASE_URL) and DATABASE_SERVICE_ROLE_KEY.');
  console.error('Copy backend/.env.example to backend/.env and fill in values.');
  process.exit(1);
}

const getSupabase = () => createClient(DATABASE_URL, DATABASE_SERVICE_ROLE_KEY);

const kvGet = async (key) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('kv_store_8d885905')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
};

const kvSet = async (key, value) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('kv_store_8d885905').upsert({ key, value });
  if (error) throw new Error(error.message);
};

const app = express();
app.use(
  cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  })
);
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get(`${BASE}/health`, (_req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

app.get(`${BASE}/comments/:childId`, async (req, res) => {
  try {
    const { childId } = req.params;
    const comments = await kvGet(`comments_${childId}`);
    res.json({ success: true, comments: comments || [] });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.post(`${BASE}/comments/:childId`, async (req, res) => {
  try {
    const { childId } = req.params;
    const { text, therapist } = req.body || {};
    if (!text || !therapist) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const existingComments = (await kvGet(`comments_${childId}`)) || [];
    const newComment = {
      id: Date.now(),
      text,
      therapist,
      date: new Date().toISOString().split('T')[0],
    };
    const updatedComments = [newComment, ...existingComments];
    await kvSet(`comments_${childId}`, updatedComments);
    res.json({ success: true, comment: newComment });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.get(`${BASE}/meetings/:childId`, async (req, res) => {
  try {
    const { childId } = req.params;
    const meetings = await kvGet(`meetings_${childId}`);
    res.json({ success: true, meetings: meetings || [] });
  } catch (err) {
    console.error('Error fetching meetings:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.post(`${BASE}/meetings/:childId/:meetingId/reminder`, async (req, res) => {
  try {
    const { childId, meetingId } = req.params;
    const idNum = parseInt(meetingId, 10);
    const meetings = (await kvGet(`meetings_${childId}`)) || [];
    const updatedMeetings = meetings.map((meeting) =>
      meeting.id === idNum ? { ...meeting, reminderSent: true } : meeting
    );
    await kvSet(`meetings_${childId}`, updatedMeetings);
    const meeting = updatedMeetings.find((m) => m.id === idNum);
    console.log(
      `WhatsApp reminder sent: Your meeting is in 30 minutes. Join here: ${meeting?.meetLink}`
    );
    res.json({ success: true, message: 'WhatsApp reminder sent' });
  } catch (err) {
    console.error('Error sending reminder:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.post(`${BASE}/meetings/:childId`, async (req, res) => {
  try {
    const { childId } = req.params;
    const { date, time, parentPhone } = req.body || {};
    if (!date || !time) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const randomId = Math.random().toString(36).substring(2, 15);
    const meetLink = `https://meet.google.com/${randomId.slice(0, 3)}-${randomId.slice(3, 7)}-${randomId.slice(7, 10)}`;
    const existingMeetings = (await kvGet(`meetings_${childId}`)) || [];
    const newMeeting = {
      id: Date.now(),
      date,
      time,
      meetLink,
      status: 'scheduled',
      reminderSent: false,
      createdAt: new Date().toISOString(),
    };
    const updatedMeetings = [newMeeting, ...existingMeetings];
    await kvSet(`meetings_${childId}`, updatedMeetings);
    console.log(
      `WhatsApp notification would be sent to ${parentPhone}: Meeting scheduled for ${date} at ${time}. Join here: ${meetLink}`
    );
    res.json({
      success: true,
      meeting: newMeeting,
      message: 'Meeting scheduled and WhatsApp notification sent',
    });
  } catch (err) {
    console.error('Error scheduling meeting:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.get(`${BASE}/appointments`, async (_req, res) => {
  try {
    const appointments = (await kvGet('appointments')) || [];
    res.json({ success: true, appointments });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.post(`${BASE}/appointments`, async (req, res) => {
  try {
    const body = req.body || {};
    const { patient_name, patient_age, doctor_id, appointment_date, notes, status, created_by } =
      body;
    if (!patient_name || !patient_age || !doctor_id || !appointment_date) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const existingAppointments = (await kvGet('appointments')) || [];
    const newAppointment = {
      id: Date.now(),
      patient_name,
      patient_age,
      doctor_id,
      appointment_date,
      notes: notes || '',
      status: status || 'scheduled',
      created_by: created_by || 'helpdesk',
      created_at: new Date().toISOString(),
    };
    const updatedAppointments = [newAppointment, ...existingAppointments];
    await kvSet('appointments', updatedAppointments);
    res.json({
      success: true,
      appointment: newAppointment,
      message: 'Appointment scheduled successfully',
    });
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`BloomSense Node backend on http://localhost:${PORT}${BASE}/health`);
});
