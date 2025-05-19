import './globals.css'
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navbar } from '@/components/navigation/navbar';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/components/auth/auth-provider';
import ClientLayout from '@/components/client-layout';

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
  title: 'SnipIt - AI-powered Content Summarization',
  description: 'Turn any long-form content into concise summaries, key quotes, and social media posts with SnipIt.',
  metadataBase: new URL('https://snipit.ai'),
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://snipit.ai',
    title: 'SnipIt - AI-powered Content Summarization',
    description: 'Transform content into concise summaries and insights instantly',
    images: [{ url: '/og-image.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnipIt - AI-powered Content Summarization',
    description: 'Transform content into concise summaries and insights instantly',
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
      </body>
    </html>
  );
}
