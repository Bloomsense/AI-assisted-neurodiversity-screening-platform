
  # AI-Assisted Neurodiversity Screening Platform

  This is a code bundle for AI-Assisted Neurodiversity Screening Platform. The original project is available at https://www.figma.com/design/EnRCAfqMTh3CgpJs5OX5u7/AI-Assisted-Neurodiversity-Screening-Platform.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Password reset (forgot password)

  Therapist users can reset their password via email:

  1. On the login page, click **Forgot Password?** (Therapist tab).
  2. Enter the email used to sign up and submit. Supabase sends a reset link.
  3. Open the link in the email and set a new password on the reset page.

  **Supabase setup:** In [Supabase Dashboard](https://supabase.com/dashboard) → Authentication → URL Configuration, add your app URLs to **Redirect URLs**, for example:
  - `http://localhost:5173/reset-password` (development)
  - `https://yourdomain.com/reset-password` (production)

  Without these URLs, the reset link from the email will not open your app correctly.
