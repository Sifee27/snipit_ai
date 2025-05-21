"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, Twitter, Mail, Check, Headphones, Video, FileText, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('podcasts');
  const [theme, setTheme] = useState('dark'); // Default theme
  const formRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  
  // Set up theme on component mount and handle system preference
  useEffect(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      } else {
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      }
    } else {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme('system');
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);
  
  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  
  // Toggle theme function with system preference support
  const toggleTheme = () => {
    let newTheme;
    // Cycle through: light -> dark -> system
    if (theme === 'light') {
      newTheme = 'dark';
      document.documentElement.classList.add('dark');
    } else if (theme === 'dark') {
      newTheme = 'system';
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      newTheme = 'light';
      document.documentElement.classList.remove('dark');
    }
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Email validation
  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting email to waitlist:', email);
      
      // Make an API call to save the email
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      // For debugging
      console.log('API Response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('API Response data:', data);
      } catch (jsonError) {
        console.error('Error parsing API response:', jsonError);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to join waitlist');
      }
      
      // Also store the email in local storage for confirmation purposes
      try {
        localStorage.setItem('waitlist_email', email);
      } catch (storageError) {
        console.warn('Could not save to localStorage:', storageError);
        // Continue anyway - this is just a nice-to-have
      }
      
      console.log('Waitlist signup successful:', email);
      
      setIsSubmitted(true);
      setEmail('');
    } catch (err) {
      console.error('Error submitting form:', err);
      
      // Provide more specific error message if available
      if (err instanceof Error) {
        setError(err.message || 'Something went wrong. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#1a103c] via-[#13072b] to-[#09051a] text-white relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 w-full h-full grid grid-cols-[repeat(40,minmax(0,1fr))] grid-rows-[repeat(40,minmax(0,1fr))] opacity-20 pointer-events-none" aria-hidden="true">
        {[...Array(40)].map((_, i) => (
          [...Array(40)].map((_, j) => (
            <div key={`${i}-${j}`} className="border-[0.5px] border-white/5"></div>
          ))
        ))}
      </div>
      
      {/* Decorative gradient elements */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px] -translate-x-1/3 -translate-y-1/3 pointer-events-none" aria-hidden="true"></div>
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px] translate-x-1/3 pointer-events-none" aria-hidden="true"></div>
      <div className="absolute bottom-0 left-1/2 w-[800px] h-[200px] rounded-full bg-purple-600/20 blur-[80px] -translate-x-1/2 translate-y-1/2 pointer-events-none" aria-hidden="true"></div>
      
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-soft-light" aria-hidden="true"></div>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/20">
              <span className="text-lg font-bold text-white">S</span>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-[#09051a]"></div>
            </div>
            <span className="ml-3 text-xl font-bold text-white">Snipit</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => scrollToSection(featuresRef)}
              className="px-4 py-2 text-white/70 hover:text-white rounded-lg text-sm font-medium transition-all"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection(featuresRef)}
              className="px-4 py-2 text-white/70 hover:text-white rounded-lg text-sm font-medium transition-all"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection(featuresRef)}
              className="px-4 py-2 text-white/70 hover:text-white rounded-lg text-sm font-medium transition-all"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection(pricingRef)}
              className="px-4 py-2 text-white/70 hover:text-white rounded-lg text-sm font-medium transition-all"
            >
              Pricing
            </button>
          </nav>
          
          <div className="flex items-center">
            <button
              onClick={scrollToForm}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 text-white rounded-lg text-sm font-medium transition-all"
            >
              Get Early Access →
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-32 mt-12">
        {/* App icon */}
        <div className="mb-4">
          <div className="relative w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-purple-900/30">
            <div className="absolute inset-0 rounded-xl bg-[url('/noise.svg')] opacity-10"></div>
            <div className="relative w-7 h-7 flex items-center justify-center">
              <span className="block w-1.5 h-4 bg-white rounded-full mr-0.5"></span>
              <span className="block w-1.5 h-6 bg-white rounded-full ml-0.5"></span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-[#13072b]"></div>
          </div>
        </div>
        
        {/* Waitlist tag */}
        <div className="inline-flex items-center mb-5 bg-white/5 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
          <span className="text-white/80 text-sm font-medium tracking-wide">Waitlist</span>
        </div>
        
        {/* Main heading */}
        <h1 className="text-5xl md:text-7xl font-bold mb-8 max-w-4xl mx-auto leading-tight">
          <span className="text-white">
            Snipit
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-white/80 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Be first in line to experience the future of AI with Snipit! Our AI summarizes podcasts, videos, and articles in seconds.
        </p>
        
        {/* Email form */}
        <div ref={formRef} className="relative w-full max-w-md mx-auto mb-16">
          <div className="flex bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-1.5 overflow-hidden">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email"
              className="flex-1 bg-transparent border-0 text-white placeholder-white/50 py-3 px-4 focus:outline-none focus:ring-0"
              disabled={isSubmitting || isSubmitted}
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isSubmitted}
              className={`px-5 py-3 min-w-[150px] rounded-md font-medium text-sm transition-all ${isSubmitted ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing
                </span>
              ) : isSubmitted ? (
                'Success!'
              ) : (
                'Join Waitlist'
              )}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {isSubmitted && <p className="text-green-500 text-sm mt-2">You've been added to our waitlist! Check your email for confirmation.</p>}
        </div>
        
        {/* Social proof */}
        <div className="flex flex-col items-center">
          <div className="flex -space-x-2 mb-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/5 shadow-lg shadow-black/20">
                <span className="text-white/80 text-xs font-bold">{String.fromCharCode(65 + i)}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-white/50">
            Join 5,000+ already onboard
          </p>
        </div>
        
        {/* Decorative curve at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-48 w-full overflow-hidden">
          <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 w-[200%] h-[200px] bg-gradient-to-b from-purple-900/0 to-purple-900/10 rounded-[100%]">
          </div>
        </div>
      </section>

      {/* Feature cards section - minimal style */}
      <section ref={featuresRef} id="features" className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <span className="bg-white/5 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm text-white/70 border border-white/10 inline-block mb-4">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">AI-Powered Summarization</h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">Transform any content into concise, actionable insights</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Podcast Summaries',
                description: 'Extract insights from your favorite podcast episodes',
                icon: '🎧',
                features: ['Key points extraction', 'Time-stamped insights', 'Speaker identification']
              },
              {
                title: 'Video Content',
                description: 'Get the essence of any video content instantly',
                icon: '📹',
                features: ['Transcript generation', 'Visual context understanding', 'Chapter markers']
              },
              {
                title: 'Article & Research',
                description: 'Summarize articles and research papers efficiently',
                icon: '📄',
                features: ['Focus on key research findings', 'Custom summary styles', 'Citation extraction']
              },
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden transition-all hover:bg-white/10"
              >
                <div className="p-8">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-6 text-2xl">
                    {feature.icon}
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-white/70 mb-6">{feature.description}</p>
                  
                  {/* Features list */}
                  <ul className="space-y-3">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-white/70">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-purple-800/10 blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-blue-800/10 blur-[80px] -z-10"></div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} id="pricing" className="py-32 px-6 relative border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="bg-white/5 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm text-white/70 border border-white/10 inline-block mb-4">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Simple, Transparent Pricing</h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">Choose the plan that fits your needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden transition-all hover:translate-y-[-4px] hover:shadow-lg hover:shadow-purple-900/20 flex flex-col">
              <div className="p-8 flex flex-col h-full">
                <h3 className="text-2xl font-bold mb-3 text-white">Free</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">$0</span>
                  <span className="text-white/60 ml-1">/mo</span>
                </div>
                <p className="text-white/70 mb-6 pb-6 border-b border-white/10">Perfect for casual content consumption</p>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">3 summaries per month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">GPT-3.5 powered</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">Basic features</span>
                  </li>
                </ul>
                
                <div className="mt-auto">
                  <button 
                    onClick={scrollToForm}
                    className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Pro Tier */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden transition-all hover:translate-y-[-4px] hover:shadow-lg hover:shadow-purple-900/20 flex flex-col">
              <div className="p-8 flex flex-col h-full">
                <h3 className="text-2xl font-bold mb-3 text-white">Pro</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">$5</span>
                  <span className="text-white/60 ml-1">/mo</span>
                </div>
                <p className="text-white/70 mb-6 pb-6 border-b border-white/10">For active content consumers</p>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">100 summaries per month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">Priority processing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">GPT-4 for long-form content</span>
                  </li>
                </ul>
                
                <div className="mt-auto">
                  <button 
                    onClick={scrollToForm}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Premium Tier */}
            <div className="bg-gradient-to-b from-purple-600/20 to-blue-600/10 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden transition-all hover:translate-y-[-4px] hover:shadow-lg hover:shadow-purple-900/30 relative flex flex-col">
              <div className="absolute top-0 left-0 right-0 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-xs font-bold text-white text-center">
                Most Popular
              </div>
              <div className="p-8 pt-10 flex flex-col h-full">
                <h3 className="text-2xl font-bold mb-3 text-white">Premium</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">$15</span>
                  <span className="text-white/60 ml-1">/mo</span>
                </div>
                <p className="text-white/70 mb-6 pb-6 border-b border-white/10">For power users and professionals</p>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">300-500 summaries per month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">Access to GPT-4 Turbo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">File uploads + enhanced UI</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">Custom summary styles</span>
                  </li>
                </ul>
                
                <div className="mt-auto">
                  <button 
                    onClick={scrollToForm}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full bg-purple-800/10 blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-blue-800/10 blur-[80px] -z-10"></div>
      </section>
      
      {/* Waitlist Form Section */}
      <section 
        ref={formRef}
        id="waitlist"
        className="relative py-20 overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" aria-hidden="true"></div>
        <div className="absolute top-20 left-10 w-48 h-48 rounded-full bg-purple-600/5 blur-2xl pointer-events-none" aria-hidden="true"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto backdrop-blur-lg bg-white/80 dark:bg-gray-900/40 p-8 md:p-12 rounded-3xl border border-gray-200/60 dark:border-gray-700/50 shadow-2xl relative overflow-hidden">
            {/* Accent gradients */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-transparent to-purple-600/5 dark:from-blue-600/10 dark:via-transparent dark:to-purple-600/10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300/30 dark:via-gray-500/20 to-transparent"></div>
            
            <div className="relative">
              <div className="flex items-center justify-center mb-2">
                <div className="px-4 py-1 rounded-full bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 text-xs font-medium tracking-wide">
                  Beta Access Registration
                </div>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700 dark:from-blue-400 dark:to-purple-600">
                Be Among the First to Experience Snipit
              </h2>
              
              <p className="text-center text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto">
                Join our exclusive waitlist to get priority access to our AI content summarization tools when we launch.
              </p>
              
              {isSubmitted ? (
                <div className="p-8 border border-green-500/20 bg-green-100/60 dark:bg-green-500/10 rounded-2xl mb-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 mb-4">
                      <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">You're on the waitlist!</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Thanks for joining! We'll send updates to <span className="font-semibold text-gray-900 dark:text-white">{email}</span> when we're ready to launch.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-12 px-5 py-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none placeholder-gray-500 text-gray-800 dark:text-gray-200"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 bg-red-100/80 dark:bg-red-500/10 px-4 py-2 rounded-lg border border-red-300/50 dark:border-red-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {error}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-base font-medium transition-all flex items-center justify-center disabled:opacity-70 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Join the Waitlist'
                    )}
                  </button>
                  
                  <p className="text-xs text-center text-gray-400 mt-4">
                    We respect your privacy. No spam emails, ever.
                  </p>
                </form>
              )}
              
              <div className="mt-12 pt-6 border-t border-gray-200/30 dark:border-gray-700/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <a href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="mailto:info@snipit.ai" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  &copy; {new Date().getFullYear()} Snipit. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="pt-8 pb-12 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center items-center mb-8">
            <div className="relative w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-purple-900/20 mr-2">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-white/80 text-sm font-medium">
              Snipit.ai
            </span>
          </div>
          
          <p className="text-center text-white/40 text-sm">&copy; {new Date().getFullYear()} Snipit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
