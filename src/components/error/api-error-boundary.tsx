'use client';

import React, { useState, useEffect } from 'react';
import { ApiError } from '@/lib/api-client';

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  resetOnRouteChange?: boolean;
}

/**
 * API Error Boundary component for catching and handling API errors gracefully
 */
export function ApiErrorBoundary({
  children,
  fallback,
  onError,
  resetOnRouteChange = true,
}: ApiErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  // Reset error when route changes
  useEffect(() => {
    if (!resetOnRouteChange) return;

    const handleRouteChange = () => {
      setError(null);
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [resetOnRouteChange]);

  // Handler function to catch errors from child components
  const handleCatchError = (error: Error) => {
    console.error('API Error caught by boundary:', error);
    setError(error);
    onError?.(error);
  };

  // Let children handle errors if they can
  if (error) {
    // If a fallback UI is provided, render it
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default fallback UI
    return (
      <div className="p-4 my-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
          {error instanceof ApiError ? 'API Error' : 'Application Error'}
        </h3>
        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
          <p>
            {error instanceof ApiError 
              ? `${error.message} (Status: ${error.statusCode})`
              : error.message || 'An unknown error occurred'}
          </p>
          {error instanceof ApiError && error.details && (
            <p className="mt-1 text-xs opacity-80">{error.details}</p>
          )}
        </div>
        <div className="mt-4">
          <button
            onClick={() => setError(null)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Add error event handler
  return (
    <ErrorCatcher onError={handleCatchError}>
      {children}
    </ErrorCatcher>
  );
}

// Error catcher component
class ErrorCatcher extends React.Component<
  {
    children: React.ReactNode;
    onError: (error: Error) => void;
  },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Report the error to the parent handler
    this.props.onError(error);
  }

  render() {
    // If there was an error, just render the children anyway as the parent
    // component will handle displaying the error UI
    return this.props.children;
  }
}

// Hook for manually triggering the error boundary
export function useApiErrorBoundary() {
  const [, setError] = useState<Error | null>(null);

  const throwError = (error: Error | string) => {
    if (typeof error === 'string') {
      setError(() => { throw new Error(error); });
    } else {
      setError(() => { throw error; });
    }
  };

  return { throwError };
}
