"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { subscriptionApi } from '@/lib/subscription-api';
import { checkoutApi } from '@/lib/checkout-api';
import { environment } from '@/lib/environment';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'loading' | 'pending';
  data?: any;
  error?: string;
  responseTime?: number;
}

export default function SubscriptionTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const endpoints = [
    { name: 'GET /api/plans', test: () => subscriptionApi.getPlans() },
    { name: 'GET /api/subscription', test: () => subscriptionApi.getCurrentSubscription() },
    { name: 'GET /api/subscription/history', test: () => subscriptionApi.getSubscriptionHistory() },
    { name: 'GET /api/usage', test: () => subscriptionApi.getUsage() },
    { name: 'POST /api/checkout', test: () => checkoutApi.createCheckoutSession(2) },
  ];

  const runSingleTest = async (endpoint: { name: string; test: () => Promise<any> }) => {
    const startTime = Date.now();
    
    setTestResults(prev => prev.map(result => 
      result.endpoint === endpoint.name 
        ? { ...result, status: 'loading' as const }
        : result
    ));

    try {
      const data = await endpoint.test();
      const responseTime = Date.now() - startTime;
      
      setTestResults(prev => prev.map(result => 
        result.endpoint === endpoint.name 
          ? { 
              ...result, 
              status: 'success' as const, 
              data, 
              responseTime,
              error: undefined 
            }
          : result
      ));
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setTestResults(prev => prev.map(result => 
        result.endpoint === endpoint.name 
          ? { 
              ...result, 
              status: 'error' as const, 
              error: errorMessage,
              responseTime,
              data: undefined 
            }
          : result
      ));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Initialize all tests as pending
    setTestResults(endpoints.map(endpoint => ({
      endpoint: endpoint.name,
      status: 'pending' as const
    })));

    // Run tests sequentially to avoid overwhelming the server
    for (const endpoint of endpoints) {
      await runSingleTest(endpoint);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
  };

  const testCheckout = async (planId: number = 2) => {
    try {
      const result = await checkoutApi.createCheckoutSession(planId);
      console.log('Checkout test result:', result);
      
      if (result.checkout_url) {
        const proceed = confirm(`Checkout test successful!\n\nSession URL: ${result.checkout_url}\n\nDo you want to proceed to Stripe checkout?`);
        if (proceed) {
          window.location.href = result.checkout_url;
        }
      } else {
        alert('Checkout test successful but no checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout test failed:', error);
      alert(`Checkout test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testCheckoutWithPlan = (planId: number) => {
    return () => testCheckout(planId);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'loading':
        return <Badge className="bg-blue-500">Loading</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Subscription API Test</h1>
        <p className="text-muted-foreground">
          Testing subscription endpoints and Stripe integration
        </p>
        
        <div className="bg-muted/50 rounded-lg p-4 text-left">
          <h3 className="font-semibold mb-2">Environment Configuration:</h3>
          <div className="text-sm space-y-1">
            <div><strong>API URL:</strong> {environment.API_BASE_URL}</div>
            <div><strong>Frontend URL:</strong> {environment.FRONTEND_URL}</div>
            <div><strong>Stripe Key:</strong> {environment.STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}</div>
            <div><strong>Debug Mode:</strong> {environment.DEBUG_MODE ? '✅ Enabled' : '❌ Disabled'}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
        </Button>
        
        <Button 
          onClick={testCheckoutWithPlan(2)} 
          variant="outline"
          className="flex items-center space-x-2"
        >
          <CreditCard className="h-4 w-4" />
          <span>Test Pro Plan Checkout</span>
        </Button>
        
        <Button 
          onClick={testCheckoutWithPlan(3)} 
          variant="outline"
          className="flex items-center space-x-2"
        >
          <CreditCard className="h-4 w-4" />
          <span>Test Unlimited Plan Checkout</span>
        </Button>
      </div>

      <div className="grid gap-4">
        {testResults.map((result, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(result.status)}
                <div>
                  <h3 className="font-semibold">{result.endpoint}</h3>
                  {result.responseTime && (
                    <p className="text-sm text-muted-foreground">
                      Response time: {result.responseTime}ms
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(result.status)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runSingleTest(endpoints.find(e => e.name === result.endpoint)!)}
                  disabled={result.status === 'loading'}
                >
                  Test
                </Button>
              </div>
            </div>
            
            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-red-700 font-medium">Error:</p>
                <p className="text-sm text-red-600">{result.error}</p>
              </div>
            )}
            
            {result.data && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700 font-medium mb-2">Response Data:</p>
                <pre className="text-xs text-green-600 overflow-auto max-h-40">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        ))}
      </div>

      {testResults.length === 0 && (
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Tests Run Yet</h3>
          <p className="text-muted-foreground mb-4">
            Click "Run All Tests" to test the subscription API endpoints
          </p>
        </Card>
      )}
    </div>
  );
}
