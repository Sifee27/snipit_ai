import './globals.css'
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navbar } from '@/components/navigation/navbar';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/components/auth/auth-provider';
import ClientLayout from '@/components/client-layout';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

// Load Inter with all weights for better typography control
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'SnipIt - AI Summarizer for Podcasts, Videos & Articles | Save Time',
  description: 'SnipIt uses AI to summarize podcasts, videos, and articles in seconds. Get key insights from hours of content in minutes. The best AI summary tool for busy professionals and students.',
  metadataBase: new URL('https://snipit.ai'),
  manifest: '/manifest.json',
  keywords: [
    'AI summarizer', 'podcast summary tool', 'video content summarization', 
    'article summary generator', 'content summarizer AI', 'audio to text summary',
    'text summarization tool', 'video summarizer', 'AI content insights',
    'podcast key points', 'automated content summarization'
  ],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://snipit.ai',
    title: 'SnipIt - AI Summarizer for Podcasts, Videos & Articles',
    description: 'Save 80% of your time. SnipIt uses advanced AI to transform hours of podcasts, videos, and articles into concise, actionable summaries in seconds.',
    images: [{ url: '/og-image.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnipIt - AI Summarizer for Podcasts, Videos & Articles',
    description: 'Save 80% of your time. SnipIt uses advanced AI to transform hours of podcasts, videos, and articles into concise, actionable summaries in seconds.',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Add script to handle theme before page renders to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Check for saved theme preference or use system preference
                  const savedTheme = localStorage.getItem('theme');
                  if (savedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (savedTheme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    // Use system preference
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.toggle('dark', prefersDark);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-background text-foreground min-h-screen flex flex-col`}>
        <ClientLayout>
          <AuthProvider>
            {/* Add gradient background effect to header */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" aria-hidden="true" />
            
            <Navbar />
            <main className="flex-1 w-full">
              {children}
            </main>
            
            {/* Minimal MVP Footer */}
            <footer className="relative mt-16 border-t border-border/40 bg-gradient-to-b from-background/80 to-background/50 backdrop-blur-sm">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_95%,transparent)] dark:bg-grid-black/10" aria-hidden="true"></div>
              
              <div className="container mx-auto px-4 py-8 relative">
                <div className="flex flex-col items-center gap-6">
                  {/* Logo and tagline */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 mb-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">SnipIt</span>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">AI-powered content summarization for the modern web.</p>
                  </div>
                  
                  {/* Quick Product Links */}
                  <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                    <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                    <a href="#waitlist" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Join Waitlist</a>
                  </div>
                  
                  {/* Social Links */}
                  <div className="flex items-center gap-4">
                    <a href="https://x.com/SnipIt_Ai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                      </svg>
                    </a>
                    <a href="https://www.instagram.com/snipit_ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                      </svg>
                    </a>
                  </div>
                  
                  {/* Copyright */}
                  <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} SnipIt. All rights reserved.</p>
                </div>
              </div>
            </footer>
            
            <Toaster richColors position="bottom-right" />
          </AuthProvider>
        </ClientLayout>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
