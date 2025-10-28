"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CreditCard,
  Zap,
  XCircle
} from 'lucide-react';
import { UsageStatistics } from '@/lib/types/api';
import { notifications } from '@/lib/notifications';

interface UsageAlertsProps {
  usage: UsageStatistics;
  onUpgrade?: () => void;
  onManagePayment?: () => void;
  className?: string;
}

export default function UsageAlerts({ 
  usage, 
  onUpgrade, 
  onManagePayment, 
  className 
}: UsageAlertsProps) {
  const getAlertLevel = (percentage: number) => {
    if (percentage >= 100) return 'critical';
    if (percentage >= 90) return 'warning';
    if (percentage >= 80) return 'info';
    return null;
  };

  const alertLevel = getAlertLevel(usage.usage_percentage);

  if (!alertLevel) return null;

  const getAlertConfig = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          icon: XCircle,
          title: 'Usage Limit Reached',
          message: 'You have reached your monthly usage limit. Upgrade your plan to continue using our services.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          iconColor: 'text-red-600',
          buttonVariant: 'default' as const,
          buttonText: 'Upgrade Now',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          title: 'Usage Warning',
          message: `You've used ${usage.usage_percentage.toFixed(1)}% of your monthly limit. Consider upgrading to avoid interruption.`,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-900',
          iconColor: 'text-yellow-600',
          buttonVariant: 'outline' as const,
          buttonText: 'View Plans',
        };
      case 'info':
        return {
          icon: TrendingUp,
          title: 'Usage Update',
          message: `You've used ${usage.usage_percentage.toFixed(1)}% of your monthly limit. You have ${usage.remaining_usage.toLocaleString()} requests remaining.`,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600',
          buttonVariant: 'outline' as const,
          buttonText: 'View Usage',
        };
      default:
        return null;
    }
  };

  const config = getAlertConfig(alertLevel);
  if (!config) return null;

  const AlertIcon = config.icon;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      notifications.info('Upgrade Required', 'Please visit the Plans tab to upgrade your subscription.');
    }
  };

  const handleManagePayment = () => {
    if (onManagePayment) {
      onManagePayment();
    } else {
      notifications.info('Payment Management', 'Please visit your subscription settings to manage payment methods.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Usage Alert */}
      <Card className={`p-4 ${config.bgColor} ${config.borderColor} border`}>
        <div className="flex items-start space-x-3">
          <AlertIcon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <h4 className={`font-medium ${config.textColor}`}>
              {config.title}
            </h4>
            <p className={`text-sm ${config.textColor} mt-1`}>
              {config.message}
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                size="sm"
                variant={config.buttonVariant}
                onClick={handleUpgrade}
                className="text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {config.buttonText}
              </Button>
              
              {alertLevel === 'critical' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManagePayment}
                  className="text-xs"
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Manage Payment
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Grace Period Alert */}
      {usage.in_grace_period && (
        <Card className="p-4 bg-orange-50 border-orange-200 border">
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-orange-900">
                Grace Period Active
              </h4>
              <p className="text-sm text-orange-700 mt-1">
                Your subscription is in a grace period due to a payment issue. 
                Please update your payment method to continue using our services.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManagePayment}
                  className="text-xs"
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Update Payment
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Usage Reset Information */}
      <Card className="p-4 bg-gray-50 border-gray-200 border">
        <div className="flex items-center space-x-3">
          <Zap className="h-5 w-5 text-gray-600" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              Usage Reset Information
            </h4>
            <p className="text-sm text-gray-700 mt-1">
              Your usage will reset in {usage.days_until_reset} days on{' '}
              {new Date(usage.usage_reset_date).toLocaleDateString()}.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
