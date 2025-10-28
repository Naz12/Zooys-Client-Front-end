"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap } from 'lucide-react';
import { SubscriptionPlan } from '@/lib/types/api';

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelect?: (plan: SubscriptionPlan) => void;
  onUpgrade?: (plan: SubscriptionPlan) => void;
  onDowngrade?: (plan: SubscriptionPlan) => void;
  loading?: boolean;
}

export default function PlanCard({ 
  plan, 
  isCurrentPlan = false, 
  isPopular = false, 
  onSelect, 
  onUpgrade,
  onDowngrade,
  loading = false 
}: PlanCardProps) {
  const formatPrice = (price: number, currency: string, interval: string) => {
    const symbol = currency === 'USD' ? '$' : currency;
    const intervalText = interval === 'monthly' ? '/month' : interval === 'yearly' ? '/year' : '';
    return `${symbol}${price}${intervalText}`;
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('pro')) return <Zap className="h-6 w-6" />;
    if (planName.toLowerCase().includes('premium')) return <Star className="h-6 w-6" />;
    return <Check className="h-6 w-6" />;
  };

  return (
    <Card className={`relative p-6 transition-all duration-200 hover:shadow-lg ${
      isPopular ? 'ring-2 ring-primary shadow-lg scale-105' : ''
    } ${isCurrentPlan ? 'bg-primary/5 border-primary' : ''}`}>
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary" className="px-3 py-1">
            Current Plan
          </Badge>
        </div>
      )}

      <div className="text-center space-y-4">
        {/* Plan Icon and Name */}
        <div className="flex flex-col items-center space-y-2">
          <div className={`p-3 rounded-full ${
            isPopular ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            {getPlanIcon(plan.name)}
          </div>
          <h3 className="text-xl font-semibold">{plan.name}</h3>
          {plan.description && (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-1">
          <div className="text-3xl font-bold">
            {formatPrice(plan.price, plan.currency, 'monthly')}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 text-left">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm">
              {plan.limit === -1 || plan.limit >= 10000 
                ? 'Unlimited AI requests' 
                : `${plan.limit.toLocaleString()} AI requests per month`}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm">All AI tools access</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm">Priority support</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm">Monthly billing</span>
          </div>
        </div>

        {/* Usage Limit */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-sm font-medium">Usage Limit</div>
          <div className="text-lg font-semibold">
            {plan.limit === -1 ? 'Unlimited' : `${plan.limit.toLocaleString()} requests`}
          </div>
          <div className="text-xs text-muted-foreground">
            per month
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          {isCurrentPlan ? (
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          ) : (
            <div className="space-y-2">
              {onUpgrade && (
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => onUpgrade(plan)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Upgrade Plan'}
                </Button>
              )}
              {onDowngrade && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onDowngrade(plan)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Downgrade Plan'}
                </Button>
              )}
              {onSelect && !onUpgrade && !onDowngrade && (
                <Button
                  className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  onClick={() => onSelect(plan)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Select Plan'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

