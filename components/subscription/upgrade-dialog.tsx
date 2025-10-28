"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  CheckCircle, 
  CreditCard, 
  Calendar,
  AlertCircle,
  Loader2,
  Zap
} from 'lucide-react';
import { SubscriptionPlan } from '@/lib/types/api';
import { useSubscription } from '@/lib/subscription-api';
import { notifications } from '@/lib/notifications';
import { format } from 'date-fns';

interface UpgradeDialogProps {
  currentPlan: SubscriptionPlan;
  targetPlan: SubscriptionPlan;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UpgradeDialog({ 
  currentPlan, 
  targetPlan, 
  isOpen, 
  onClose, 
  onSuccess 
}: UpgradeDialogProps) {
  const { upgradeSubscription, loading } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const calculateProration = () => {
    // Simple proration calculation - in real implementation, this would come from the API
    const currentPrice = currentPlan.price;
    const targetPrice = targetPlan.price;
    const priceDifference = targetPrice - currentPrice;
    
    // Assume monthly billing for simplicity
    const daysInMonth = 30;
    const daysRemaining = 15; // This would be calculated from billing cycle
    const prorationAmount = (priceDifference * daysRemaining) / daysInMonth;
    
    return Math.max(0, prorationAmount);
  };

  const prorationAmount = calculateProration();

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      await upgradeSubscription(targetPlan.id);
      notifications.success(
        'Upgrade Successful',
        `You have successfully upgraded to the ${targetPlan.name} plan.`
      );
      onSuccess?.();
    } catch (error) {
      notifications.error(
        'Upgrade Failed',
        'Failed to upgrade your plan. Please try again.'
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

  const getNewFeatures = () => {
    return targetPlan.features.filter(feature => 
      !currentPlan.features.includes(feature)
    );
  };

  const newFeatures = getNewFeatures();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Upgrade Subscription</h2>
                <p className="text-sm text-muted-foreground">
                  Upgrade from {currentPlan.name} to {targetPlan.name}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          {/* Plan Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Current Plan */}
            <Card className="p-4 border-2 border-gray-200">
              <div className="text-center space-y-3">
                <h3 className="font-semibold text-gray-600">Current Plan</h3>
                <h4 className="text-lg font-bold">{currentPlan.name}</h4>
                <div className="text-2xl font-bold text-gray-600">
                  {formatPrice(currentPlan.price, currentPlan.currency, currentPlan.interval)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentPlan.limit === -1 ? 'Unlimited' : `${currentPlan.limit.toLocaleString()} requests`}
                </div>
              </div>
            </Card>

            {/* Target Plan */}
            <Card className="p-4 border-2 border-primary bg-primary/5">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <h3 className="font-semibold text-primary">New Plan</h3>
                  <Badge className="bg-primary text-primary-foreground">Upgrade</Badge>
                </div>
                <h4 className="text-lg font-bold">{targetPlan.name}</h4>
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(targetPlan.price, targetPlan.currency, targetPlan.interval)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {targetPlan.limit === -1 ? 'Unlimited' : `${targetPlan.limit.toLocaleString()} requests`}
                </div>
              </div>
            </Card>
          </div>

          {/* New Features */}
          {newFeatures.length > 0 && (
            <Card className="p-4 mb-6 bg-green-50 border-green-200">
              <h3 className="font-semibold text-green-900 mb-3">New Features You'll Get:</h3>
              <div className="space-y-2">
                {newFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-green-800">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Pricing Information */}
          <Card className="p-4 mb-6">
            <h3 className="font-semibold mb-3">Pricing Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Plan</span>
                <span className="font-medium">
                  {formatPrice(currentPlan.price, currentPlan.currency, currentPlan.interval)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Plan</span>
                <span className="font-medium">
                  {formatPrice(targetPlan.price, targetPlan.currency, targetPlan.interval)}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Proration Amount</span>
                  <span className="font-medium text-green-600">
                    {targetPlan.currency === 'USD' ? '$' : targetPlan.currency}
                    {prorationAmount.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Amount charged for the remaining billing period
                </p>
              </div>
            </div>
          </Card>

          {/* Effective Date */}
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Effective Immediately</h4>
                <p className="text-sm text-blue-700">
                  Your upgrade will take effect immediately after payment. 
                  You'll be charged the proration amount and have access to all new features.
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={handleUpgrade}
              disabled={loading || isProcessing}
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
                  <CreditCard className="h-4 w-4 mr-2" />
                  Upgrade Now
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

          {/* Security Notice */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              You'll be redirected to Stripe's secure payment page to complete the upgrade.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
