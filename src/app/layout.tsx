import './globals.css'
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navbar } from '@/components/navigation/navbar';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/components/auth/auth-provider';
import ClientLayout from '@/components/client-layout';
import { Analytics } from "@vercel/analytics/react";

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
      <body className={`${inter.className} bg-background text-foreground min-h-screen flex flex-col`}>
        <ClientLayout>
          <AuthProvider>
            {/* Add gradient background effect to header */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" aria-hidden="true" />
            
            <Navbar />
            <main className="flex-1 w-full">
              {children}
            </main>
            
            {/* Add subtle footer accent */}
            <footer className="border-t border-border/40 mt-auto py-6 text-center text-sm text-muted-foreground">
              <div className="container mx-auto px-4">
                <p>© {new Date().getFullYear()} SnipIt. All rights reserved.</p>
              </div>
            </footer>
            
            <Toaster richColors position="bottom-right" />
          </AuthProvider>
        </ClientLayout>
        <Analytics />
      </body>
    </html>
  );
}
