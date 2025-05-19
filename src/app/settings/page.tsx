"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCircle, Mail, CreditCard, Bell, Key, RefreshCw } from "lucide-react";

// Mock user data
const mockUser = {
  name: "John Smith",
  email: "john.smith@example.com",
  plan: "free", // "free" or "pro"
  memberSince: "2025-03-15T10:30:00"
};

export default function SettingsPage() {
  const [user, setUser] = useState(mockUser);
  const [isSaving, setIsSaving] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleManageSubscription = () => {
    // This would typically redirect to a Stripe portal
    toast.info("Redirecting to payment portal...");
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <nav className="space-y-1">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <a href="#profile" className="flex items-center">
                    <UserCircle className="mr-2 h-5 w-5" />
                    Profile
                  </a>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <a href="#subscription" className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Subscription
                  </a>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <a href="#password" className="flex items-center">
                    <Key className="mr-2 h-5 w-5" />
                    Password
                  </a>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <a href="#notifications" className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    Notifications
                  </a>
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Section */}
          <Card id="profile">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCircle className="mr-2 h-5 w-5" /> Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={user.name} 
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={user.email} 
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                </div>
                <div className="pt-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card id="subscription">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" /> Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription plan and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Plan</p>
                    <div className="mt-1 flex items-center">
                      {user.plan === "free" ? (
                        <Badge variant="outline" className="bg-gray-100">Free</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">Pro</Badge>
                      )}
                    </div>
                  </div>
                  {user.plan === "free" ? (
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Upgrade to Pro
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleManageSubscription}>
                      Manage Subscription
                    </Button>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Member since {formatDate(user.memberSince)}</p>
                  {user.plan !== "free" && (
                    <p className="text-sm text-gray-500 mt-1">
                      Your next billing date is {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card id="password">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="mr-2 h-5 w-5" /> Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <div className="pt-2">
                  <Button type="submit">Update Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card id="notifications">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" /> Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">
                      Receive email notifications when your content is processed
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="email-notifications" className="sr-only">
                      Email Notifications
                    </Label>
                    <input
                      type="checkbox"
                      id="email-notifications"
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600"
                      defaultChecked
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-gray-500">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="marketing-emails" className="sr-only">
                      Marketing Emails
                    </Label>
                    <input
                      type="checkbox"
                      id="marketing-emails"
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Button type="submit">Save Preferences</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
