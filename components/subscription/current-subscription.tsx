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
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import UsageDisplay from './usage-display';
import UsageAlerts from './usage-alerts';
import UpgradeDialog from './upgrade-dialog';
import DowngradeDialog from './downgrade-dialog';
import { SubscriptionPlan } from '@/lib/types/api';

export default function CurrentSubscription() {
  const {
    currentSubscription,
    loading,
    error,
    loadCurrentSubscription,
    cancelSubscription,
    upgradeSubscription,
    downgradeSubscription,
    getUsageStatistics,
  } = useSubscription();

  const [usage, setUsage] = useState<any>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    loadCurrentSubscription();
    loadUsageStatistics();
  }, []);

  const loadUsageStatistics = async () => {
    try {
      const usageData = await getUsageStatistics();
      setUsage(usageData);
    } catch (error) {
      console.error('Failed to load usage statistics:', error);
    }
  };

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
    if (!currentSubscription) return 0;
    const usage = currentSubscription.current_usage || 0;
    const limit = currentSubscription.plan?.limit || 0;
    if (limit === 0) return 0;
    return Math.min((usage / limit) * 100, 100);
  };

  const handleUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
  };

  const handleDowngrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowDowngradeDialog(true);
  };

  const handleUpgradeSuccess = () => {
    setShowUpgradeDialog(false);
    setSelectedPlan(null);
    loadCurrentSubscription();
    loadUsageStatistics();
  };

  const handleDowngradeSuccess = () => {
    setShowDowngradeDialog(false);
    setSelectedPlan(null);
    loadCurrentSubscription();
    loadUsageStatistics();
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
          <Settings className="h-12 w-12 text-blue-500 mx-auto" />
          <h3 className="text-lg font-semibold">Subscription System Ready</h3>
          <p className="text-muted-foreground">
            The backend subscription system has been implemented. 
            Please check back later or contact support if issues persist.
          </p>
          <Button onClick={loadCurrentSubscription} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
          <div className="text-xs text-muted-foreground mt-2">
            Note: Endpoints may require authentication or are being deployed.
          </div>
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
          <Button onClick={() => window.location.href = '/subscription?tab=plans'}>
            View Available Plans
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Alerts */}
      {usage && (
        <UsageAlerts 
          usage={usage}
          onUpgrade={() => {/* Handle upgrade */}}
          onManagePayment={() => {/* Handle payment management */}}
        />
      )}

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
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={loadUsageStatistics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
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
                /{currentSubscription.plan.interval === 'yearly' ? 'year' : 'month'}
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
          {currentSubscription.plan?.limit === -1 ? 'Unlimited' :
           currentSubscription.plan?.limit ? `${currentSubscription.plan.limit.toLocaleString()} requests` :
           'N/A'}
        </div>
          </div>
        </div>

        {/* Usage Progress */}
        {(currentSubscription.plan?.limit !== -1 && currentSubscription.plan?.limit) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Usage this period</span>
              <span className="font-medium">
                {(currentSubscription.current_usage || 0).toLocaleString()} / {(currentSubscription.plan?.limit || 0).toLocaleString()}
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
              <span>{(currentSubscription.plan?.limit || 0).toLocaleString()}</span>
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
          {currentSubscription.plan && (
            <>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">
                  {currentSubscription.plan.limit === -1 || currentSubscription.plan.limit >= 10000 
                    ? 'Unlimited AI requests' 
                    : `${currentSubscription.plan.limit.toLocaleString()} AI requests per month`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">All AI tools access</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Priority support</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Monthly billing</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Usage Display */}
      {usage && (
        <UsageDisplay usage={usage} />
      )}

      {/* Dialogs */}
      {selectedPlan && (
        <>
          <UpgradeDialog
            currentPlan={currentSubscription.plan}
            targetPlan={selectedPlan}
            isOpen={showUpgradeDialog}
            onClose={() => setShowUpgradeDialog(false)}
            onSuccess={handleUpgradeSuccess}
          />
          
          <DowngradeDialog
            currentPlan={currentSubscription.plan}
            targetPlan={selectedPlan}
            isOpen={showDowngradeDialog}
            onClose={() => setShowDowngradeDialog(false)}
            onSuccess={handleDowngradeSuccess}
          />
        </>
      )}
    </div>
  );
}

