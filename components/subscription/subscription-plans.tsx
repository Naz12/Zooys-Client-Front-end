"use client";

import React, { useEffect, useState } from 'react';
import { useSubscription } from '@/lib/subscription-api';
import PlanCard from './plan-card';
import { SubscriptionPlan } from '@/lib/types/api';
import { notifications } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

export default function SubscriptionPlans() {
  const {
    plans,
    currentSubscription,
    loading,
    error,
    loadPlans,
    createSubscription,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadPlans();
  }, []);

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    try {
      await createSubscription(plan.id);
      notifications.success(
        'Subscription Created',
        `Successfully subscribed to ${plan.name} plan!`
      );
    } catch (error) {
      notifications.error(
        'Subscription Failed',
        'Failed to create subscription. Please try again.'
      );
    }
  };

  const filteredPlans = plans.filter(plan => 
    plan.interval === billingInterval && plan.is_active !== false
  );

  const getCurrentPlan = () => {
    if (!currentSubscription) return null;
    return plans.find(plan => plan.id === currentSubscription.plan.id);
  };

  const currentPlan = getCurrentPlan();

  if (loading && plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md w-full">
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold">Failed to Load Plans</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadPlans} variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your needs. All plans include access to our AI tools
          with different usage limits and features.
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <h3 className="font-semibold">Current Plan: {currentPlan?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentSubscription.status === 'active' ? 'Active' : 'Inactive'} • 
                  Expires {new Date(currentSubscription.ends_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
              {currentSubscription.status}
            </Badge>
          </div>
        </Card>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <Tabs value={billingInterval} onValueChange={(value) => setBillingInterval(value as 'monthly' | 'yearly')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filteredPlans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentPlan?.id === plan.id}
            isPopular={index === 1} // Make middle plan popular
            onSelect={handlePlanSelect}
            loading={loading}
          />
        ))}
      </div>

      {/* Features Comparison */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Feature Comparison</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold">Features</th>
                  {filteredPlans.map(plan => (
                    <th key={plan.id} className="text-center p-4 font-semibold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">AI Tool Access</td>
                  {filteredPlans.map(plan => (
                    <td key={plan.id} className="text-center p-4">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Monthly Requests</td>
                  {filteredPlans.map(plan => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.limit === -1 ? 'Unlimited' : plan.limit.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">File Upload Size</td>
                  {filteredPlans.map(plan => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.name.toLowerCase().includes('pro') ? '50MB' : '10MB'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Priority Support</td>
                  {filteredPlans.map(plan => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.name.toLowerCase().includes('pro') ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium">API Access</td>
                  {filteredPlans.map(plan => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.name.toLowerCase().includes('pro') ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Can I change my plan anytime?</h3>
            <p className="text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated
              and reflected in your next billing cycle.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">What happens if I exceed my usage limit?</h3>
            <p className="text-muted-foreground">
              If you exceed your monthly usage limit, you'll be notified and can either upgrade
              your plan or wait for the next billing cycle.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-muted-foreground">
              Yes, all paid plans come with a 7-day free trial. You can cancel anytime during
              the trial period without being charged.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

