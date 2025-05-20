"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Homepage component that redirects to the landing page
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the landing page when the component mounts
    router.replace('/landing');
  }, [router]);

  // Return a minimal loading state in case there's a slight delay in redirection
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Redirecting to Snipit</h1>
        <div className="mt-4 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        </div>
      </div>
    </div>
  );
}
