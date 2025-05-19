"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileAudio, FileVideo, Link as LinkIcon, Clock, CheckCircle, AlertCircle, FileText } from "lucide-react";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/components/auth/auth-provider";
import { SummaryDialog } from "@/components/summary-dialog";
import { cn } from "@/lib/utils";
import { ClientPageWrapper } from "@/components/client-wrapper";

// Type definitions
interface HistoryItem {
  id: string;
  title?: string;
  sourceType: string;
  date?: string;
  status: "completed" | "processing" | "failed";
  content?: string;
  originalContent?: string; // Added for YouTube URLs and other original content
  contentType?: string;
  results?: Record<string, any>;
  userId?: string;
  createdAt?: string;
  processedAt?: string;
  summary?: string;
  contentMetadata?: {
    title?: string;
    duration?: string;
    sourceType?: string;
  };
}

// Main dashboard component
function DashboardContent() {
  // Helper function to extract YouTube video ID from URL
  const extractVideoId = (url: string): string => {
    try {
      if (url.includes('youtube.com/watch?v=')) {
        return url.split('youtube.com/watch?v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1].split('?')[0];
      }
      return 'unknown';
    } catch (e) {
      return 'unknown';
    }
  };
  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"link" | "file">("link");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [remainingUploads, setRemainingUploads] = useState(0);
  const [maxUploads, setMaxUploads] = useState(100);
  
  // Get auth context
  const { user } = useAuth();
  
  // Load upload history when component mounts
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoadingHistory(true);
        
        // Set up mock authentication for development mode
        if (process.env.NODE_ENV === 'development' && typeof localStorage !== 'undefined') {
          // Set up test user authentication if not already present
          if (!localStorage.getItem('auth_user')) {
            console.log('Setting up test user authentication for development');
            localStorage.setItem('is_authenticated', 'true');
            localStorage.setItem('auth_user', JSON.stringify({
              id: 'user_123',
              email: 'test@example.com',
              name: 'Test User'
            }));
          }
        }
        
        // Local fallback history data in case API calls fail
        const fallbackHistory = [
          {
            id: `local-${Date.now()}`,
            userId: 'user_123',
            title: 'Fallback History Item',
            sourceType: 'text',
            summary: 'This is a local fallback item used when history API is unavailable.',
            keyQuotes: [{ text: 'Fallback key quote for testing', timestamp: 'N/A' }],
            socialPost: 'Fallback social post content #testing',
            blogPost: '# Fallback Post\n\nThis content is used when the API is unavailable.',
            createdAt: new Date().toISOString(),
            processedAt: new Date().toISOString(),
            contentType: 'text',
            status: 'completed',
            contentMetadata: {
              title: 'Fallback Item',
              sourceType: 'text',
              duration: 'N/A'
            },
            isRealAiContent: false,
            isMockFallback: true
          }
        ];
        
        // Try multiple methods to get history data
        let data;
        let apiMethod = 'normal';
        
        try {
          // First try normal API client method
          data = await apiClient.content.getHistory();
          console.log('History data received via API client:', data);
        } catch (primaryError) {
          console.warn('Primary history fetch failed, trying direct fetch:', primaryError);
          apiMethod = 'direct';
          
          try {
            // Try direct fetch as fallback
            const response = await fetch('/api/history?forceUserId=user_123');
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            const result = await response.json();
            data = result.data?.items || [];
            console.log('History data received via direct fetch:', data);
          } catch (directError) {
            console.warn('Direct fetch also failed, using local fallback:', directError);
            apiMethod = 'fallback';
            data = fallbackHistory;
          }
        }
        
        // Ensure we always have an array
        const historyItems = Array.isArray(data) ? data : [];
        console.log(`Using ${apiMethod} history data with ${historyItems.length} items`);
        
        setHistory(historyItems);
        
        // Check remaining uploads (in a real app, this would come from the server)
        const used = historyItems.filter(item => {
          if (!item.createdAt) return false;
          
          try {
            const itemDate = new Date(item.createdAt);
            const today = new Date();
            return itemDate.getDate() === today.getDate() &&
                   itemDate.getMonth() === today.getMonth() &&
                   itemDate.getFullYear() === today.getFullYear();
          } catch (e) {
            return false;
          }
        }).length || 0;
        
        setRemainingUploads(Math.max(0, maxUploads - used));
      } catch (err) {
        console.error('Failed to fetch history', err);
        // Use empty array as last resort
        setHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    fetchHistory();
  }, []);
  
  // Function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  // Function to handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    // Prevent default form submission if called from a form
    if (e) e.preventDefault();
    
    // Validate inputs
    if (uploadType === "link") {
      if (!url || url.trim() === '') {
        toast.error("Please enter a valid URL");
        return;
      }
    } else if (uploadType === "file") {
      if (!selectedFile) {
        toast.error("Please select a file to upload");
        return;
      }
    }
    
    // If we've used all uploads, show error
    if (remainingUploads <= 0) {
      toast.error("You've reached your daily upload limit");
      return;
    }
    
    // Set uploading state
    setIsUploading(true);
    
    try {
      let content: string;
      let contentType: string;
      
      if (uploadType === "link" && url) {
        // Make sure URL has proper protocol to pass validation
        let processUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          processUrl = 'https://' + url;
        }
        
        content = processUrl;
        contentType = url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'link';
        
        // Log what we're sending to help debug validation issues
        console.log('Link submission:', { processUrl, contentType });
      } else if (uploadType === "file" && selectedFile) {
        // For files, we would normally upload to storage first
        const fileType = selectedFile.type.split('/')[0]; // audio, video, etc.
        content = selectedFile.name; // In a real app, we'd upload and get URL
        contentType = fileType;
        
        toast.info("File processing simulated for demo");
      } else {
        throw new Error("Invalid input");
      }
      
      // Show processing toast
      toast.loading("Processing content...", { id: "processing" });
      
      try {
        // Log what we're about to send to the API
        console.log('Sending to process API:', {
          content,
          contentType,
          options: {
            includeSummary: true,
            includeKeyQuotes: true,
            includeSocialPost: true,
            includeBlogPost: true,
            maxQuotes: 5,
            maxSummaryLength: 250
          }
        });
        
        // Process the content through our API
        const result = await apiClient.content.process(
          content,
          contentType,
          {
            includeSummary: true,
            includeKeyQuotes: true,
            includeSocialPost: true,
            includeBlogPost: true,
            maxQuotes: 5,
            maxSummaryLength: 250
          }
        );
        
        // Dismiss processing toast
        toast.dismiss("processing");
        
        if (result.success === false) {
          throw new Error(result.error || 'Processing failed');
        }
        
        // Show success and refresh history
        toast.success("Content processed successfully!");
        
        // Fetch updated history
        const historyData = await apiClient.content.getHistory();
        setHistory(historyData || []);
        
        // Update remaining uploads
        setRemainingUploads(prev => Math.max(0, prev - 1));
        
        // Reset form
        setUrl("");
        setSelectedFile(null);
      } catch (processingError: any) {
        // Dismiss processing toast
        toast.dismiss("processing");
        console.error('Processing error:', processingError);
        
        // Show specific error message
        toast.error(`Processing failed: ${processingError.message || 'Unknown error'}`);
        
        // Still refresh history as a failed item might have been created
        try {
          const historyData = await apiClient.content.getHistory();
          setHistory(historyData || []);
        } catch (historyError) {
          console.error('Failed to refresh history after processing error:', historyError);
        }
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(`Error: ${error.message || 'Something went wrong'}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Function to handle file submission
  const handleFileSubmit = () => {
    handleSubmit();
  };
  
  // Status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Processing</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get icon based on source type
  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "youtube":
        return <LinkIcon className="h-4 w-4 text-red-500" />;
      case "audio":
        return <FileAudio className="h-4 w-4 text-blue-500" />;
      case "video":
        return <FileVideo className="h-4 w-4 text-purple-500" />;
      default:
        return <FileAudio className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Format date helper
  const formatDate = (date: Date | string) => {
    if (!date) return 'Unknown date';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      // Check if date is valid
      if (isNaN(dateObj.getTime())) return 'Unknown date';
      
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch (e) {
      return 'Unknown date';
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-12 px-4">
      {/* Hero Section */}
      <div className="relative mb-12 overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-background/20 to-accent/5 border border-border/40 p-8 shadow-sm">
        <div className="absolute inset-0 bg-grid-black/[0.02] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
            <p className="text-muted-foreground max-w-lg">Transform content into summaries, key quotes, and more with AI-powered analysis.</p>
            
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Badge variant="outline" className="px-2 py-0.5 bg-primary/5 border-primary/20 text-primary">
                  {remainingUploads}/{maxUploads}
                </Badge>
                <span>Uploads remaining today</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>{history.length} Total processed</span>
              </div>
              
              {history.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last activity: {formatDate(history[0].processedAt || history[0].createdAt || '')}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-auto">
            <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Process New Content</CardTitle>
                <CardDescription>Enter a link or upload a document</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full">
                    <Button
                      type="button"
                      onClick={() => setUploadType("link")}
                      variant="ghost"
                      className={cn(
                        "h-8 rounded-md px-3",
                        uploadType === "link" && 
                          "bg-background text-foreground shadow-sm"
                      )}
                    >
                      <LinkIcon className="mr-2 h-4 w-4" /> Link
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setUploadType("file")}
                      variant="ghost"
                      className={cn(
                        "h-8 rounded-md px-3",
                        uploadType === "file" && 
                          "bg-background text-foreground shadow-sm"
                      )}
                    >
                      <FileText className="mr-2 h-4 w-4" /> File
                    </Button>
                  </div>
                </div>
                
                {uploadType === "link" ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Input 
                        placeholder="Enter YouTube or article URL" 
                        value={url} 
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSubmit} 
                        disabled={!url || isUploading}
                        className="shrink-0"
                      >
                        {isUploading ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                          </>
                        ) : "Process"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      className="relative border-2 border-dashed rounded-lg py-8 px-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <div className="absolute inset-0 bg-grid-black/[0.02] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
                      <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                      <div className="text-sm font-medium text-center">
                        {selectedFile ? selectedFile.name : "Drop files here or click to upload"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        Supported formats: PDF, DOCX, TXT (Max 10MB)
                      </p>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                      />
                    </div>
                    <Button
                      onClick={handleFileSubmit}
                      disabled={!selectedFile || isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Processing
                        </>
                      ) : "Process Document"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* History Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Content History</h2>
          <Button variant="outline" size="sm" className="h-9">
            <Clock className="mr-2 h-4 w-4" /> View All
          </Button>
        </div>
        
        {isLoadingHistory ? (
          <div className="flex justify-center py-10">
            <div className="flex flex-col items-center">
              <Clock className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading your content history...</p>
            </div>
          </div>
        ) : history.length === 0 ? (
          <Card className="border border-dashed p-8 text-center bg-muted/30">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">No content history</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Process some content to see your history here.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {history.map((item) => (
              <Link 
                key={item.id} 
                href={`/summary/${item.id}`}
                className="block"
              >
                <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-200 border-border/40">
                  <div className={cn(
                    "h-1 w-full", 
                    item.status === "completed" ? "bg-green-500" : 
                    item.status === "processing" ? "bg-yellow-500" : 
                    "bg-red-500"
                  )} />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getSourceIcon(item.sourceType)}
                        <CardTitle className="text-base font-semibold truncate">
                          {item.contentMetadata?.title || 
                            (item.sourceType === "youtube" && item.originalContent ? 
                              `YouTube Video: ${extractVideoId(item.originalContent)}` : 
                              `${(item.sourceType ? item.sourceType.charAt(0).toUpperCase() + item.sourceType.slice(1) : 'Unknown')} Content`
                            )
                          }
                        </CardTitle>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <CardDescription className="text-xs mt-1.5">
                      Processed on {formatDate(item.processedAt || item.createdAt || '')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-5">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.summary || "No summary available"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Export the dashboard page with error boundary
export default function DashboardPage() {
  return (
    <ClientPageWrapper>
      <DashboardContent />
    </ClientPageWrapper>
  );
}
