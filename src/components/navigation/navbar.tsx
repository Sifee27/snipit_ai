"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, UserCircle, LogOut, ChevronDown, Sparkles, Settings, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const routes = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard" || pathname.startsWith("/dashboard"),
    },
    {
      href: "/pricing",
      label: "Pricing",
      active: pathname === "/pricing",
    },
  ];

  const authRoutes = [
    {
      href: "/settings",
      label: "Settings",
      active: pathname === "/settings" || pathname.startsWith("/settings"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center gap-1">
              <div className="h-8 w-8 rounded-md bg-[#1775f5] flex items-center justify-center text-white font-semibold">S</div>
              <span className="font-bold text-xl">nipIt</span>
            </div>
            <div className="hidden md:flex items-center rounded-full bg-[#1775f5]/10 px-2 py-1 text-xs font-medium">
              <Sparkles className="mr-1 h-3 w-3 text-[#1775f5]" /> 
              <span className="text-[#1775f5]">AI Powered</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  route.active
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center gap-4">
                <ThemeToggle />
                <Link 
                  href="/dashboard" 
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary",
                    pathname.startsWith('/dashboard')
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1.5 h-9">
                      <UserCircle className="h-4 w-4" />
                      <span>Account</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {authRoutes.map((route) => (
                      <DropdownMenuItem key={route.href} asChild>
                        <Link href={route.href} className="flex w-full cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          {route.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => {
                        logout();
                        router.push('/');
                        toast.success('Logged out successfully');
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <nav className="flex flex-col gap-4 mt-8">
                    {routes.map((route) => (
                      <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                          "text-sm font-medium transition-colors hover:text-primary",
                          route.active
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {route.label}
                      </Link>
                    ))}
                    <div className="h-px bg-border my-2" />
                    {authRoutes.map((route) => (
                      <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                          "text-sm font-medium transition-colors hover:text-primary",
                          route.active
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {route.label}
                      </Link>
                    ))}
                    <Button 
                      variant="ghost" 
                      className="justify-start px-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        logout();
                        router.push('/');
                        toast.success('Logged out successfully');
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-3">
                <ThemeToggle />
                <Button variant="outline" size="sm" className="h-9" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button size="sm" className="h-9" asChild>
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
              
              {/* Mobile menu for logged out users */}
              <div className="md:hidden flex items-center gap-2">
                <ThemeToggle />
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <nav className="flex flex-col gap-4 mt-8">
                      {routes.map((route) => (
                        <Link
                          key={route.href}
                          href={route.href}
                          className={cn(
                            "text-sm font-medium transition-colors hover:text-primary",
                            route.active
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {route.label}
                        </Link>
                      ))}
                      <div className="h-px bg-border my-2" />
                      <Link
                        href="/login"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                      >
                        Log in
                      </Link>
                      <Link
                        href="/register"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                      >
                        Sign up
                      </Link>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
