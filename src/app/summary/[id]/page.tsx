"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Clock, Copy, Download, Share2, Loader2, ExternalLink, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Improved type definition for summary data
interface SummaryData {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl: string;
  duration: string;
  dateProcessed: string;
  summary: string;
  keyQuotes: Array<{ text: string; timestamp?: string }>;
  socialPost: string;
  blogPost: string;
  // Flag indicating if this content was generated in real-time by AI
  isRealAiContent?: boolean;
  // Flag indicating if this is mock fallback data due to API failure
  isMockFallback?: boolean;
}

export default function SummaryPage() {
  // Use next/navigation's useParams hook instead of React.use()
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("summary");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Debug mode toggle for detailed logging
  const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_AI === 'true';

  // Fetch the summary data based on ID
  useEffect(() => {
    // Maximum number of retry attempts
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // ms
    
    // Helper function to delay execution
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Validate the response data structure with support for multiple response formats
    const validateResponseData = (data: any): boolean => {
      // Check for required fields and proper structure
      if (!data || typeof data !== 'object') return false;
      if (data.error) return false; // Error responses are handled separately
      
      // Handle different API response formats
      
      // Format 1: New API structure with data property
      if (data.success && data.data && typeof data.data === 'object') {
        const item = data.data;
        // Check for essential properties in the data object
        return !!item.id && !!item.sourceType && (!!item.summary || !!item.keyQuotes);
      }
      
      // Format 2: Legacy API structure with item property
      if (data.success && data.item && typeof data.item === 'object') {
        const item = data.item;
        // Check for essential properties in the item object
        return !!item.id && (!!item.contentType || !!item.sourceType) && 
               (!!item.originalContent || !!item.summary || !!item.keyQuotes);
      }
      
      // Format 3: Direct data object (emergency fallback format)
      if (data.id && typeof data === 'object') {
        // Check for essential properties directly in the data object
        return !!(data.id) && !!(data.summary || data.keyQuotes);
      }
      
      return false;
    };
    
    // Fetch summary data from API with retry logic
    const fetchSummary = async (retryCount = 0) => {
      setLoading(true);
      if (retryCount === 0) setError(""); // Only clear errors on first attempt
        
      if (DEBUG_MODE) {
        console.log(`🔍 DEBUG: Starting API request for summary ID: ${id} (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
        console.time(`summary-fetch-attempt-${retryCount}`);
        console.log('🔴 FORCE REAL AI: Adding cache-busting parameters to ensure fresh content');
      }
      
      try {
        // Add cache-busting timestamp to force fresh AI generation every time
        const timestamp = Date.now();
        
        if (DEBUG_MODE) {
          console.log(`🔍 DEBUG: Fetching summary with URL: /api/history/${id}?force=true&t=${timestamp}`);
        }
        
        // Wrap fetch in a try/catch to handle network errors
        let response;
        try {
          response = await fetch(`/api/history/${id}?force=true&t=${timestamp}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          
          if (DEBUG_MODE) {
            console.log(`🔍 DEBUG: API response status: ${response.status}`);
          }
        } catch (fetchError) {
          console.error('Network error when fetching summary:', fetchError);
          
          // Retry on network errors if we haven't exceeded max retries
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying after network error (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            toast.error(`Network error. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
            return fetchSummary(retryCount + 1);
          }
          
          toast.error('Failed to connect to the server after multiple attempts');
          setError('Network error: Unable to connect to the API. Please check your internet connection.');
          setLoading(false);
          return;
        }
        
        // Handle HTTP error responses
        if (!response.ok) {
          const errorMessage = `Failed to fetch summary: ${response.status} ${response.statusText}`;
          console.error(errorMessage);
          
          // Retry on server errors (5xx) if we haven't exceeded max retries
          if (response.status >= 500 && retryCount < MAX_RETRIES) {
            console.log(`Retrying after server error (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            toast.error(`Server error. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
            return fetchSummary(retryCount + 1);
          }
          
          // Show appropriate error based on status code
          if (response.status === 401 || response.status === 403) {
            toast.error('Authentication error. Please log in again.');
          } else if (response.status === 404) {
            toast.error('Summary not found. It may have been deleted.');
          } else if (response.status >= 500) {
            toast.error('Server error. Please try again later.');
          } else {
            toast.error(`Error: ${response.status} ${response.statusText}`);
          }
          
          setError(errorMessage);
          setLoading(false);
          return;
        }
        
        // Parse the JSON response with error handling
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Error parsing API response:', jsonError);
          
          // Retry on JSON parse errors if we haven't exceeded max retries
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying after JSON parse error (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            toast.error(`Invalid response format. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
            return fetchSummary(retryCount + 1);
          }
          
          toast.error('The server returned an invalid response');
          setError('Error parsing API response. The server returned an invalid response.');
          setLoading(false);
          return;
        }
        
        if (DEBUG_MODE) {
          console.log('🔍 DEBUG: Raw API response:', data);
          console.log('🔍 DEBUG: Response contains real AI content:', 
            data.item?.isRealAiContent ? 'YES ✅' : 'NO ❌');
          console.timeEnd(`summary-fetch-attempt-${retryCount}`);
        }
        
        // Enhanced empty response handling with multiple fallback strategies
        if (!data || Object.keys(data).length === 0) {
          console.error('Empty API response:', data);
          
          // Try to use localStorage history cache first if available
          let cachedSummary = null;
          try {
            if (typeof window !== 'undefined') {
              const cachedData = localStorage.getItem(`summary_${id}`);
              if (cachedData) {
                cachedSummary = JSON.parse(cachedData);
                console.log('Found cached summary data:', cachedSummary);
              }
            }
          } catch (cacheError) {
            console.warn('Error accessing summary cache:', cacheError);
          }
          
          // Retry on empty responses if we haven't exceeded max retries and no cache is available
          if (retryCount < MAX_RETRIES && !cachedSummary) {
            console.log(`Retrying after empty response (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            toast.error(`Empty response. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
            return fetchSummary(retryCount + 1);
          }
          
          // If we have a cached version, use it
          if (cachedSummary) {
            console.log('Using cached summary data as fallback');
            toast.info('Using cached version due to API issues');
            setSummary(cachedSummary);
            setLoading(false);
            return;
          }
          
          // Last resort: Use completely fabricated fallback data
          console.log('Using emergency fallback content for empty response');
          toast.error('API unavailable - using emergency fallback content');
          
          const fallbackData: SummaryData = {
            id: id,
            title: "Emergency Fallback Content",
            sourceType: "text",
            sourceUrl: "",
            duration: "N/A",
            dateProcessed: new Date().toISOString(),
            summary: "This is emergency fallback content created because the API returned an empty response. The system is using locally generated data instead of server-processed content.",
            keyQuotes: [
              { text: "This is emergency fallback content due to API issues.", timestamp: "N/A" },
              { text: "The server returned an empty response.", timestamp: "N/A" },
              { text: "Please try again later when the service is restored.", timestamp: "N/A" }
            ],
            socialPost: "[EMERGENCY FALLBACK] This content was generated locally because the API service is currently unavailable.",
            blogPost: "# Emergency Fallback Content\n\nThis content was generated locally because the API returned an empty response. Please try again later when the service is restored.",
            isRealAiContent: false,
            isMockFallback: true
          };
          
          setSummary(fallbackData);
          setLoading(false);
          return;
        }
        
        // Check if the response contains an error message
        if (data.error) {
          console.error('API returned an error:', data.error);
          toast.error(`API Error: ${data.error}`);
          setError(`API Error: ${data.error}`);
          setLoading(false);
          return;
        }
        
        // Validate the response data structure
        if (!validateResponseData(data)) {
          console.error('Invalid API response format:', data);
          
          // Retry on invalid response format if we haven't exceeded max retries
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying after invalid response format (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            toast.error(`Invalid response format. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
            return fetchSummary(retryCount + 1);
          }
          
          toast.error('The server returned an invalid response format');
          setError('Invalid response format from API. The server returned an unexpected data structure.');
          setLoading(false);
          return;
        }
        
        try {
          // Now that we have valid data, process it based on the format
          let summaryData;
          
          // Determine the correct data structure
          if (data.success && data.data && typeof data.data === 'object') {
            // Format 1: New API structure with data property
            summaryData = data.data;
            if (DEBUG_MODE) console.log('🔍 Using Format 1: data.success.data structure');
          } else if (data.success && data.item && typeof data.item === 'object') {
            // Format 2: Legacy API structure with item property
            summaryData = data.item;
            if (DEBUG_MODE) console.log('🔍 Using Format 2: data.success.item structure');
          } else if (data.id && typeof data === 'object') {
            // Format 3: Direct data object
            summaryData = data;
            if (DEBUG_MODE) console.log('🔍 Using Format 3: direct data object structure');
          } else {
            console.error('Unable to extract summary data from response:', data);
            setError('Unable to extract summary data from the API response.');
            setLoading(false);
            return;
          }
          
          if (DEBUG_MODE) {
            console.log('🔍 DEBUG: Extracted summary data:', summaryData);
          }

          // Map the extracted data to our expected format with fallbacks for missing properties
          const processedSummary = {
            id: summaryData.id || id,
            title: summaryData.title || summaryData.contentMetadata?.title || 'Untitled Content',
            sourceType: summaryData.sourceType || summaryData.contentType || 'text',
            sourceUrl: summaryData.sourceUrl || summaryData.originalContent || '',
            duration: summaryData.duration || summaryData.contentMetadata?.duration || 'N/A',
            dateProcessed: summaryData.dateProcessed || summaryData.processedAt || new Date().toISOString(),
            summary: summaryData.summary || 'No summary available.',
            keyQuotes: Array.isArray(summaryData.keyQuotes) ? summaryData.keyQuotes : [],
            socialPost: summaryData.socialPost || '',
            blogPost: summaryData.blogPost || '# No Content Available\n\nNo blog content was generated for this item.',
            isRealAiContent: !!summaryData.isRealAiContent,
            isMockFallback: !!summaryData.isMockFallback
          };
          
          // Cache successful responses to help with future empty responses
          try {
            if (typeof window !== 'undefined' && !processedSummary.isMockFallback) {
              localStorage.setItem(`summary_${id}`, JSON.stringify(processedSummary));
              if (DEBUG_MODE) console.log('💾 Cached summary data for future use');
            }
          } catch (cacheError) {
            console.warn('Error caching summary data:', cacheError);
          }
          
          setSummary(processedSummary);
          
          if (DEBUG_MODE) {
            console.log('✅ Processed summary data successfully');
          }
        } catch (mappingError) {
          console.error('Error mapping API response to summary data:', mappingError);
          setError('Error processing the summary data. Please try again later.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading summary:', error);
        setError('An error occurred while loading the summary');
      } finally {
        setLoading(false);
        if (DEBUG_MODE) {
          console.timeEnd('summary-fetch');
        }
      }
    }
    
    fetchSummary();
  }, [id, DEBUG_MODE]);
  
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };
  
  const handleDownload = (content: string, fileName: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`${fileName} downloaded`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Main render with improved conditional states
  return (
    <div className="container max-w-6xl mx-auto py-12 px-4 relative">
      {/* Background subtle gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none rounded-lg" aria-hidden="true" />
      
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] bg-background/50 backdrop-blur-sm border border-border/30 rounded-xl shadow-sm px-6 py-20">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-primary/20 blur animate-pulse" />
            <Loader2 className="h-14 w-14 animate-spin text-primary relative" />
          </div>
          <p className="mt-6 text-xl font-medium">Preparing your insights...</p>
          <p className="text-muted-foreground mt-2">Generating AI content in real-time</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background/50 backdrop-blur-sm border border-destructive/20 rounded-xl shadow-sm px-6 py-20">
          <div className="text-destructive mb-4 text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">
            {error.includes('API') ? 'AI Service Unavailable' : 'Unable to Load Summary'}
          </h2>
          
          <div className="mb-6 max-w-md text-center">
            <p className="text-muted-foreground">{error}</p>
            
            {error.includes('API') && (
              <div className="mt-4 text-sm bg-background/80 p-3 rounded-md border border-border text-left">
                <h3 className="font-medium mb-1">Troubleshooting Tips:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Verify your OpenAI API key in the .env.local file</li>
                  <li>Check if your API key has sufficient credits</li>
                  <li>OpenAI services might be experiencing high load</li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mt-2">
            <Button size="lg" onClick={() => {
              // Reset error state and try again
              setError("");
              setLoading(true);
              setTimeout(() => window.location.reload(), 500);
            }}>
              <div className="animate-bounce mr-2">🔄</div> Try Again
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
            </Button>
          </div>
        </div>
      ) : summary ? (
        <div className="bg-background/70 backdrop-blur-sm border border-border/30 rounded-xl shadow-sm px-8 py-12" data-component-name="SummaryPage">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="ghost" 
                className="group flex items-center gap-1 hover:bg-primary/5 transition-all"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
                <span>Back to Dashboard</span>
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>View Source</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View original content</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{summary?.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <Badge variant="secondary" className="px-2 py-1 bg-primary/5 hover:bg-primary/10">
                {summary?.sourceType}
              </Badge>
              
              {summary?.duration && (
                <div className="flex items-center text-muted-foreground">
                  <Clock className="mr-1.5 h-3.5 w-3.5" /> 
                  <span>{summary.duration}</span>
                </div>
              )}
              
              <div className="flex items-center text-muted-foreground">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                <span>Processed {formatDate(summary?.dateProcessed || '')}</span>
              </div>
            </div>
            
            <div className="mt-5 w-full h-px bg-gradient-to-r from-border/0 via-border to-border/0" />
          </div>

            <Tabs defaultValue="summary" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 mb-8 shadow-sm">
                <TabsTrigger 
                  value="summary" 
                  className={cn(
                    "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  )}
                >
                  <span className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">1</span>
                  <span>Summary</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="key-quotes"
                  className={cn(
                    "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  )}
                >
                  <span className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">2</span>
                  <span>Key Quotes</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="social-post"
                  className={cn(
                    "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  )}
                >
                  <span className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">3</span>
                  <span>Social Media</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="blog-post"
                  className={cn(
                    "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  )}
                >
                  <span className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">4</span>
                  <span>Blog Post</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-0">
                <Card className="overflow-hidden border-border/40 shadow-lg">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-accent" />
                  
                  <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b border-border/30 pb-5">
                    <div>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${summary?.isRealAiContent ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : summary?.isMockFallback ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-primary/10 text-primary'} text-xs font-medium`}>
                          {summary?.isRealAiContent ? 'LIVE' : summary?.isMockFallback ? 'MOCK' : 'AI'}
                        </span>
                        Smart Summary
                        {summary?.isRealAiContent && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-pulse">Real-time AI</span>
                        )}
                        {summary?.isMockFallback && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Emergency Fallback</span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">
                        {summary?.isRealAiContent 
                          ? 'Freshly generated with Hugging Face' 
                          : summary?.isMockFallback
                          ? 'Mock data (API service unavailable)'
                          : 'Generated from your content'}
                      </CardDescription>
                    </div>
                    
                    <div className="flex space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => summary && handleCopy(summary.summary, "Summary")} 
                              className="hover:bg-primary/5"
                            >
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Copy summary</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy summary</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                          
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => summary && handleDownload(summary.summary, "summary.txt")} 
                              className="hover:bg-primary/5"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download as TXT</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6 pb-8 px-6">
                    <div className="prose prose-slate max-w-none">
                      {!summary?.summary ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="text-4xl mb-3">😢</div>
                          <h3 className="text-lg font-medium mb-2">No AI content available</h3>
                          <p className="text-muted-foreground mb-6">Unable to generate AI content for this item.</p>
                          <div className="flex gap-3 flex-wrap justify-center">
                            <Button onClick={() => {
                              setLoading(true);
                              setTimeout(() => window.location.reload(), 500);
                            }}>
                              <div className="animate-bounce mr-2">🔄</div> Regenerate Content
                            </Button>
                            <Button variant="outline" onClick={() => {
                              const url = new URL(window.location.href);
                              url.searchParams.set('fallback', 'true');
                              window.location.href = url.toString();
                            }}>
                              Use Emergency Fallback
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {summary?.isRealAiContent && (
                            <div className="mb-4 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-md flex items-center">
                              <span className="text-green-600 dark:text-green-400 text-sm flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                This content was freshly generated by Hugging Face AI
                              </span>
                            </div>
                          )}
                          {summary?.isMockFallback && (
                            <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-md">
                              <span className="text-amber-600 dark:text-amber-400 text-sm flex items-center mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Emergency Fallback Mode - Mock Data
                              </span>
                              <p className="text-amber-700 dark:text-amber-300 text-xs">This is mock data shown because the AI service is currently unavailable. The content is not AI-generated.</p>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed text-base">{summary?.summary}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="key-quotes" className="mt-0">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Key Quotes with Timestamps</CardTitle>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => summary && handleCopy(
                          summary.keyQuotes.map(q => `"${q.text}" [${q.timestamp || 'unknown'}]`).join('\n\n'), 
                          "Key quotes"
                        )}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy All
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => summary && handleDownload(
                          summary.keyQuotes.map(q => `"${q.text}" [${q.timestamp || 'unknown'}]`).join('\n\n'), 
                          "key-quotes.txt"
                        )}
                      >
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {summary?.keyQuotes?.map((quote, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex justify-between items-start">
                          <p className="text-foreground italic">"{quote.text}"</p>
                          {quote.timestamp && (
                            <Badge className="ml-4 shrink-0 cursor-pointer hover:bg-primary" onClick={() => handleCopy(quote.timestamp || '', "Timestamp")}>
                              {quote.timestamp}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="social-post" className="mt-0">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Social Media Post</CardTitle>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => summary && handleCopy(summary.socialPost, "Social Post")}>
                        <Copy className="mr-2 h-4 w-4" /> Copy
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => summary && handleDownload(summary.socialPost, "social-post.txt")}
                      >
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 border rounded-xl bg-card">
                      <p className="text-foreground leading-7 whitespace-pre-wrap">{summary?.socialPost}</p>
                    </div>
                    <div className="mt-6 flex justify-center space-x-4">
                      <Button className="bg-blue-500 hover:bg-blue-600">
                        <Share2 className="mr-2 h-4 w-4" /> Share to Twitter
                      </Button>
                      <Button className="bg-blue-700 hover:bg-blue-800">
                        <Share2 className="mr-2 h-4 w-4" /> Share to LinkedIn
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="blog-post" className="mt-0">
                <Card className="overflow-hidden border-border/40 shadow-lg">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-accent" />
                  
                  <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b border-border/30 pb-5">
                    <div>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">AI</span>
                        Blog Post
                      </CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">Ready-to-publish article based on your content</CardDescription>
                    </div>
                    
                    <div className="flex space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => summary && handleCopy(summary.blogPost, "Blog Post")} 
                              className="hover:bg-primary/5"
                            >
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Copy blog post</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy as text</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => summary && handleDownload(summary.blogPost, "blog-post.md")} 
                              className="hover:bg-primary/5"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download as Markdown</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6 pb-8 px-6">
                    <div className="p-6 bg-white rounded-lg border border-border/30 shadow-sm">
                      <article className="prose prose-slate prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-gray-800 prose-p:text-gray-600 prose-a:text-primary prose-a:no-underline hover:prose-a:underline max-w-none">
                        <div className="whitespace-pre-wrap">{summary?.blogPost}</div>
                        
                        <h2>Vertical-Specific Approach</h2>
                        <p>The era of broad horizontal SaaS solutions is giving way to vertical-specific tools that deeply understand particular industries. By focusing on a specific vertical, you can tailor features, terminology, and workflows to match exact user needs.</p>
                        
                        <h2>Product-Led Growth Strategy</h2>
                        <p>Users now expect to try software before purchasing. Implement a frictionless self-service onboarding experience, provide transparent pricing, and create excellent documentation. The product itself should drive user acquisition and expansion.</p>
                        
                        <h2>Security and Compliance</h2>
                        <p>Security is no longer optional or a late-stage concern. Modern SaaS products must prioritize data protection, privacy, and compliance from day one. SOC 2 compliance is becoming necessary earlier in a company's lifecycle.</p>
                        
                        <h2>Community Building</h2>
                        <p>Build a community around your product through content marketing, webinars, and user forums. Establishing thought leadership in your domain helps attract users and builds trust in your solution.</p>
                        
                        <h2>Conclusion</h2>
                        <p>While technologies and market expectations continue to evolve, the fundamentals remain the same: deliver value by solving real problems. By focusing on these key areas, entrepreneurs can build SaaS products that thrive in 2025 and beyond.</p>
                      </article>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="container py-10">
            <Card className="p-6 bg-red-50 border-red-200">
              <CardTitle className="text-red-600 mb-2">Error Loading Summary</CardTitle>
              <p>{error || 'Unknown error occurred while loading the summary'}</p>
            </Card>
          </div>
        )}
      </div>
    );
}
