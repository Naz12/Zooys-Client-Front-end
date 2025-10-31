"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

export default function SubscriptionDebugPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    // Log environment info
    console.log('Environment check:', {
      API_BASE_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api');
  }, []);

  const testPlansAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing plans API...');
      const response = await fetch(`${apiUrl}/plans`);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Plans data:', data);
      setPlans(data);
    } catch (err) {
      console.error('Plans API error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testSubscriptionAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing subscription API...');
      const response = await fetch(`${apiUrl}/subscription`);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Subscription data:', data);
    } catch (err) {
      console.error('Subscription API error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Subscription API Debug</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
        <div className="space-y-2">
          <p><strong>API URL:</strong> {apiUrl}</p>
          <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">API Tests</h2>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={testPlansAPI} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Test Plans API
            </Button>
            <Button onClick={testSubscriptionAPI} disabled={loading} variant="outline">
              Test Subscription API
            </Button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="font-semibold text-red-800">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {plans.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-semibold text-green-800">Plans Data:</h3>
              <pre className="text-green-700 text-sm overflow-auto">
                {JSON.stringify(plans, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Console Logs</h2>
        <p className="text-muted-foreground">
          Check the browser console for detailed API call logs.
        </p>
      </Card>
    </div>
  );
}




