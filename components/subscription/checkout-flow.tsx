"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Lock
} from 'lucide-react';
import { SubscriptionPlan } from '@/lib/types/api';
import { useCheckout } from '@/lib/checkout-api';
import { notifications } from '@/lib/notifications';

interface CheckoutFlowProps {
  plan: SubscriptionPlan;
  onSuccess?: (subscriptionId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export default function CheckoutFlow({ 
  plan, 
  onSuccess, 
  onCancel, 
  className 
}: CheckoutFlowProps) {
  const { loading, error, createCheckoutSession } = useCheckout();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsRedirecting(true);
      await createCheckoutSession(plan.id);
      // The redirect will happen automatically in the hook
    } catch (err) {
      setIsRedirecting(false);
      notifications.error(
        'Checkout Failed',
        'Failed to create checkout session. Please try again.'
      );
    }
  };

  const formatPrice = (price: number, currency: string, interval: string) => {
    const symbol = currency === 'USD' ? '$' : currency;
    const intervalText = interval === 'monthly' ? '/month' : interval === 'yearly' ? '/year' : '';
    return `${symbol}${price}${intervalText}`;
  };

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    // Use provided features if available, otherwise generate them
    if (plan.features && plan.features.length > 0) {
      return plan.features;
    }

    const features = [
      'All AI tools access',
      'Priority support',
      'Monthly billing'
    ];

    // Add usage limit feature
    if (plan.limit === -1) {
      features.unshift('Unlimited AI requests');
    } else {
      features.unshift(`${plan.limit.toLocaleString()} AI requests per month`);
    }

    // Add file upload size based on plan name
    const isProPlan = plan.name.toLowerCase().includes('pro');
    features.push(isProPlan ? '50MB file upload size' : '10MB file upload size');

    // Add API access for pro plans
    if (isProPlan) {
      features.push('API access');
    }

    return features;
  };

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Plan Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p className="text-muted-foreground">{plan.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {formatPrice(plan.price, plan.currency, plan.interval || 'monthly')}
            </div>
            <div className="text-sm text-muted-foreground">
              {plan.interval === 'yearly' ? 'Save 20% with yearly billing' : 'Monthly billing'}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-6">
          <h4 className="font-medium">Plan Features:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {getPlanFeatures(plan).map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Limit */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-sm font-medium">Usage Limit</div>
          <div className="text-lg font-semibold">
            {plan.limit === -1 ? 'Unlimited' : `${plan.limit.toLocaleString()} requests`}
          </div>
          <div className="text-xs text-muted-foreground">
            {plan.interval === 'yearly' ? 'per year' : 'per month'}
          </div>
        </div>
      </Card>

      {/* Security Notice */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-green-600" />
          <div>
            <h4 className="font-medium text-green-900">Secure Payment</h4>
            <p className="text-sm text-green-700">
              Your payment is processed securely by Stripe. We never store your card details.
            </p>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="font-medium text-red-900">Payment Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={handleCheckout}
          disabled={loading || isRedirecting}
          className="flex-1"
          size="lg"
        >
          {loading || isRedirecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isRedirecting ? 'Redirecting to Stripe...' : 'Creating Checkout...'}
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Continue to Payment
              <ExternalLink className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
        
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading || isRedirecting}
            size="lg"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Additional Information */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          You'll be redirected to Stripe's secure checkout page to complete your payment.
          After successful payment, you'll be redirected back to your dashboard.
        </p>
      </div>
    </div>
  );
}
