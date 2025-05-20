"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  // New pricing tiers based on updated structure
  const plans = [
    {
      name: "Free",
      description: "Get started with essential summaries",
      price: billingCycle === "monthly" ? 0 : 0,
      features: [
        { name: "3 summaries per month", included: true },
        { name: "Powered by GPT-3.5", included: true },
        { name: "Whisper voice transcription", included: true },
        { name: "Basic summary format", included: true },
        { name: "Priority processing", included: false },
        { name: "GPT-4 model access", included: false },
        { name: "File uploads", included: false },
        { name: "Custom summary styles", included: false },
      ],
    },
    {
      name: "Pro",
      description: "More power for regular users",
      price: billingCycle === "monthly" ? 5 : 50,
      badge: billingCycle === "yearly" ? "Save $10" : null,
      features: [
        { name: "100 summaries per month", included: true },
        { name: "Powered by GPT-3.5", included: true },
        { name: "Whisper voice transcription", included: true },
        { name: "Priority processing", included: true },
        { name: "GPT-4 on demand for long-form", included: true },
        { name: "Basic file uploads", included: true },
        { name: "Standard UI", included: true },
        { name: "Custom summary styles", included: false },
      ],
    },
    {
      name: "Premium",
      description: "Maximum power and customization",
      price: billingCycle === "monthly" ? 15 : 150,
      badge: billingCycle === "yearly" ? "Save $30" : null,
      highlight: true,
      features: [
        { name: "500 summaries per month", included: true },
        { name: "Access to GPT-4 Turbo", included: true },
        { name: "Whisper voice transcription", included: true },
        { name: "Priority processing", included: true },
        { name: "Enhanced file uploads", included: true },
        { name: "Advanced UI features", included: true },
        { name: "Custom summary styles", included: true },
        { name: "Educational, bullet-list formats", included: true },
      ],
    }
  ];

  return (
    <div className="container py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that best suits your needs. All plans include access to our AI-powered content tools.
        </p>
        
        <div className="flex justify-center mt-8">
          <div className="p-1 bg-muted rounded-full flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-4 py-2 text-sm ${
                billingCycle === "monthly" 
                  ? "bg-background shadow-sm" 
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-full px-4 py-2 text-sm ${
                billingCycle === "yearly" 
                  ? "bg-background shadow-sm" 
                  : "text-muted-foreground"
              }`}
            >
              Yearly <span className="text-green-600 font-medium">(-20%)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.name}
            className={`overflow-hidden ${plan.highlight ? "border-purple-600 shadow-lg" : plan.name === "Pro" ? "border-blue-500" : ""} ${plan.highlight ? "scale-105 z-10" : ""}`}
          >
            {plan.badge && (
              <div className="absolute top-0 right-0 mt-4 mr-4">
                <Badge className="bg-green-600 hover:bg-green-700">{plan.badge}</Badge>
              </div>
            )}
            <CardHeader className={`${plan.highlight ? "bg-purple-600/10 dark:bg-purple-600/20" : plan.name === "Pro" ? "bg-blue-500/5 dark:bg-blue-500/10" : ""}`}>
              <CardTitle className={`text-2xl ${plan.highlight ? "text-purple-600 dark:text-purple-400" : plan.name === "Pro" ? "text-blue-600 dark:text-blue-400" : ""}`}>
                {plan.name}
                {plan.highlight && <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-purple-600 text-white">Popular</span>}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ${plan.price}
                </span>
                {" "}
                <span className="text-muted-foreground">
                  /{billingCycle === "monthly" ? "month" : "year"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    {feature.included ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    ) : (
                      <X className="h-5 w-5 text-muted/50 mr-3" />
                    )}
                    <span className={feature.included ? "" : "text-muted-foreground"}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button 
                className={`w-full mb-3 ${plan.highlight 
                  ? "bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800" 
                  : plan.name === "Pro" 
                    ? "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800" 
                    : ""}`}
                asChild
              >
                <Link href={plan.name === "Free" 
                  ? "/register" 
                  : plan.name === "Pro" 
                    ? "/register?plan=pro" 
                    : "/register?plan=premium"
                }>
                  {plan.name === "Free" 
                    ? "Get Started" 
                    : plan.highlight 
                      ? "Go Premium" 
                      : "Subscribe Now"}
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {plan.name === "Free" 
                  ? "No credit card required" 
                  : plan.highlight 
                    ? "Full access to all premium features" 
                    : "Cancel anytime, no questions asked"}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Can I change plans later?</h3>
            <p className="mt-2 text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. If you downgrade, changes will take effect at the end of your current billing cycle.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">What payment methods do you accept?</h3>
            <p className="mt-2 text-muted-foreground">We accept all major credit cards and PayPal. All transactions are secure and encrypted.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">Do you offer refunds?</h3>
            <p className="mt-2 text-muted-foreground">Yes, we offer a 14-day money-back guarantee. If you're not satisfied with the service, contact us within 14 days of your purchase for a full refund.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">What happens when I reach my upload limit?</h3>
            <p className="mt-2 text-muted-foreground">On the Free plan, once you reach your monthly upload limit, you'll need to upgrade to the Pro plan or wait until your limit resets at the beginning of the next month.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
