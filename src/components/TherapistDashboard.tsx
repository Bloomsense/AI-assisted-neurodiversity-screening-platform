import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Users,
  Calendar,
  FileText,
  Bell,
  UserPlus,
  PlayCircle,
  LogOut,
  Settings,
} from "lucide-react";
import bloomSenseLogo from "figma:asset/5df998614cf553b8ecde44808a8dc2a64d4788df.png";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client";

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const [therapistDisplayName, setTherapistDisplayName] = useState<string>("Dr");
  const [therapistUserId, setTherapistUserId] = useState<string | null>(null);
  const [overviewStats, setOverviewStats] = useState([
    {
      title: "Active Child Profiles",
      value: "0",
      icon: Users,
      color: "text-teal-600",
    },
    {
      title: "Pending Sessions",
      value: "0",
      icon: Calendar,
      color: "text-orange-600",
    },
  ]);
  const [recentNotifications, setRecentNotifications] = useState<
    Array<{ id: number; type: string; child: string; message: string; time: string; patientId?: string }>
  >([]);
  const [recentChildren, setRecentChildren] = useState<
    Array<{ id: string; name: string; age: number; lastSession: string; status: string }>
  >([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const fullName = (user.user_metadata?.fullName as string) || user.email?.split("@")[0] || "";
      const firstName = fullName.trim().split(/\s+/)[0] || "Therapist";
      setTherapistDisplayName(firstName ? `Dr. ${firstName}` : "Dr");
      setTherapistUserId(user.id);
    });
  }, []);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!therapistUserId) return;

      const nowIso = new Date().toISOString();

      const [patientsResult, pendingSessionsResult, upcomingAppointmentsResult, recentChildrenResult] =
        await Promise.all([
        supabase
          .from("patients")
          .select("id", { count: "exact", head: true })
          .eq("assigned_doctor_id", therapistUserId),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("doctor_id", therapistUserId)
          .in("status", ["scheduled", "pending"])
          .gte("appointment_date", nowIso),
        supabase
          .from("appointments")
          .select("id,patient_id,patient_name,appointment_date,status")
          .eq("doctor_id", therapistUserId)
          .in("status", ["scheduled", "pending"])
          .gte("appointment_date", nowIso)
          .order("appointment_date", { ascending: true })
          .limit(5),
        supabase
          .from("patients")
          .select("id,name,age,updated_at,status")
          .eq("assigned_doctor_id", therapistUserId)
          .order("updated_at", { ascending: false })
          .limit(5),
      ]);

      if (patientsResult.error) {
        console.error("Error loading patient stats:", patientsResult.error);
      }

      if (pendingSessionsResult.error) {
        console.error("Error loading pending sessions stats:", pendingSessionsResult.error);
      }
      if (upcomingAppointmentsResult.error) {
        console.error("Error loading therapist notifications:", upcomingAppointmentsResult.error);
      }
      if (recentChildrenResult.error) {
        console.error("Error loading recent child profiles:", recentChildrenResult.error);
      }

      setOverviewStats([
        {
          title: "Active Child Profiles",
          value: String(patientsResult.count ?? 0),
          icon: Users,
          color: "text-teal-600",
        },
        {
          title: "Pending Sessions",
          value: String(pendingSessionsResult.count ?? 0),
          icon: Calendar,
          color: "text-orange-600",
        },
      ]);

      const notifications = (upcomingAppointmentsResult.data || []).map((item: any, idx: number) => {
        const appointmentDate = new Date(item.appointment_date);
        return {
          id: idx + 1,
          type: "appointment",
          child: item.patient_name || "New Child",
          message: `Upcoming appointment assigned by help desk at ${formatDateTime(appointmentDate)}`,
          time: formatRelativeTime(appointmentDate),
          patientId: item.patient_id ? String(item.patient_id) : undefined,
        };
      });
      setRecentNotifications(notifications);

      const mappedChildren = (recentChildrenResult.data || []).map((child: any) => ({
        id: String(child.id),
        name: child.name || "Unknown",
        age: Number(child.age) || 0,
        lastSession: child.updated_at ? new Date(child.updated_at).toLocaleDateString() : "N/A",
        status: child.status || "In Progress",
      }));
      setRecentChildren(mappedChildren);
    };

    fetchDashboardStats();
  }, [therapistUserId]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const formatRelativeTime = (date: Date) => {
    const diffMs = date.getTime() - Date.now();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) return "today";
    if (diffHours < 24) return `in ${diffHours} hour${diffHours === 1 ? "" : "s"}`;
    const days = Math.round(diffHours / 24);
    return `in ${days} day${days === 1 ? "" : "s"}`;
  };

  const formatDateTime = (date: Date) => {
    if (isNaN(date.getTime())) return "scheduled time";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img
                src={bloomSenseLogo}
                alt="BloomSense"
                className="h-8 w-8 mr-3"
              />
              <h1 className="text-2xl text-gray-900">BloomSense</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl text-gray-900">Welcome back, {therapistDisplayName}</h2>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your patients today.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {overviewStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => navigate("/therapist/event-selection")}
              >
                <PlayCircle className="h-8 w-8" />
                <span>Start New Event</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => navigate("/therapist/create-profile")}
              >
                <UserPlus className="h-8 w-8" />
                <span>Create Child Profile</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => navigate("/therapist/screening")}
              >
                <FileText className="h-8 w-8" />
                <span>Continue Existing Screening</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentNotifications.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet.</p>
                  </div>
                ) : (
                  recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {notification.child}
                          </span>{" "}
                          - {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.time}
                        </p>
                        {notification.patientId && (
                          <Button
                            variant="link"
                            size="sm"
                            className="px-0 h-auto mt-1"
                            onClick={() => navigate(`/therapist/child/${notification.patientId}`)}
                          >
                            Open patient profile
                          </Button>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {notification.type}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Children */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Child Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentChildren.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="mb-4">No child profiles yet.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/therapist/create-profile")}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Child Profile
                    </Button>
                  </div>
                ) : (
                  recentChildren.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => navigate(`/therapist/child/${child.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {child.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{child.name}</p>
                          <p className="text-sm text-gray-500">
                            Age {child.age} • Last session: {child.lastSession}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          child.status === "Assessment Complete"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {child.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
