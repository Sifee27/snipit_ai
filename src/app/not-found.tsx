"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
        <FileQuestion className="h-12 w-12 text-white" />
      </div>
      
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl">
        404
      </h1>
      
      <h2 className="mb-3 text-xl font-semibold text-gray-700 dark:text-gray-300 md:text-2xl">
        Page Not Found
      </h2>
      
      <p className="mb-8 max-w-md text-gray-600 dark:text-gray-400">
        The page you're looking for doesn't exist or has been moved. Perhaps you mistyped the URL or followed an outdated link.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
        
        <Button asChild className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <Link href="/">
            <Home className="h-4 w-4" />
            Return Home
          </Link>
        </Button>
      </div>
      
      <div className="mt-16 text-sm text-gray-500 dark:text-gray-400">
        <p>Need help? <Link href="/contact" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Contact support</Link></p>
      </div>
    </div>
  );
}
