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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Snipit
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Link 
            href="/waitlist"
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full text-sm font-medium transition-all"
          >
            Waitlist Page
          </Link>
          <button
            onClick={scrollToForm}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-sm font-medium transition-all"
          >
            Join Waitlist
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 container mx-auto px-4 py-16 md:py-24 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold max-w-4xl leading-tight mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">Save 80% of your time</span> while capturing all essential knowledge
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl mb-6">
          Snipit transforms hours of content into minutes of focused learning with AI-powered summaries of podcasts, videos, and articles.
        </p>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mb-10">
          Never miss key insights or waste time on fluff content again. Perfect for researchers, students, professionals, and lifelong learners.
        </p>
        
        <button
          onClick={scrollToForm}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full text-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Join the Waitlist
          <ArrowDown className="h-5 w-5 animate-bounce" />
        </button>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full max-w-5xl">
          {[
            {
              title: 'Podcast Summaries',
              description: 'Transform 2-hour podcast episodes into 5-minute reads',
              benefits: [
                'Key insights and takeaways highlighted',
                'Timestamps for important moments',
                'Searchable transcripts with context'
              ],
              icon: 'Headphones',
              gradient: 'from-pink-500 to-orange-500'
            },
            {
              title: 'Video Highlights',
              description: 'Watch a 30-second summary instead of a 20-minute video',
              benefits: [
                'Auto-generated chapter markers',
                'Visual key point extraction',
                'Citation links to original content'
              ],
              icon: 'Video',
              gradient: 'from-blue-500 to-teal-500'
            },
            {
              title: 'Article Extracts',
              description: 'Distill 5,000-word articles into 500-word essentials',
              benefits: [
                'Bullet-point summaries for quick scanning',
                'Source verification and fact-checking',
                'Related content recommendations'
              ],
              icon: 'FileText',
              gradient: 'from-purple-500 to-indigo-500'
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-50 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all hover:transform hover:scale-[1.02] hover:shadow-lg">
              <div className="flex items-center mb-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-r ${feature.gradient} mr-3`}>
                  {feature.icon === 'Headphones' && <Headphones className="h-5 w-5 text-white" />}
                  {feature.icon === 'Video' && <Video className="h-5 w-5 text-white" />}
                  {feature.icon === 'FileText' && <FileText className="h-5 w-5 text-white" />}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
              </div>
              <p className="text-gray-800 dark:text-gray-300 mb-4 font-medium">{feature.description}</p>
              <ul className="space-y-2">
                {feature.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Waitlist Form Section */}
      <section 
        ref={formRef}
        className="container mx-auto px-4 py-16 md:py-24"
      >
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-50 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-gray-900 dark:text-white">
            Get Early Access
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
            Join our waitlist to be among the first to experience Snipit when we launch.
          </p>

          {isSubmitted ? (
            <div className="bg-green-100 dark:bg-green-900 bg-opacity-50 dark:bg-opacity-30 border border-green-300 dark:border-green-700 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">You're on the list!</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Thank you for joining our waitlist. We'll keep you updated on our progress and let you know when Snipit is ready for early access.
              </p>
              <div className="flex flex-col space-y-3 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">Next steps:</span> Keep an eye on your inbox for updates and exclusive previews.
                </p>
                <div className="flex justify-center space-x-4">
                  <a 
                    href="https://twitter.com/snipit_ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                  >
                    <Twitter className="h-4 w-4 mr-1" /> Follow us
                  </a>
                  <a 
                    href="mailto:hello@snipit.ai"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-1" /> Contact us
                  </a>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 inline-flex items-center gap-1"
              >
                <ArrowRight className="h-3 w-3" /> Submit another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={cn(
                    "w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors",
                    error ? "border-red-500" : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
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
      <footer className="container mx-auto px-4 py-8 md:py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
            Snipit is in development. Stay tuned!
          </p>
          <div className="flex items-center space-x-6">
            <Link 
              href="https://twitter.com/snipit_ai" 
              target="_blank"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <button 
              onClick={() => document.documentElement.classList.toggle('dark')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              <Sun className="h-5 w-5 hidden dark:block" />
              <Moon className="h-5 w-5 block dark:hidden" />
              <span className="sr-only">Toggle theme</span>
            </button>
          </div>
        </div>
        {/* Footer content is already in the main layout */}
      </footer>
    </div>
  );
}
