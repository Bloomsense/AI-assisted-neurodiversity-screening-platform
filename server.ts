import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

const app = new Hono();

// Load .env file if it exists
try {
  await load({ export: true });
} catch (error) {
  // .env file doesn't exist, that's okay - use environment variables from system
  console.log("ℹ️  No .env file found, using system environment variables");
}

// Get environment variables
const DATABASE_URL = Deno.env.get("DATABASE_URL") || Deno.env.get("DATABASEURL") || "";
const DATABASE_SERVICE_ROLE_KEY = Deno.env.get("DATABASE_SERVICE_ROLE_KEY") || "";
const PORT = parseInt(Deno.env.get("PORT") || "8000");

// Validate required environment variables
if (!DATABASE_URL || !DATABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables!");
  console.error("Please set DATABASE_URL and DATABASE_SERVICE_ROLE_KEY");
  console.error("\nExample:");
  console.error("DATABASE_URL=https://your-project.supabase.co");
  console.error("DATABASE_SERVICE_ROLE_KEY=your-service-role-key");
  Deno.exit(1);
}

// Create Supabase client
const getSupabaseClient = () => createClient(
  DATABASE_URL,
  DATABASE_SERVICE_ROLE_KEY
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
  return c.json({ status: "ok", message: "Backend server is running" });
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

// Start server
console.log(`🚀 Starting backend server on port ${PORT}...`);
console.log(`📡 Health check: http://localhost:${PORT}/make-server-8d885905/health`);

Deno.serve({ port: PORT }, app.fetch);
