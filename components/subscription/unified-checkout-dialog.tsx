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
  Lock,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Info
} from 'lucide-react';
import { SubscriptionPlan, Subscription } from '@/lib/types/api';
import { useCheckout } from '@/lib/checkout-api';
import { notifications } from '@/lib/notifications';

export type CheckoutType = 'new' | 'upgrade' | 'downgrade';

interface UnifiedCheckoutDialogProps {
  plan: SubscriptionPlan;
  currentSubscription?: Subscription | null;
  checkoutType: CheckoutType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (subscriptionId: string) => void;
  className?: string;
}

export default function UnifiedCheckoutDialog({ 
  plan, 
  currentSubscription,
  checkoutType,
  isOpen, 
  onClose, 
  onSuccess,
  className 
}: UnifiedCheckoutDialogProps) {
  const { loading, error, createCheckoutSession } = useCheckout();
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!isOpen) return null;

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

  const getCheckoutTitle = () => {
    switch (checkoutType) {
      case 'upgrade':
        return 'Upgrade Subscription';
      case 'downgrade':
        return 'Downgrade Subscription';
      default:
        return 'Complete Subscription';
    }
  };

  const getCheckoutDescription = () => {
    switch (checkoutType) {
      case 'upgrade':
        return 'You\'re upgrading to a higher plan with more features and usage limits.';
      case 'downgrade':
        return 'You\'re downgrading to a lower plan. Changes will take effect at your next billing cycle.';
      default:
        return 'Complete your subscription to access premium features.';
    }
  };

  const getActionButtonText = () => {
    switch (checkoutType) {
      case 'upgrade':
        return 'Upgrade Now';
      case 'downgrade':
        return 'Downgrade Now';
      default:
        return 'Continue to Payment';
    }
  };

  const getPriceDifference = () => {
    if (!currentSubscription || checkoutType === 'new') return null;
    
    const currentPrice = currentSubscription.plan.price;
    const newPrice = plan.price;
    const difference = newPrice - currentPrice;
    
    if (difference === 0) return null;
    
    return {
      amount: Math.abs(difference),
      isIncrease: difference > 0,
      isDecrease: difference < 0
    };
  };

  const priceDifference = getPriceDifference();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}>
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                checkoutType === 'upgrade' ? 'bg-green-100 text-green-600' :
                checkoutType === 'downgrade' ? 'bg-orange-100 text-orange-600' :
                'bg-primary/10 text-primary'
              }`}>
                {checkoutType === 'upgrade' ? <TrendingUp className="h-5 w-5" /> :
                 checkoutType === 'downgrade' ? <TrendingDown className="h-5 w-5" /> :
                 <CreditCard className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{getCheckoutTitle()}</h2>
                <p className="text-sm text-muted-foreground">{getCheckoutDescription()}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Plan Comparison */}
          {currentSubscription && checkoutType !== 'new' && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-3">Plan Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Current Plan</h4>
                  <div className="space-y-1">
                    <div className="font-semibold">{currentSubscription.plan.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(currentSubscription.plan.price, currentSubscription.plan.currency, 'monthly')}
                    </div>
                    <div className="text-sm">
                      {currentSubscription.plan.limit === -1 ? 'Unlimited' : `${currentSubscription.plan.limit.toLocaleString()} requests`}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">New Plan</h4>
                  <div className="space-y-1">
                    <div className="font-semibold">{plan.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(plan.price, plan.currency, 'monthly')}
                    </div>
                    <div className="text-sm">
                      {plan.limit === -1 ? 'Unlimited' : `${plan.limit.toLocaleString()} requests`}
                    </div>
                  </div>
                </div>
              </div>
              
              {priceDifference && (
                <div className="mt-3 p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-2">
                    {priceDifference.isIncrease ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-orange-500" />
                    )}
                    <span className="text-sm font-medium">
                      {priceDifference.isIncrease ? 'Additional cost' : 'Savings'}: 
                      {formatPrice(priceDifference.amount, plan.currency, 'monthly')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {checkoutType === 'upgrade' 
                      ? 'You\'ll be charged the prorated amount immediately'
                      : 'Changes will take effect at your next billing cycle'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Plan Summary */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-muted-foreground">{plan.description || 'Premium AI tools and features'}</p>
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
          </div>

          {/* Security Notice */}
          <Card className="p-4 bg-green-50 border-green-200 mb-6">
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
            <Card className="p-4 bg-red-50 border-red-200 mb-6">
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
                  {getActionButtonText()}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading || isRedirecting}
              size="lg"
            >
              Cancel
            </Button>
          </div>

          {/* Additional Information */}
          <div className="text-center text-sm text-muted-foreground mt-6">
            <p>
              You'll be redirected to Stripe's secure checkout page to complete your payment.
              After successful payment, you'll be redirected back to your dashboard.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}



