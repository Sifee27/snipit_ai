"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, Twitter, Mail, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  // Email validation
  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
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
      // In a real implementation, this would send data to an API
      // For now, we'll just simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store the email in local storage for demo purposes
      localStorage.setItem('waitlist_email', email);
      
      console.log('Waitlist signup:', email);
      
      setIsSubmitted(true);
      setEmail('');
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Snipit
          </span>
        </div>
        <button
          onClick={scrollToForm}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-full text-sm font-medium transition-all"
        >
          Join Waitlist
        </button>
      </header>

      {/* Hero Section */}
      <section className="flex-1 container mx-auto px-4 py-16 md:py-24 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold max-w-4xl leading-tight mb-6">
          Snipit is an <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">AI-powered summarizer</span> for podcasts, videos, and articles.
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mb-10">
          Perfect for creators & students who want the gold without the grind.
        </p>
        
        <button
          onClick={scrollToForm}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full text-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Join the Waitlist
          <ArrowDown className="h-5 w-5 animate-bounce" />
        </button>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-5xl">
          {[
            {
              title: 'Podcast Summaries',
              description: 'Get key insights from hours of audio in minutes',
              gradient: 'from-pink-500 to-orange-500'
            },
            {
              title: 'Video Highlights',
              description: 'Extract the most important points from any video',
              gradient: 'from-blue-500 to-teal-500'
            },
            {
              title: 'Article Extracts',
              description: 'Focus on what matters in lengthy articles',
              gradient: 'from-purple-500 to-indigo-500'
            }
          ].map((feature, i) => (
            <div key={i} className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 hover:border-gray-500 transition-all">
              <div className={`h-2 w-16 mb-4 rounded-full bg-gradient-to-r ${feature.gradient}`}></div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Waitlist Form Section */}
      <section 
        ref={formRef}
        className="container mx-auto px-4 py-16 md:py-24"
      >
        <div className="max-w-2xl mx-auto bg-gray-800 bg-opacity-50 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-gray-700">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Get Early Access
          </h2>
          <p className="text-gray-300 text-center mb-8">
            Join our waitlist to be among the first to experience Snipit when we launch.
          </p>

          {isSubmitted ? (
            <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">You're on the list!</h3>
              <p className="text-gray-300 mb-4">
                Thank you for joining our waitlist. We'll be in touch when Snipit is ready.
              </p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Sign up with another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={cn(
                    "w-full px-4 py-3 bg-gray-900 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors",
                    error ? "border-red-500" : "border-gray-700 hover:border-gray-500"
                  )}
                  disabled={isSubmitting}
                />
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg flex justify-center items-center transition-all"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Get Early Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 md:py-12 border-t border-gray-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">
            Snipit is in development. Stay tuned!
          </p>
          <div className="flex items-center space-x-6">
            <Link 
              href="https://twitter.com/snipit_ai" 
              target="_blank"
              className="text-gray-400 hover:text-blue-400 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link 
              href="mailto:contact@snipit.cloud"
              className="text-gray-400 hover:text-purple-400 transition-colors"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
              <span className="sr-only">Email</span>
            </Link>
          </div>
        </div>
        <div className="text-center text-gray-500 text-sm mt-8">
          &copy; {new Date().getFullYear()} Snipit. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
