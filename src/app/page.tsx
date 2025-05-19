"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the landing page when someone visits the homepage
    router.replace('/landing');
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-28 lg:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />
        
        {/* Background grid pattern */}
        <div className="absolute inset-0 bg-grid-black/[0.02] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        
        {/* Accent circle */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        
        <div className="container px-4 md:px-6 relative">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="flex flex-col justify-center space-y-8">
              <div className="flex flex-col space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-6xl">
                  <span className="text-[#1775f5]">Snip</span>It
                </h1>
                <div className="inline-flex items-center rounded-full bg-[#1775f5]/10 px-3 py-1 text-sm font-medium text-[#1775f5] max-w-fit">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  <span>AI-Powered Content Processing</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-6xl">
                  Transform Content into
                  <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent font-extrabold">
                    Actionable Insights
                  </span>
                </h1>
                <p className="max-w-[600px] text-lg md:text-xl text-muted-foreground">
                  SnipIt uses advanced AI to convert videos, podcasts, and long articles into concise summaries, key quotes, and ready-to-share content.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-12 px-6 font-medium shadow-lg" asChild>
                  <Link href="/register">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-6 font-medium" asChild>
                  <Link href="/dashboard">Try Demo</Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-8 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={cn(
                      "h-8 w-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium",
                      i === 1 ? "bg-red-400" : 
                      i === 2 ? "bg-blue-400" : 
                      i === 3 ? "bg-green-400" : 
                      "bg-purple-400"
                    )}>
                      {i === 1 ? 'JD' : i === 2 ? 'MK' : i === 3 ? 'RS' : 'AL'}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong className="font-semibold text-foreground">1,000+</strong> professionals saving time
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-br from-primary/10 via-white/5 to-accent/10 rounded-full blur-3xl opacity-30" />
              
              <div className="w-full max-w-lg rounded-xl border border-border/40 bg-background/80 backdrop-blur-sm shadow-xl overflow-hidden">
                <div className="border-b border-border/30 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Video Summary</div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">How to Build a Startup in 2025</h3>
                      <p className="text-xs text-muted-foreground">12 min video → 2 min read</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">AI Summary</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>This video outlines five key strategies for building successful startups in 2025:</p>
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>Focus on solving specific pain points within emerging markets</li>
                        <li>Adopt lean methodology with rapid iteration cycles</li>
                        <li>Prioritize sustainable growth over vanity metrics</li>
                        <li>Leverage AI capabilities as a competitive advantage</li>
                        <li>Build remote-first culture to access global talent</li>
                      </ol>
                      <p className="pt-2">The speaker emphasizes that successful founders will be those who combine technical innovation with deep customer understanding.</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-border/40 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy
                      </Button>
                      <div className="text-xs text-muted-foreground">Generated in 8.3s</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Feature Cards Section */}
      <section className="w-full py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-black/[0.02]" />
        
        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col items-center space-y-4 text-center mb-12">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              <span>Powerful Features</span>
            </div>
            <div className="space-y-2 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl/tight">
                Everything you need to process content efficiently
              </h2>
              <p className="text-muted-foreground md:text-lg">
                Our AI-powered platform helps you extract value from long-form content in seconds
              </p>
            </div>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-8">
            <Card className="group bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-border/40">
              <CardHeader>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <Upload className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">Any Content</CardTitle>
                <CardDescription>Support for videos, podcasts, articles and more</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>YouTube videos</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Audio files (MP3, WAV)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Long-form articles</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Documents & PDFs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="group bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-border/40">
              <CardHeader>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <Zap className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">AI Summaries</CardTitle>
                <CardDescription>Transform hours of content into minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Concise executive summaries</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Main points & key insights</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Context-aware processing</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Customizable length</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="group bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-border/40">
              <CardHeader>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">Key Quotes</CardTitle>
                <CardDescription>Extract the most important moments</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Timestamped quotes</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Categorized by topic</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>One-click copying</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Citation formats</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="group bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-border/40">
              <CardHeader>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <Share2 className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">Share Ready</CardTitle>
                <CardDescription>Format content for any platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Twitter/X posts</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>LinkedIn articles</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Blog post formats</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Email newsletters</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="group bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-border/40">
              <CardHeader>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <Clock className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">Lightning Fast</CardTitle>
                <CardDescription>Process hours of content in seconds</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Under 15 seconds processing</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Batch processing</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Background processing</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Email notifications</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="group bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-border/40">
              <CardHeader>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">Save & Organize</CardTitle>
                <CardDescription>Create your knowledge library</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Custom collections</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Advanced search</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Tagging system</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Export options</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-20 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center mb-12">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              <span>Trusted by Professionals</span>
            </div>
            <div className="space-y-2 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl/tight">
                See what our users say
              </h2>
              <p className="text-muted-foreground md:text-lg">
                Join thousands of professionals who save time with SnipIt
              </p>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-background border-border/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-full bg-blue-100 text-blue-800 h-10 w-10 flex items-center justify-center font-bold">MK</div>
                  <div>
                    <h4 className="font-semibold">Michael Kim</h4>
                    <p className="text-sm text-muted-foreground">Content Strategist</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">"SnipIt has transformed how I stay up-to-date with industry trends. I can process 5X more content in the same amount of time."</p>
              </CardContent>
            </Card>
            
            <Card className="bg-background border-border/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-full bg-green-100 text-green-800 h-10 w-10 flex items-center justify-center font-bold">RS</div>
                  <div>
                    <h4 className="font-semibold">Rachel Smith</h4>
                    <p className="text-sm text-muted-foreground">Marketing Director</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">"The social media post generator alone is worth the subscription. It saves me hours each week creating content for our channels."</p>
              </CardContent>
            </Card>
            
            <Card className="bg-background border-border/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-full bg-purple-100 text-purple-800 h-10 w-10 flex items-center justify-center font-bold">JD</div>
                  <div>
                    <h4 className="font-semibold">James Davis</h4>
                    <p className="text-sm text-muted-foreground">Product Manager</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">"I use SnipIt to keep track of competitor product updates. The key quotes feature helps me extract exactly what matters."</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="w-full py-20">
        <div className="container px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/40 p-8 md:p-10 lg:p-16">
            <div className="absolute inset-0 bg-grid-white/[0.02]" />
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
            
            <div className="relative max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
                Ready to save hours on content consumption?
              </h2>
              <p className="text-muted-foreground md:text-lg mb-8">
                Join thousands of professionals who use SnipIt to process content faster and extract more value.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-12 px-6 font-medium shadow-lg" asChild>
                  <Link href="/register">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-6 font-medium" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">
                No credit card required. Free plan includes 5 uploads per day.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
