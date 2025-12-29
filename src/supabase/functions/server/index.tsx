import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// Create Supabase client
const getSupabaseClient = () => createClient(
  Deno.env.get("DATABASEURL") ?? "",
  Deno.env.get("DATABASE_SERVICE_ROLE_KEY") ?? ""
);

// KV Store helper functions
const kvGet = async (key: string): Promise<any> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("kv_store_8d885905")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
};

const kvSet = async (key: string, value: any): Promise<void> => {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("kv_store_8d885905")
    .upsert({ key, value });
  if (error) throw new Error(error.message);
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-8d885905/health", (c) => {
  return c.json({ status: "ok" });
});

// Get child comments
app.get("/make-server-8d885905/comments/:childId", async (c) => {
  try {
    const childId = c.req.param("childId");
    const comments = await kvGet(`comments_${childId}`);
    return c.json({ success: true, comments: comments || [] });
  } catch (error) {
    console.log(`Error fetching comments: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add child comment
app.post("/make-server-8d885905/comments/:childId", async (c) => {
  try {
    const childId = c.req.param("childId");
    const body = await c.req.json();
    const { text, therapist } = body;

    if (!text || !therapist) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // Get existing comments
    const existingComments = await kvGet(`comments_${childId}`) || [];
    
    // Create new comment
    const newComment = {
      id: Date.now(),
      text,
      therapist,
      date: new Date().toISOString().split('T')[0]
    };

    // Add to beginning of array
    const updatedComments = [newComment, ...existingComments];
    
    // Save back to KV store
    await kvSet(`comments_${childId}`, updatedComments);

    return c.json({ success: true, comment: newComment });
  } catch (error) {
    console.log(`Error adding comment: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get child meetings
app.get("/make-server-8d885905/meetings/:childId", async (c) => {
  try {
    const childId = c.req.param("childId");
    const meetings = await kvGet(`meetings_${childId}`);
    return c.json({ success: true, meetings: meetings || [] });
  } catch (error) {
    console.log(`Error fetching meetings: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Schedule meeting
app.post("/make-server-8d885905/meetings/:childId", async (c) => {
  try {
    const childId = c.req.param("childId");
    const body = await c.req.json();
    const { date, time, parentPhone } = body;

    if (!date || !time) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // Generate Google Meet link (mock)
    const randomId = Math.random().toString(36).substring(2, 15);
    const meetLink = `https://meet.google.com/${randomId.slice(0, 3)}-${randomId.slice(3, 7)}-${randomId.slice(7, 10)}`;

    // Get existing meetings
    const existingMeetings = await kvGet(`meetings_${childId}`) || [];
    
    // Create new meeting
    const newMeeting = {
      id: Date.now(),
      date,
      time,
      meetLink,
      status: 'scheduled',
      reminderSent: false,
      createdAt: new Date().toISOString()
    };

    // Add to beginning of array
    const updatedMeetings = [newMeeting, ...existingMeetings];
    
    // Save back to KV store
    await kvSet(`meetings_${childId}`, updatedMeetings);

    // Mock WhatsApp notification
    console.log(`WhatsApp notification would be sent to ${parentPhone}: Meeting scheduled for ${date} at ${time}. Join here: ${meetLink}`);

    return c.json({ 
      success: true, 
      meeting: newMeeting,
      message: 'Meeting scheduled and WhatsApp notification sent'
    });
  } catch (error) {
    console.log(`Error scheduling meeting: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Send meeting reminder
app.post("/make-server-8d885905/meetings/:childId/:meetingId/reminder", async (c) => {
  try {
    const childId = c.req.param("childId");
    const meetingId = parseInt(c.req.param("meetingId"));

    // Get existing meetings
    const meetings = await kvGet(`meetings_${childId}`) || [];
    
    // Update reminder status
    const updatedMeetings = meetings.map((meeting: any) => 
      meeting.id === meetingId 
        ? { ...meeting, reminderSent: true }
        : meeting
    );
    
    // Save back to KV store
    await kvSet(`meetings_${childId}`, updatedMeetings);

    // Mock WhatsApp reminder
    const meeting = updatedMeetings.find((m: any) => m.id === meetingId);
    console.log(`WhatsApp reminder sent: Your meeting is in 30 minutes. Join here: ${meeting.meetLink}`);

    return c.json({ 
      success: true, 
      message: 'WhatsApp reminder sent'
    });
  } catch (error) {
    console.log(`Error sending reminder: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Admin: Get all therapists with their patients
app.get("/make-server-8d885905/admin/therapists", async (c) => {
  try {
    // Get therapists data from KV store
    let therapists = await kvGet('admin_therapists');
    
    // If no data exists, initialize with mock data
    if (!therapists) {
      therapists = [
        {
          id: 1,
          name: 'Dr. Sarah Ahmed',
          email: 'sarah.ahmed@bloomsense.com',
          role: 'Senior Therapist',
          status: 'active',
          lastLogin: '2024-01-20',
          totalPatients: 4,
          patients: [
            { id: 1, name: 'Ahmad Khan', age: 4, status: 'In Progress', lastSession: '2 days ago', riskLevel: 'Moderate', screeningStage: 'M-CHAT' },
            { id: 2, name: 'Fatima Ali', age: 6, status: 'Assessment Complete', lastSession: '1 week ago', riskLevel: 'Low', screeningStage: 'Complete' },
            { id: 3, name: 'Hassan Ahmed', age: 3, status: 'Follow-up Needed', lastSession: '3 days ago', riskLevel: 'High', screeningStage: 'Behavior Analysis' },
            { id: 4, name: 'Aisha Malik', age: 5, status: 'In Progress', lastSession: '5 days ago', riskLevel: 'Low', screeningStage: 'M-CHAT' },
          ]
        },
        {
          id: 2,
          name: 'Dr. Ali Hassan',
          email: 'ali.hassan@bloomsense.com',
          role: 'Therapist',
          status: 'active',
          lastLogin: '2024-01-19',
          totalPatients: 3,
          patients: [
            { id: 5, name: 'Omar Abdullah', age: 4, status: 'In Progress', lastSession: '1 day ago', riskLevel: 'Moderate', screeningStage: 'Behavior Analysis' },
            { id: 6, name: 'Zainab Hussain', age: 5, status: 'Assessment Complete', lastSession: '4 days ago', riskLevel: 'Low', screeningStage: 'Complete' },
            { id: 7, name: 'Yusuf Ibrahim', age: 3, status: 'In Progress', lastSession: '2 days ago', riskLevel: 'High', screeningStage: 'M-CHAT' },
          ]
        },
        {
          id: 3,
          name: 'Dr. Fatima Khan',
          email: 'fatima.khan@bloomsense.com',
          role: 'Therapist',
          status: 'active',
          lastLogin: '2024-01-18',
          totalPatients: 2,
          patients: [
            { id: 8, name: 'Layla Mansour', age: 6, status: 'Follow-up Needed', lastSession: '1 week ago', riskLevel: 'Moderate', screeningStage: 'Behavior Analysis' },
            { id: 9, name: 'Kareem Saeed', age: 4, status: 'In Progress', lastSession: '3 days ago', riskLevel: 'Low', screeningStage: 'M-CHAT' },
          ]
        },
        {
          id: 4,
          name: 'Dr. Mohamed Rashid',
          email: 'mohamed.rashid@bloomsense.com',
          role: 'Senior Therapist',
          status: 'active',
          lastLogin: '2024-01-20',
          totalPatients: 5,
          patients: [
            { id: 10, name: 'Noor Hamza', age: 3, status: 'In Progress', lastSession: '1 day ago', riskLevel: 'High', screeningStage: 'Behavior Analysis' },
            { id: 11, name: 'Amina Farooq', age: 5, status: 'Assessment Complete', lastSession: '2 days ago', riskLevel: 'Low', screeningStage: 'Complete' },
            { id: 12, name: 'Ibrahim Tariq', age: 4, status: 'In Progress', lastSession: '4 days ago', riskLevel: 'Moderate', screeningStage: 'M-CHAT' },
            { id: 13, name: 'Sara Nabil', age: 6, status: 'Follow-up Needed', lastSession: '1 week ago', riskLevel: 'High', screeningStage: 'Behavior Analysis' },
            { id: 14, name: 'Adam Khalil', age: 3, status: 'In Progress', lastSession: '2 days ago', riskLevel: 'Low', screeningStage: 'M-CHAT' },
          ]
        }
      ];
      
      // Save the initial data
      await kvSet('admin_therapists', therapists);
    }
    
    return c.json({ success: true, therapists });
  } catch (error) {
    console.log(`Error fetching admin therapists data: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Admin: Get specific therapist details
app.get("/make-server-8d885905/admin/therapists/:therapistId", async (c) => {
  try {
    const therapistId = parseInt(c.req.param("therapistId"));
    const therapists = await kvGet('admin_therapists') || [];
    
    const therapist = therapists.find((t: any) => t.id === therapistId);
    
    if (!therapist) {
      return c.json({ success: false, error: 'Therapist not found' }, 404);
    }
    
    return c.json({ success: true, therapist });
  } catch (error) {
    console.log(`Error fetching therapist details: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Admin: Update therapist status
app.put("/make-server-8d885905/admin/therapists/:therapistId/status", async (c) => {
  try {
    const therapistId = parseInt(c.req.param("therapistId"));
    const body = await c.req.json();
    const { status } = body;
    
    const therapists = await kvGet('admin_therapists') || [];
    const updatedTherapists = therapists.map((t: any) => 
      t.id === therapistId ? { ...t, status } : t
    );
    
    await kvSet('admin_therapists', updatedTherapists);
    
    return c.json({ success: true, message: 'Therapist status updated' });
  } catch (error) {
    console.log(`Error updating therapist status: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Registration Portal: Get all doctors
app.get("/make-server-8d885905/doctors", async (c) => {
  try {
    // Get doctors data from KV store
    let doctors = await kvGet('doctors_list');
    
    // If no data exists, initialize with mock data
    if (!doctors) {
      doctors = [
        { id: '1', name: 'Dr. Sarah Johnson', email: 'sarah@bloomsense.com' },
        { id: '2', name: 'Dr. Ahmed Hassan', email: 'ahmed@bloomsense.com' },
        { id: '3', name: 'Dr. Fatima Ali', email: 'fatima@bloomsense.com' },
        { id: '4', name: 'Dr. Ali Khan', email: 'ali@bloomsense.com' },
        { id: '5', name: 'Dr. Zainab Malik', email: 'zainab@bloomsense.com' },
      ];
      
      // Save the initial data
      await kvSet('doctors_list', doctors);
    }
    
    return c.json({ success: true, doctors });
  } catch (error) {
    console.log(`Error fetching doctors: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Registration Portal: Create appointment
app.post("/make-server-8d885905/appointments", async (c) => {
  try {
    const body = await c.req.json();
    const { patient_name, patient_age, doctor_id, appointment_date, notes, status, created_by } = body;

    if (!patient_name || !patient_age || !doctor_id || !appointment_date) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // Get existing appointments
    const existingAppointments = await kvGet('appointments') || [];
    
    // Create new appointment
    const newAppointment = {
      id: Date.now(),
      patient_name,
      patient_age,
      doctor_id,
      appointment_date,
      notes: notes || '',
      status: status || 'scheduled',
      created_by: created_by || 'helpdesk',
      created_at: new Date().toISOString()
    };

    // Add to beginning of array
    const updatedAppointments = [newAppointment, ...existingAppointments];
    
    // Save back to KV store
    await kvSet('appointments', updatedAppointments);

    return c.json({ 
      success: true, 
      appointment: newAppointment,
      message: 'Appointment scheduled successfully'
    });
  } catch (error) {
    console.log(`Error creating appointment: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Registration Portal: Get all appointments
app.get("/make-server-8d885905/appointments", async (c) => {
  try {
    const appointments = await kvGet('appointments') || [];
    return c.json({ success: true, appointments });
  } catch (error) {
    console.log(`Error fetching appointments: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);