"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

// Admin layout component that wraps all admin pages and ensures proper authentication
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Debug output helper
  useEffect(() => {
    console.log("Admin auth state:", { user, isLoading, email: user?.email });
  }, [user, isLoading]);

  // Check for admin cookie first (for direct access via admin-login)  
  useEffect(() => {
    const checkAdminCookie = async () => {
      try {
        // Check for admin cookie
        const response = await fetch('/api/admin-access', { 
          method: 'GET',
          credentials: 'include' 
        });
        
        const data = await response.json();
        
        if (data.isAdmin) {
          console.log("Admin access granted via cookie");
          setIsAdmin(true);
          return true;
        }
        
        return false;
      } catch (error) {
        console.error("Error checking admin cookie:", error);
        return false;
      }
    };
    
    const checkAuth = async () => {
      // First check if we have a valid admin cookie
      const hasCookieAccess = await checkAdminCookie();
      if (hasCookieAccess) return;
      
      // Immediately consider localhost as admin for development
      const isLocalAdmin = typeof window !== 'undefined' && 
        window.location.hostname === 'localhost';

      if (isLocalAdmin) {
        console.log("Local admin access granted");
        setIsAdmin(true);
        return;
      }
      
      // If the auth check is complete and user is not logged in, redirect to admin login
      if (!isLoading && !user) {
        console.log("No user detected, redirecting to admin login");
        router.push("/admin-login");
        return;
      }

      // If user is logged in, check if they have admin role
      if (user) {
        // In this simple version, we'll consider users with specific emails as admins
        const adminEmails = ["test@example.com", "liamjvieira@gmail.com"];
        const userIsAdmin = adminEmails.includes(user?.email || "");
        console.log("Admin check:", { email: user?.email, isAdmin: userIsAdmin });
        setIsAdmin(userIsAdmin);

        // If not admin, redirect to admin login page
        if (!userIsAdmin) {
          console.log("User is not admin, redirecting to admin login");
          router.push("/admin-login");
        }
      }
    };
    
    checkAuth();
  }, [user, isLoading, router]);

  // While loading, show a loading state
  if (isLoading || isAdmin === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        <p className="mt-4 text-lg">Verifying credentials...</p>
      </div>
    );
  }

  // If not admin, show an error (user will be redirected, but this prevents flash of content)
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="mb-6 rounded-full bg-red-100 p-4 dark:bg-red-900/20">
          <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Access Denied</h1>
        <p className="mb-6 max-w-md text-muted-foreground">
          You don't have permission to access the admin area. If you believe this is an error, please contact support.
        </p>
      </div>
    );
  }

  // If admin, show the admin interface
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Admin header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <Shield className="mr-2 h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Snipit Admin</h1>
          </div>
        </div>

        {/* Admin content */}
        <div className="py-6">{children}</div>
      </div>
    </div>
  );
}
