'use client';

import React from 'react';
import { ApiErrorBoundary } from '@/components/error/api-error-boundary';

/**
 * Client-side wrapper with error boundary for page components
 */
export function ClientPageWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ApiErrorBoundary
      fallback={
        <div className="p-8 bg-background">
          <div className="p-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <h2 className="text-2xl font-semibold text-red-800 dark:text-red-300 mb-4">
              Something went wrong
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-4">
              We're having trouble loading this page. Please try refreshing the page or navigating back to the dashboard.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80"
              >
                Refresh Page
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ApiErrorBoundary>
  );
}
