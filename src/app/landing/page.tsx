"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, Twitter, Mail, Check, Headphones, Video, FileText, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('podcasts');
  const formRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-purple-600/10 blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true"></div>
      <div className="absolute bottom-0 left-1/2 w-[800px] h-[800px] rounded-full bg-purple-600/5 blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" aria-hidden="true"></div>
      
      {/* Gradient texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-900/40 to-gray-950/80 opacity-80 pointer-events-none mix-blend-soft-light" aria-hidden="true"></div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-gray-950/70 border-b border-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Snipit
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-1">
            <button 
              onClick={() => scrollToSection(heroRef)}
              className="px-4 py-2 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-all"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection(featuresRef)}
              className="px-4 py-2 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-all"
            >
              Features
            </button>
            <button
              onClick={scrollToForm}
              className="ml-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-600/20"
            >
              Join Waitlist
            </button>
          </nav>
          <button className="md:hidden text-gray-300 hover:text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-20 pb-12 md:pt-32 md:pb-20 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="lg:pr-8 max-w-3xl">
              <div className="flex items-center space-x-2 mb-6 bg-gray-800/50 w-fit px-4 py-2 rounded-full border border-gray-700/50">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-gray-300 text-sm font-medium tracking-wide">Now in Beta • Join the Waitlist</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-purple-600 drop-shadow-sm">
                  AI Summarizer for Podcasts, Videos & Articles
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed">
                Transform hours of content into minutes of focused learning with intelligent summaries and key insights extraction.
              </p>
              
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Our AI-powered tools help you absorb 10x more information in a fraction of the time. Perfect for researchers, students, professionals, and lifelong learners.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                <button
                  onClick={scrollToForm}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-lg font-medium transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50"
                >
                  Join the Waitlist
                  <ArrowRight className="h-5 w-5" />
                </button>
                
                <a href="#features" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-lg font-medium transition-all border border-gray-700 hover:border-gray-600">
                  See Features
                  <ArrowDown className="h-5 w-5" />
                </a>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-gray-800">
                      <span className="text-white text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  <span className="text-white font-medium"></span>Join the many already on the waitlist
                </p>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl blur-2xl opacity-30 transform -rotate-6"></div>
              <div className="relative bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 p-1 rounded-3xl shadow-xl overflow-hidden transform rotate-1">
                <div className="absolute top-0 left-0 right-0 h-14 bg-gray-900/80 backdrop-blur-sm flex items-center px-4 border-b border-gray-700/50">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                
                <div className="pt-14 pb-4 px-4">
                  <div className="bg-gray-900/80 rounded-lg p-4 mb-3 border border-gray-700/50">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <Headphones className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-300 font-medium">Huberman Lab Podcast</span>
                      </div>
                      <span className="text-xs text-gray-500">32:15</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-700 rounded-full w-full"></div>
                      <div className="h-3 bg-gray-700 rounded-full w-5/6"></div>
                      <div className="h-3 bg-gray-700 rounded-full w-4/6"></div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-4 mb-3 border border-purple-600/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-purple-400 font-medium">Summary</span>
                      <div className="px-2 py-1 bg-purple-600/30 rounded text-purple-300 text-xs">AI Generated</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-700/60 rounded-full w-full"></div>
                      <div className="h-3 bg-gray-700/60 rounded-full w-full"></div>
                      <div className="h-3 bg-gray-700/60 rounded-full w-3/4"></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 font-medium">Key Points</span>
                    </div>
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-600/50 flex-shrink-0 flex items-center justify-center mt-0.5">
                            <span className="text-xs text-blue-400">{i + 1}</span>
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="h-3 bg-gray-700 rounded-full w-full"></div>
                            <div className="h-3 bg-gray-700 rounded-full w-5/6"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards section */}
      <section ref={featuresRef} id="features" className="py-20 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">Powerful AI Features</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">Our suite of AI-powered tools helps you extract maximum value from content with minimal time investment</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              title: 'AI Podcast Summarizer',
              description: 'Transform lengthy podcast episodes into concise summaries and key insights',
              icon: <Headphones className="h-8 w-8 text-white" />,
              color: 'from-blue-600 to-blue-400',
              bgColor: 'bg-blue-600/10',
              borderColor: 'border-blue-500/20',
              benefits: [
                'Essential insights and key takeaways highlighted',
                'Precise timestamps for important segments',
                'Fully searchable podcast transcripts with context'
              ]
            },
            {
              title: 'Video Content Summarizer',
              description: 'Extract key points and insights from videos without watching the entire content',
              icon: <Video className="h-8 w-8 text-white" />,
              color: 'from-purple-600 to-purple-400',
              bgColor: 'bg-purple-600/10',
              borderColor: 'border-purple-500/20',
              benefits: [
                'Smart auto-generated chapter markers',
                'AI-powered visual key point extraction',
                'Original source citation with timestamps'
              ]
            },
            {
              title: 'Article & Text Summaries',
              description: 'Digest long articles and reports in seconds with AI-powered summarization',
              icon: <FileText className="h-8 w-8 text-white" />,
              color: 'from-indigo-600 to-indigo-400',
              bgColor: 'bg-indigo-600/10',
              borderColor: 'border-indigo-500/20',
              benefits: [
                'Structured bullet-point summaries for quick scanning',
                'AI-powered source verification and fact-checking',
                'Smart related content recommendations'
              ]
            },
          ].map((feature, index) => (
            <div 
              key={index} 
              className={`relative backdrop-blur-sm bg-gray-800/40 border ${feature.borderColor} p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:bg-gray-800/60 hover:translate-y-[-4px] overflow-hidden`}
            >
              {/* Background gradient */}
              <div className={`absolute left-0 top-0 h-1 w-full ${feature.bgColor}`}></div>
              
              {/* Icon */}
              <div className={`mb-6 ${feature.bgColor} p-4 rounded-lg w-16 h-16 flex items-center justify-center shadow-lg`}>
                {feature.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed mb-6">{feature.description}</p>
              
              {/* Benefits */}
              <div className="space-y-3 mb-6">
                {feature.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-600/20 flex-shrink-0 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-400" />
                    </div>
                    <span className="text-sm text-gray-400">{benefit}</span>
                  </div>
                ))}
              </div>
              
              {/* Bottom accent */}
              <div className="pt-4 border-t border-gray-700/30 flex items-center justify-between">
                <span className="text-xs text-gray-400">AI-Powered</span>
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
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
          <div className="max-w-3xl mx-auto backdrop-blur-lg bg-gray-900/40 p-8 md:p-12 rounded-3xl border border-gray-700/50 shadow-2xl relative overflow-hidden">
            {/* Accent gradients */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500/20 to-transparent"></div>
            
            <div className="relative">
              <div className="flex items-center justify-center mb-2">
                <div className="px-4 py-1 rounded-full bg-blue-600/20 text-blue-400 text-xs font-medium tracking-wide">
                  Beta Access Registration
                </div>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                Be Among the First to Experience Snipit
              </h2>
              
              <p className="text-center text-gray-300 mb-8 max-w-xl mx-auto">
                Join our exclusive waitlist to get priority access to our AI content summarization tools when we launch.
              </p>
              
              {isSubmitted ? (
                <div className="p-8 border border-green-500/20 bg-green-500/10 rounded-2xl mb-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                      <Check className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-400 mb-2">You're on the waitlist!</h3>
                    <p className="text-gray-300">
                      Thanks for joining! We'll send updates to <span className="font-semibold text-white">{email}</span> when we're ready to launch.
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
                      className="w-full pl-12 px-5 py-4 rounded-xl bg-gray-800/50 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none placeholder-gray-500 text-gray-200"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="text-red-400 text-sm flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
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
              
              <div className="mt-12 pt-6 border-t border-gray-700/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="mailto:info@snipit.ai" className="text-gray-400 hover:text-white transition-colors">
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
                
                <p className="text-sm text-gray-400">
                  &copy; {new Date().getFullYear()} Snipit. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-gray-800/50 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-40 right-10 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" aria-hidden="true"></div>
        
        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-12 md:gap-x-8 lg:gap-x-12">
            <div className="md:col-span-5 lg:col-span-4">
              <div className="flex items-center mb-6">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                  Snipit
                </h3>
              </div>
              
              <p className="text-gray-400 max-w-md mb-6">
                Transform hours of content into minutes of focused learning with our AI-powered summarization technology.
              </p>
              
              <div className="flex items-center space-x-4">
                <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="mailto:info@snipit.ai" className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-white font-medium mb-4">Product</h4>
                <ul className="space-y-3">
                  <li><a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">Features</a></li>
                  <li><a href="#waitlist" className="text-gray-400 hover:text-white text-sm transition-colors">Join Waitlist</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Pricing</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-4">Company</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">About</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Blog</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Careers</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-4">Legal</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Snipit. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">Crafted with care</span>
              <div className="flex -space-x-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-gray-900 text-white text-xs font-bold">S</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
