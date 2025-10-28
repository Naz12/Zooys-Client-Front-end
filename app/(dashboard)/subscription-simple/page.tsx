"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

export default function SimpleSubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    console.log('SimpleSubscriptionPage mounted');
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading plans...');
      const plansResponse = await fetch('http://localhost:8000/api/plans');
      console.log('Plans response:', plansResponse);
      
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        console.log('Plans data:', plansData);
        setPlans(plansData);
      } else {
        console.error('Plans API error:', plansResponse.status, plansResponse.statusText);
      }
      
      console.log('Loading subscription...');
      const subscriptionResponse = await fetch('http://localhost:8000/api/subscription');
      console.log('Subscription response:', subscriptionResponse);
      
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        console.log('Subscription data:', subscriptionData);
        setSubscription(subscriptionData);
      } else {
        console.error('Subscription API error:', subscriptionResponse.status, subscriptionResponse.statusText);
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center space-y-4 max-w-md w-full">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <h1 className="text-2xl font-bold">Loading...</h1>
          <p className="text-muted-foreground">Testing API connections...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center space-y-4 max-w-md w-full">
          <div className="h-12 w-12 text-red-500 mx-auto flex items-center justify-center">
            <RefreshCw className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadData} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Simple Subscription Test</h1>
        <p className="text-xl text-muted-foreground">
          Testing direct API calls without hooks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Plans ({plans.length})</h2>
          {plans.length > 0 ? (
            <div className="space-y-2">
              {plans.map((plan) => (
                <div key={plan.id} className="p-3 border rounded">
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${plan.price} - {plan.limit} requests
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No plans loaded</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
          {subscription ? (
            <div className="space-y-2">
              <p><strong>Status:</strong> {subscription.status}</p>
              {subscription.plan && (
                <>
                  <p><strong>Plan:</strong> {subscription.plan.name}</p>
                  <p><strong>Usage:</strong> {subscription.current_usage || 0}</p>
                </>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No active subscription</p>
          )}
        </Card>
      </div>

      <div className="text-center">
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload Data
        </Button>
      </div>
    </div>
  );
}


