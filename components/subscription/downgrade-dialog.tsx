"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  CreditCard,
  Loader2,
  Info
} from 'lucide-react';
import { SubscriptionPlan } from '@/lib/types/api';
import { useSubscription } from '@/lib/subscription-api';
import { notifications } from '@/lib/notifications';
import { format } from 'date-fns';

interface DowngradeDialogProps {
  currentPlan: SubscriptionPlan;
  targetPlan: SubscriptionPlan;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DowngradeDialog({ 
  currentPlan, 
  targetPlan, 
  isOpen, 
  onClose, 
  onSuccess 
}: DowngradeDialogProps) {
  const { downgradeSubscription, loading } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [immediately, setImmediately] = useState(false);

  if (!isOpen) return null;

  const calculateCredit = () => {
    // Simple credit calculation - in real implementation, this would come from the API
    const currentPrice = currentPlan.price;
    const targetPrice = targetPlan.price;
    const priceDifference = currentPrice - targetPrice;
    
    // Assume monthly billing for simplicity
    const daysInMonth = 30;
    const daysRemaining = 15; // This would be calculated from billing cycle
    const creditAmount = (priceDifference * daysRemaining) / daysInMonth;
    
    return Math.max(0, creditAmount);
  };

  const creditAmount = calculateCredit();

  const handleDowngrade = async () => {
    setIsProcessing(true);
    try {
      await downgradeSubscription(targetPlan.id, immediately);
      notifications.success(
        'Downgrade Scheduled',
        immediately 
          ? 'Your subscription has been downgraded immediately.'
          : 'Your subscription will be downgraded at the end of your billing cycle.'
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      notifications.error(
        'Downgrade Failed',
        'Failed to schedule downgrade. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number, currency: string, interval: string) => {
    const symbol = currency === 'USD' ? '$' : currency;
    const intervalText = interval === 'monthly' ? '/month' : interval === 'yearly' ? '/year' : '';
    return `${symbol}${price}${intervalText}`;
  };

  const getLostFeatures = () => {
    return currentPlan.features.filter(feature => 
      !targetPlan.features.includes(feature)
    );
  };

  const lostFeatures = getLostFeatures();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Downgrade Subscription</h2>
                <p className="text-sm text-muted-foreground">
                  Downgrade from {currentPlan.name} to {targetPlan.name}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          {/* Warning */}
          <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Important Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Downgrading will reduce your usage limits and may remove access to some features. 
                  Please review the changes below before proceeding.
                </p>
              </div>
            </div>
          </Card>

          {/* Plan Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Current Plan */}
            <Card className="p-4 border-2 border-red-200 bg-red-50">
              <div className="text-center space-y-3">
                <h3 className="font-semibold text-red-600">Current Plan</h3>
                <h4 className="text-lg font-bold">{currentPlan.name}</h4>
                <div className="text-2xl font-bold text-red-600">
                  {formatPrice(currentPlan.price, currentPlan.currency, currentPlan.interval)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentPlan.limit === -1 ? 'Unlimited' : `${currentPlan.limit.toLocaleString()} requests`}
                </div>
              </div>
            </Card>

            {/* Target Plan */}
            <Card className="p-4 border-2 border-gray-200">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <h3 className="font-semibold text-gray-600">New Plan</h3>
                  <Badge variant="secondary">Downgrade</Badge>
                </div>
                <h4 className="text-lg font-bold">{targetPlan.name}</h4>
                <div className="text-2xl font-bold text-gray-600">
                  {formatPrice(targetPlan.price, targetPlan.currency, targetPlan.interval)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {targetPlan.limit === -1 ? 'Unlimited' : `${targetPlan.limit.toLocaleString()} requests`}
                </div>
              </div>
            </Card>
          </div>

          {/* Lost Features */}
          {lostFeatures.length > 0 && (
            <Card className="p-4 mb-6 bg-red-50 border-red-200">
              <h3 className="font-semibold text-red-900 mb-3">Features You'll Lose:</h3>
              <div className="space-y-2">
                {lostFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="text-sm text-red-800">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Downgrade Options */}
          <Card className="p-4 mb-6">
            <h3 className="font-semibold mb-3">Downgrade Options</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="end-of-cycle"
                  name="downgrade-timing"
                  checked={!immediately}
                  onChange={() => setImmediately(false)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="end-of-cycle" className="font-medium cursor-pointer">
                    At End of Billing Cycle (Recommended)
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep current features until your next billing date. You'll receive a credit for unused time.
                  </p>
                  {creditAmount > 0 && (
                    <div className="mt-2 text-sm text-green-600">
                      Credit: {targetPlan.currency === 'USD' ? '$' : targetPlan.currency}
                      {creditAmount.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="immediately"
                  name="downgrade-timing"
                  checked={immediately}
                  onChange={() => setImmediately(true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="immediately" className="font-medium cursor-pointer">
                    Immediately
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Downgrade right now. You'll lose access to premium features immediately.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Effective Date */}
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">
                  {immediately ? 'Effective Immediately' : 'Effective at End of Billing Cycle'}
                </h4>
                <p className="text-sm text-blue-700">
                  {immediately 
                    ? 'Your downgrade will take effect immediately after confirmation.'
                    : 'Your downgrade will take effect on your next billing date.'
                  }
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={handleDowngrade}
              disabled={loading || isProcessing}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              {loading || isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Confirm Downgrade
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading || isProcessing}
              size="lg"
            >
              Cancel
            </Button>
          </div>

          {/* Additional Information */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              You can upgrade again at any time from your subscription settings.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
