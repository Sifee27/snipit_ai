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
  
  // Simple feature comparison
  const plans = [
    {
      name: "Free",
      description: "For casual users and small projects",
      price: billingCycle === "monthly" ? 0 : 0,
      features: [
        { name: "5 uploads per month", included: true },
        { name: "Basic summaries", included: true },
        { name: "Key quotes extraction", included: true },
        { name: "Simple social media post", included: true },
        { name: "Blog post generation", included: false },
        { name: "Priority processing", included: false },
        { name: "Custom branding", included: false },
        { name: "API access", included: false },
      ],
    },
    {
      name: "Pro",
      description: "For professionals and teams",
      price: billingCycle === "monthly" ? 19 : 190,
      badge: billingCycle === "yearly" ? "Save $38" : null,
      features: [
        { name: "Unlimited uploads", included: true },
        { name: "Enhanced summaries with insights", included: true },
        { name: "Advanced quotes with context", included: true },
        { name: "Multiple social media formats", included: true },
        { name: "Blog post generation", included: true },
        { name: "Priority processing", included: true },
        { name: "Custom branding", included: true },
        { name: "API access", included: true },
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

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.name}
            className={`overflow-hidden ${plan.name === "Pro" ? "border-indigo-600" : ""}`}
          >
            {plan.badge && (
              <div className="absolute top-0 right-0 mt-4 mr-4">
                <Badge className="bg-green-600 hover:bg-green-700">{plan.badge}</Badge>
              </div>
            )}
            <CardHeader className={`${plan.name === "Pro" ? "bg-primary/5 dark:bg-primary/10" : ""}`}>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
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
                className={`w-full mb-3 ${
                  plan.name === "Pro" ? "bg-indigo-600 hover:bg-indigo-700" : ""
                }`}
                asChild
              >
                <Link href={plan.name === "Free" ? "/register" : "/register?plan=pro"}>
                  {plan.name === "Free" ? "Get Started" : "Subscribe Now"}
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {plan.name === "Pro" 
                  ? "Cancel anytime, no questions asked"
                  : "No credit card required"}
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
