"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { checkoutApi } from '@/lib/checkout-api';
import { subscriptionApi } from '@/lib/subscription-api';

export default function CheckoutDebugPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testCheckout = async (planId: number) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing checkout for plan ID:', planId);
      
      // First test if we can get plans
      const plans = await subscriptionApi.getPlans();
      console.log('Available plans:', plans);
      
      // Check if plan exists
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error(`Plan with ID ${planId} not found`);
      }
      
      console.log('Selected plan:', plan);
      
      // Test checkout
      const checkoutResult = await checkoutApi.createCheckoutSession(planId);
      console.log('Checkout result:', checkoutResult);
      
      setResult({
        success: true,
        plan,
        checkout: checkoutResult
      });
      
    } catch (err) {
      console.error('Checkout test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testPlans = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const plans = await subscriptionApi.getPlans();
      console.log('Plans result:', plans);
      setResult({
        success: true,
        plans
      });
    } catch (err) {
      console.error('Plans test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Checkout Debug</h1>
        <p className="text-muted-foreground">
          Debug checkout API issues
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={() => testPlans()} 
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Test Plans API</span>
        </Button>
        
        <Button 
          onClick={() => testCheckout(1)} 
          disabled={loading}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <CreditCard className="h-4 w-4" />
          <span>Test Free Plan Checkout</span>
        </Button>
        
        <Button 
          onClick={() => testCheckout(2)} 
          disabled={loading}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <CreditCard className="h-4 w-4" />
          <span>Test Pro Plan Checkout</span>
        </Button>
        
        <Button 
          onClick={() => testCheckout(3)} 
          disabled={loading}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <CreditCard className="h-4 w-4" />
          <span>Test Unlimited Plan Checkout</span>
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {result && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="font-medium text-green-900">Success</h3>
          </div>
          <pre className="text-xs text-green-700 overflow-auto max-h-96 bg-white p-3 rounded border">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Debug Information</h3>
        <div className="text-sm space-y-1">
          <div><strong>API Base URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</div>
          <div><strong>Auth Token:</strong> {typeof window !== 'undefined' ? (localStorage.getItem('auth_token') ? 'Present' : 'Missing') : 'N/A'}</div>
          <div><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
        </div>
      </Card>
    </div>
  );
}

