'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

interface NetworkStatusContextType {
  online: boolean;
  reconnecting: boolean;
  lastOnline: Date | null;
  retryConnection: () => void;
}

const NetworkStatusContext = createContext<NetworkStatusContextType>({
  online: true,
  reconnecting: false,
  lastOnline: null,
  retryConnection: () => {}
});

export const useNetworkStatus = () => useContext(NetworkStatusContext);

interface NetworkStatusProviderProps {
  children: React.ReactNode;
  monitorInterval?: number; // in milliseconds
  pingEndpoint?: string;
}

/**
 * Network Status Provider that monitors connection status
 * and provides context to child components
 */
export function NetworkStatusProvider({
  children,
  monitorInterval = 30000, // Check every 30 seconds
  pingEndpoint = '/api/ping'
}: NetworkStatusProviderProps) {
  const [online, setOnline] = useState<boolean>(true);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(new Date());

  // Function to check connection by pinging the API
  const checkConnection = async () => {
    if (reconnecting) return;

    try {
      setReconnecting(true);
      
      // Attempt to fetch a lightweight endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(pingEndpoint, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setOnline(true);
        setLastOnline(new Date());
      } else {
        setOnline(false);
      }
    } catch (error) {
      console.warn('Network connectivity check failed:', error);
      setOnline(false);
    } finally {
      setReconnecting(false);
    }
  };

  // Handler for browser's online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setLastOnline(new Date());
    };
    
    const handleOffline = () => {
      setOnline(false);
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial status from browser
    setOnline(navigator.onLine);
    
    // Check API connectivity on mount
    checkConnection();
    
    // Setup interval for regular connectivity checks
    const intervalId = setInterval(checkConnection, monitorInterval);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [monitorInterval, pingEndpoint]);

  const contextValue: NetworkStatusContextType = {
    online,
    reconnecting,
    lastOnline,
    retryConnection: checkConnection
  };

  return (
    <NetworkStatusContext.Provider value={contextValue}>
      {children}
      {!online && (
        <OfflineIndicator reconnecting={reconnecting} onRetry={checkConnection} />
      )}
    </NetworkStatusContext.Provider>
  );
}

// Offline indicator component
function OfflineIndicator({ 
  reconnecting, 
  onRetry 
}: { 
  reconnecting: boolean; 
  onRetry: () => void 
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 p-3 bg-red-100 dark:bg-red-900/80 border border-red-200 dark:border-red-800 rounded-lg shadow-lg text-sm text-red-800 dark:text-red-200">
      <div className="relative h-2 w-2">
        <span className={`absolute inset-0 rounded-full bg-red-500 ${reconnecting ? 'animate-ping opacity-75' : ''}`}></span>
        <span className="absolute inset-0 rounded-full bg-red-500"></span>
      </div>
      <span>
        {reconnecting ? 'Reconnecting...' : 'You are offline'}
      </span>
      {!reconnecting && (
        <button 
          onClick={onRetry}
          className="ml-2 px-2 py-1 text-xs font-medium rounded-md bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Retry
        </button>
      )}
    </div>
  );
}
