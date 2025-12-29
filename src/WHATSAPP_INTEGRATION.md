# WhatsApp Integration for BloomSense

## Current Implementation

The BloomSense platform currently includes **mock WhatsApp functionality** for:
- Sending meeting invitations when therapists schedule follow-up meetings
- Sending automated reminders 30 minutes before meetings
- Notifications are simulated through console logs and toast notifications

## How to Integrate Real WhatsApp Messaging

To enable actual WhatsApp messaging, you'll need to integrate with the WhatsApp Business API:

### Option 1: Twilio WhatsApp API (Recommended)

1. **Sign up for Twilio**
   - Create an account at https://www.twilio.com
   - Get your Account SID and Auth Token
   - Set up a WhatsApp-enabled phone number

2. **Add Environment Variables**
   Use the `create_supabase_secret` tool to add:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER` (format: whatsapp:+14155238886)

3. **Update Server Code** (`/supabase/functions/server/index.tsx`)
   ```typescript
   import twilio from 'npm:twilio';
   
   const twilioClient = twilio(
     Deno.env.get('TWILIO_ACCOUNT_SID'),
     Deno.env.get('TWILIO_AUTH_TOKEN')
   );
   
   // In the schedule meeting endpoint:
   await twilioClient.messages.create({
     from: Deno.env.get('TWILIO_WHATSAPP_NUMBER'),
     to: `whatsapp:${parentPhone}`,
     body: `Meeting scheduled for ${date} at ${time}. Join here: ${meetLink}`
   });
   
   // For reminders:
   await twilioClient.messages.create({
     from: Deno.env.get('TWILIO_WHATSAPP_NUMBER'),
     to: `whatsapp:${parentPhone}`,
     body: `Reminder: Your meeting starts in 30 minutes. Join here: ${meetLink}`
   });
   ```

### Option 2: Meta WhatsApp Business API

1. Set up a Meta Business Account
2. Get WhatsApp Business API access
3. Configure webhooks for message delivery status
4. Similar implementation pattern to Twilio

## Automated Reminders

To implement 30-minute reminders, you have two options:

### Option 1: Supabase Edge Functions with pg_cron
Use Supabase's built-in cron functionality to check for upcoming meetings every minute.

### Option 2: External Cron Service
Use services like:
- Vercel Cron Jobs
- AWS EventBridge
- Google Cloud Scheduler

These would call your reminder endpoint at regular intervals to check for meetings needing reminders.

## Google Meet Integration

The current implementation generates mock Google Meet links. For production:

1. **Set up Google Workspace**
   - Enable Google Calendar API
   - Get OAuth 2.0 credentials

2. **Use Google Calendar API**
   ```typescript
   // Create calendar event with Google Meet
   const event = await calendar.events.insert({
     calendarId: 'primary',
     conferenceDataVersion: 1,
     resource: {
       summary: 'BloomSense Follow-up Meeting',
       start: { dateTime: meetingDateTime },
       end: { dateTime: meetingEndTime },
       conferenceData: {
         createRequest: {
           requestId: `bloomsense-${Date.now()}`
         }
       }
     }
   });
   
   const meetLink = event.conferenceData.entryPoints[0].uri;
   ```

## Testing

For development, the current mock implementation allows you to:
- Test the UI/UX flow
- Verify data persistence
- Ensure proper error handling

Console logs will show what messages would be sent in production.

## Important Notes

- **HIPAA Compliance**: Ensure any third-party messaging service is HIPAA-compliant for healthcare data
- **Consent**: Obtain explicit consent from parents before sending WhatsApp messages
- **Opt-out**: Provide a way for parents to opt out of automated messages
- **Rate Limits**: Be aware of API rate limits and implement appropriate throttling
