import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import TherapistDashboard from "./components/TherapistDashboard";
import CreateChildProfile from "./components/CreateChildProfile";
import ScreeningWorkflow from "./components/ScreeningWorkflow";
import ChildProfileDetail from "./components/ChildProfileDetail";
import AdminDashboard from "./components/AdminDashboard";
import AdminSettings from "./components/AdminSettings";
import EventSelection from "./components/EventSelection";
import SessionScreen from "./components/SessionScreen";
import RegistrationPortal from "./components/RegistrationPortal";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route
            path="/therapist/dashboard"
            element={
              <ProtectedRoute>
                <TherapistDashboard />
              </ProtectedRoute>
            }
          />
         <Route
            path="/therapist/create-profile"
            element={
              <ProtectedRoute>
                <CreateChildProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/therapist/event-selection"
            element={<EventSelection />}
          />
          <Route
            path="/therapist/session/:childId"
            element={<SessionScreen />}
          />
          <Route
            path="/therapist/screening/:childId?"
            element={<ScreeningWorkflow />}
          />
          <Route
            path="/therapist/child/:childId"
            element={<ChildProfileDetail />}
          />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/registration/portal" element={<RegistrationPortal />} />
          {/* Catch-all route for any unmatched paths */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}
