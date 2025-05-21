"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Check, Minus } from "lucide-react";

// Define feature types
type Feature = {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  advanced: boolean | string;
  enterprise: boolean | string;
  enterpriseNote?: string;
};

type FeatureCategory = {
  name: string;
  features: Feature[];
};

// Define company logo type
type CompanyLogo = {
  name: string;
  id: number;
};

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  // Define company logos for the partners section
  const companyLogos: CompanyLogo[] = Array.from({ length: 10 }, (_, i) => ({
    name: `Company ${i + 1}`,
    id: i + 1
  }));
  
  // Define the pricing plans
  const plans = [
    {
      name: "Free Plan",
      description: "Perfect for occasional summaries",
      price: 0,
      priceId: "free",
      icon: "📝", // Note icon
      popular: false,
      color: "blue",
    },
    {
      name: "Pro Plan",
      description: "Faster summaries for regular use",
      price: billingCycle === "monthly" ? 5 : 50,
      priceId: "pro",
      icon: "⚡", // Lightning icon
      popular: true,
      color: "white",
      savings: billingCycle === "yearly" ? "SAVE $10" : null,
    },
    {
      name: "Premium Plan",
      description: "Advanced features for power users",
      price: billingCycle === "monthly" ? 15 : 150,
      priceId: "premium",
      icon: "✨", // Sparkles icon
      popular: false,
      color: "green",
      savings: billingCycle === "yearly" ? "SAVE $30" : null,
    },
  ];
  
  // Define feature categories and their features
  const featureCategories: FeatureCategory[] = [
    {
      name: "Monthly Summaries",
      features: [
        {
          name: "Monthly Summary Quota", 
          free: "3/mo", 
          pro: "100/mo", 
          advanced: "500/mo", 
          enterprise: "Unlimited",
          enterpriseNote: "Custom volume"
        },
      ]
    },
    {
      name: "AI Models",
      features: [
        {
          name: "GPT-3.5", 
          free: true, 
          pro: true, 
          advanced: true, 
          enterprise: true
        },
        {
          name: "Whisper (Audio)", 
          free: true, 
          pro: true, 
          advanced: true, 
          enterprise: true
        },
        {
          name: "GPT-4 On Demand", 
          free: false, 
          pro: "For Long-form", 
          advanced: true,
          enterprise: true
        },
        {
          name: "GPT-4 Turbo", 
          free: false, 
          pro: false, 
          advanced: true, 
          enterprise: true
        }
      ]
    },
    {
      name: "Processing Features",
      features: [
        {
          name: "Standard Processing", 
          free: true, 
          pro: true, 
          advanced: true,
          enterprise: true
        },
        {
          name: "Priority Processing", 
          free: false, 
          pro: true, 
          advanced: true,
          enterprise: true,
          enterpriseNote: "Dedicated Queue"
        }
      ]
    },
    {
      name: "Interface & Uploads",
      features: [
        {
          name: "Standard UI", 
          free: true, 
          pro: true, 
          advanced: true, 
          enterprise: true
        },
        {
          name: "Enhanced UI Features", 
          free: false, 
          pro: false, 
          advanced: true,
          enterprise: true
        },
        {
          name: "File Uploads", 
          free: false, 
          pro: false, 
          advanced: true,
          enterprise: true,
          enterpriseNote: "Unlimited Size"
        }
      ]
    },
    {
      name: "Customization",
      features: [
        {
          name: "Basic Summaries", 
          free: true, 
          pro: true, 
          advanced: true,
          enterprise: true
        },
        {
          name: "Custom Summary Styles", 
          free: false, 
          pro: false, 
          advanced: true,
          enterprise: true,
          enterpriseNote: "+ Custom Templates"
        }
      ]
    },
    {
      name: "Support",
      features: [
        {
          name: "Email Support", 
          free: true, 
          pro: true, 
          advanced: true, 
          enterprise: true
        },
        {
          name: "Priority Support", 
          free: false, 
          pro: false, 
          advanced: true,
          enterprise: true,
          enterpriseNote: "Dedicated Manager"
        }
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-purple-600/10 blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true"></div>
      <div className="absolute bottom-0 left-1/2 w-[800px] h-[800px] rounded-full bg-purple-600/5 blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" aria-hidden="true"></div>
      
      {/* Gradient texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-100/80 via-gray-50/40 to-gray-100/80 dark:from-gray-950/80 dark:via-gray-900/40 dark:to-gray-950/80 opacity-80 pointer-events-none mix-blend-soft-light" aria-hidden="true"></div>
      
      {/* Header section */}
      <div className="container mx-auto py-16 px-4 relative z-10">
        <div className="text-center mb-12">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200">PRICING</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            Choose Your Summarization Plan
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            AI-Powered Content Summaries for Any Need
          </p>
        </div>
        
        {/* Pricing toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-200 dark:bg-gray-800 rounded-full p-1 flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${billingCycle === "monthly" ? "bg-white dark:bg-gray-700 shadow-md" : "text-gray-700 dark:text-gray-300"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${billingCycle === "yearly" ? "bg-white dark:bg-gray-700 shadow-md" : "text-gray-700 dark:text-gray-300"}`}
            >
              Yearly <span className="text-green-600 dark:text-green-500 font-medium">(-17%)</span>
            </button>
          </div>
        </div>
        
        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden flex flex-col shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 relative">
              {plan.popular && (
                <div className="absolute top-0 right-0 mt-4 mr-4">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>
                </div>
              )}
              
              {/* Plan header */}
              <div className="p-8 text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${plan.popular ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <span className="text-3xl ${plan.popular ? 'text-white' : 'text-gray-800 dark:text-white'}">{plan.icon}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">{plan.name.split(' ')[0]}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{plan.description}</p>
                <div className="flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{typeof plan.price === 'number' ? `$${plan.price}` : plan.price}</span>
                  {typeof plan.price === 'number' && <span className="text-gray-500 dark:text-gray-400 ml-1">/{billingCycle === "monthly" ? "mo" : "yr"}</span>}
                </div>
                {plan.savings && (
                  <div className="mt-1">
                    <span className="text-green-600 dark:text-green-500 text-xs font-medium">{plan.savings}</span>
                  </div>
                )}
              </div>
              
              {/* Features list */}
              <div className="px-8 pb-4">
                <ul className="space-y-3">
                  {(plan.priceId === 'free' ? [
                    '3 summaries per month',
                    'GPT-3.5 & Whisper models',
                    'Basic features'
                  ] : plan.priceId === 'pro' ? [
                    '100 summaries per month',
                    'Priority processing',
                    'GPT-4 for long-form content'
                  ] : [
                    '500 summaries per month',
                    'Access to GPT-4 Turbo',
                    'File uploads + enhanced UI',
                    'Custom summary styles'
                  ]).map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Call to action */}
              <div className="p-8 mt-auto">
                <Link href={`/register?plan=${plan.priceId}`}>
                  <Button 
                    className={`w-full ${plan.popular ? 
                      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-600/20" : 
                      "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"}`}
                  >
                    {plan.price === 0 ? "Get Started" : "Choose Plan"}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {/* Features comparison section - simplified */}
        <div className="mt-24 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4">Compare All Features</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">Everything you need to summarize content efficiently</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Features header */}
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
              <div className="col-span-1 font-medium text-gray-800 dark:text-gray-200">Features</div>
              {plans.map((plan, index) => (
                <div key={index} className="text-center">
                  <span className="text-sm font-bold">{plan.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
            
            {/* Features rows */}
            {featureCategories.map((category, catIndex) => (
              <div key={catIndex}>
                {/* Category header */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">{category.name}</h3>
                </div>
                
                {category.features.map((feature, featureIndex) => (
                  <div 
                    key={`${catIndex}-${featureIndex}`} 
                    className={`grid grid-cols-4 gap-4 p-4 ${featureIndex < category.features.length - 1 ? "border-b border-gray-200 dark:border-gray-700" : ""}`}
                  >
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature.name}</span>
                    </div>
                    
                    {/* Free tier */}
                    <div className="flex justify-center items-center">
                      {feature.free === true ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-500" />
                      ) : feature.free === false ? (
                        <Minus className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{feature.free}</span>
                      )}
                    </div>
                    
                    {/* Pro tier */}
                    <div className="flex justify-center items-center">
                      {feature.pro === true ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-500" />
                      ) : feature.pro === false ? (
                        <Minus className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{feature.pro}</span>
                      )}
                    </div>
                    
                    {/* Advanced tier */}
                    <div className="flex justify-center items-center">
                      {feature.advanced === true ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-500" />
                      ) : feature.advanced === false ? (
                        <Minus className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{feature.advanced}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        

        {/* Call to action section */}
        <div className="mt-24 mb-16">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-8 py-16 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Supercharge your content workflow</h2>
              <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
                Snipit uses advanced AI models to provide accurate, concise summaries of articles, research papers, videos, podcasts, and more.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📚</span>
                  </div>
                  <h4 className="text-white font-medium mb-2">Articles & Research</h4>
                  <p className="text-white/80 text-sm">Summarize long research papers and articles in seconds</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎬</span>
                  </div>
                  <h4 className="text-white font-medium mb-2">Videos & Podcasts</h4>
                  <p className="text-white/80 text-sm">Get the key points from audio and video content</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h4 className="text-white font-medium mb-2">Reports & Presentations</h4>
                  <p className="text-white/80 text-sm">Condense important documents into digestible summaries</p>
                </div>
              </div>
              
              <Link href="/register">
                <Button className="bg-white text-blue-600 hover:bg-gray-100 font-medium px-8 py-3 rounded-lg shadow-lg">
                  Start Summarizing for Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
