import React from "react";
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
  Plus,
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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const overviewStats = [
    {
      title: "Active Child Profiles",
      value: "24",
      icon: Users,
      color: "text-teal-600",
    },
    {
      title: "Upcoming Sessions",
      value: "8",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Pending Assessments",
      value: "5",
      icon: FileText,
      color: "text-orange-600",
    },
  ];

  const recentNotifications = [
    {
      id: 1,
      type: "assessment",
      child: "Ahmad Khan",
      message: "New assessment results available",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "update",
      child: "Fatima Ali",
      message: "Caregiver added new observations",
      time: "4 hours ago",
    },
    {
      id: 3,
      type: "session",
      child: "Hassan Ahmed",
      message: "Session scheduled for tomorrow",
      time: "1 day ago",
    },
  ];

  const recentChildren = [
    {
      id: 1,
      name: "Ahmad Khan",
      age: 4,
      lastSession: "2 days ago",
      status: "In Progress",
    },
    {
      id: 2,
      name: "Fatima Ali",
      age: 6,
      lastSession: "1 week ago",
      status: "Assessment Complete",
    },
    {
      id: 3,
      name: "Hassan Ahmed",
      age: 3,
      lastSession: "3 days ago",
      status: "Follow-up Needed",
    },
    {
      id: 4,
      name: "Aisha Malik",
      age: 5,
      lastSession: "5 days ago",
      status: "In Progress",
    },
  ];

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
          <h2 className="text-3xl text-gray-900">Welcome back, Dr. Sarah</h2>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your patients today.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                {recentNotifications.map((notification) => (
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
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {notification.type}
                    </Badge>
                  </div>
                ))}
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
                {recentChildren.map((child) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
