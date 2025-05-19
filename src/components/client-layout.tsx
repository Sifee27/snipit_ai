'use client';

import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { NetworkStatusProvider } from '@/components/network/network-status';
import { ApiErrorBoundary } from '@/components/error/api-error-boundary';

/**
 * Client-only layout component to solve hydration issues
 * This prevents mismatches between server and client rendering
 * by taking full control of the HTML tag rendering
 */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // Use a state to track client-side rendering
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to true once component mounts on the client
  useEffect(() => {
    setIsMounted(true);
    
    // Add any client-side only classes to the HTML element
    const htmlElement = document.documentElement;
    if (htmlElement && !htmlElement.className) {
      htmlElement.className = ''; // Ensure consistent empty string instead of undefined
    }
  }, []);

  // During SSR and initial client render, return a simplified version
  // that won't cause hydration mismatches
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <NetworkStatusProvider>
        <ApiErrorBoundary>
          {children}
        </ApiErrorBoundary>
      </NetworkStatusProvider>
    </ThemeProvider>
  );
}
