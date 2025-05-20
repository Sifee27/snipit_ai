"use client";

import { useState, useEffect } from "react";
import { Users, Download, Trash2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface WaitlistData {
  emails: string[];
  lastUpdated: string;
}

export default function WaitlistDashboard() {
  const [waitlistData, setWaitlistData] = useState<WaitlistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Function to fetch waitlist data
  const fetchWaitlistData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add a simple authentication mechanism
          "X-Admin-Access": "true",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch waitlist data");
      }

      const data = await response.json();
      setWaitlistData(data);
    } catch (error) {
      console.error("Error fetching waitlist data:", error);
      toast.error("Failed to load waitlist data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on initial component mount
  useEffect(() => {
    fetchWaitlistData();
  }, []);

  // Function to handle exporting waitlist data to CSV
  const handleExport = () => {
    if (!waitlistData || waitlistData.emails.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsExporting(true);
    
    try {
      // Create CSV content
      const csvContent = "data:text/csv;charset=utf-8," + waitlistData.emails.join("\\n");
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `snipit-waitlist-${new Date().toISOString().split("T")[0]}.csv`);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Waitlist exported successfully");
    } catch (error) {
      console.error("Error exporting waitlist:", error);
      toast.error("Failed to export waitlist");
    } finally {
      setIsExporting(false);
    }
  };

  // Filter waitlist emails based on search term
  const filteredEmails = waitlistData?.emails.filter(email => 
    email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Users className="mr-2 h-6 w-6" />
                Waitlist Signups
              </CardTitle>
              <CardDescription>
                Manage and track user signups for the Snipit waitlist
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={fetchWaitlistData}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleExport}
                disabled={isLoading || isExporting || !waitlistData || waitlistData.emails.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats summary */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Signups</p>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {isLoading ? "..." : waitlistData?.emails.length || 0}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              </div>
              <p className="mt-1 text-sm font-medium">
                {isLoading ? "..." : waitlistData?.lastUpdated 
                  ? new Date(waitlistData.lastUpdated).toLocaleString() 
                  : "Never"}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Data Source</p>
              </div>
              <p className="mt-1">
                <Badge variant="outline">
                  {isLoading ? "..." : "File Storage"}
                </Badge>
              </p>
            </div>
          </div>

          {/* Search and filter */}
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search emails..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Waitlist table */}
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="h-10 px-4 text-left font-medium">Email</th>
                    <th className="h-10 w-[100px] px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={2} className="p-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                          <span className="ml-2">Loading waitlist data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEmails.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-4 text-center text-muted-foreground">
                        {searchTerm 
                          ? "No emails match your search" 
                          : "No waitlist signups yet"}
                      </td>
                    </tr>
                  ) : (
                    filteredEmails.map((email, index) => (
                      <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">{email}</td>
                        <td className="p-4 text-right align-middle">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Remove from waitlist"
                            onClick={() => {
                              toast.error("Remove functionality will be implemented in a future update");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination would go here for larger waitlists */}
        </CardContent>
      </Card>
    </div>
  );
}
