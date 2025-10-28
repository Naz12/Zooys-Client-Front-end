"use client";

import React from 'react';
import { useSubscription } from '@/lib/subscription-api';

export default function HookTestPage() {
  console.log('HookTestPage rendering...');
  
  try {
    const subscription = useSubscription();
    console.log('useSubscription hook result:', subscription);
    
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Hook Test</h1>
        <div className="space-y-2">
          <p><strong>Loading:</strong> {subscription.loading ? 'Yes' : 'No'}</p>
          <p><strong>Error:</strong> {subscription.error || 'None'}</p>
          <p><strong>Plans Count:</strong> {subscription.plans?.length || 0}</p>
          <p><strong>Current Subscription:</strong> {subscription.currentSubscription ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in HookTestPage:', error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Hook Error</h1>
        <p className="text-red-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}


