"use client";

import React, { useEffect, useState } from 'react';
import { useSubscription } from '@/lib/subscription-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Settings,
  CreditCard,
  Calendar,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

export default function CurrentSubscription() {
  const {
    currentSubscription,
    loading,
    error,
    loadCurrentSubscription,
    cancelSubscription,
  } = useSubscription();

  const [usage, setUsage] = useState<{ usage: number; limit: number; reset_date: string } | null>(null);

  useEffect(() => {
    loadCurrentSubscription();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'expired':
        return 'bg-gray-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getUsagePercentage = () => {
    if (!usage || usage.limit === -1) return 0;
    return Math.min((usage.usage / usage.limit) * 100, 100);
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold">Failed to Load Subscription</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadCurrentSubscription} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!currentSubscription) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">No Active Subscription</h3>
          <p className="text-muted-foreground">
            You don't have an active subscription. Choose a plan to get started.
          </p>
          <Button>View Plans</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Subscription Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              {getStatusIcon(currentSubscription.status)}
              <h2 className="text-2xl font-bold">{currentSubscription.plan.name}</h2>
              <Badge 
                variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}
                className={getStatusColor(currentSubscription.status)}
              >
                {currentSubscription.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {currentSubscription.plan.description || 'Premium AI tools and features'}
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </div>

        {/* Billing Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>Billing</span>
            </div>
            <div className="font-semibold">
              {currentSubscription.currency === 'USD' ? '$' : currentSubscription.currency}
              {currentSubscription.price}
              <span className="text-sm text-muted-foreground ml-1">
                /{currentSubscription.plan.interval === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Next Billing</span>
            </div>
            <div className="font-semibold">
              {formatDate(currentSubscription.ends_at)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>Usage Limit</span>
            </div>
            <div className="font-semibold">
              {currentSubscription.limit === -1 ? 'Unlimited' : `${currentSubscription.limit.toLocaleString()} requests`}
            </div>
          </div>
        </div>

        {/* Usage Progress */}
        {currentSubscription.limit !== -1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Usage this period</span>
              <span className="font-medium">
                {currentSubscription.usage.toLocaleString()} / {currentSubscription.limit.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage()} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className={`px-2 py-1 rounded-full text-white text-xs ${
                getUsagePercentage() >= 90 ? 'bg-red-500' : 
                getUsagePercentage() >= 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
                {getUsagePercentage().toFixed(1)}%
              </span>
              <span>{currentSubscription.limit.toLocaleString()}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Upgrade Plan</h3>
              <p className="text-sm text-muted-foreground">
                Get more features and higher limits
              </p>
            </div>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Billing History</h3>
              <p className="text-sm text-muted-foreground">
                View your payment history
              </p>
            </div>
            <Button variant="outline" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              View
            </Button>
          </div>
        </Card>
      </div>

      {/* Plan Features */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Plan Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentSubscription.plan.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

