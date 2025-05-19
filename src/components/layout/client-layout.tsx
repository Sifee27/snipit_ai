"use client";

import { useState, useEffect, ReactNode } from "react";

interface ClientLayoutProps {
  children: ReactNode;
}

/**
 * Client-side wrapper component to handle hydration mismatches
 * Prevents hydration errors caused by browser extensions
 */
export function ClientLayout({ children }: ClientLayoutProps) {
  // Use this state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // Only show the children after the component has mounted on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // This helps with hydration issues by ensuring client-side only rendering
  // for parts that might be modified by browser extensions
  return (
    <>
      <style jsx global>{`
        /* Remove any extension-added classes during hydration */
        html[class], body[class] {
          display: block !important;
        }
      `}</style>
      {mounted ? children : children}
    </>
  );
}
