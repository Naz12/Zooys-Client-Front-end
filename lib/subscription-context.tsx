"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  SubscriptionPlan, 
  Subscription, 
  SubscriptionHistory, 
  UsageStatistics 
} from '@/lib/types/api';
import { subscriptionApi } from '@/lib/subscription-api';
import { useUsagePolling } from '@/lib/hooks/use-usage-polling';
import { notifications } from '@/lib/notifications';

interface SubscriptionContextType {
  // Data
  plans: SubscriptionPlan[];
  currentSubscription: Subscription | null;
  history: SubscriptionHistory[];
  usage: UsageStatistics | null;
  
  // Loading states
  loading: {
    plans: boolean;
    subscription: boolean;
    history: boolean;
    usage: boolean;
  };
  
  // Error states
  error: {
    plans: string | null;
    subscription: string | null;
    history: string | null;
    usage: string | null;
  };
  
  // Actions
  loadPlans: () => Promise<void>;
  loadCurrentSubscription: () => Promise<void>;
  loadHistory: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  
  // Subscription management
  createSubscription: (planId: string, paymentMethodId?: string) => Promise<Subscription>;
  updateSubscription: (planId: string) => Promise<Subscription>;
  cancelSubscription: () => Promise<void>;
  upgradeSubscription: (planId: number, viaStripe?: boolean) => Promise<any>;
  downgradeSubscription: (planId: number, immediately?: boolean) => Promise<any>;
  
  // Polling control
  startUsagePolling: () => void;
  stopUsagePolling: () => void;
  isPolling: boolean;
  lastUpdated: Date | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  // State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);
  
  const [loading, setLoading] = useState({
    plans: false,
    subscription: false,
    history: false,
    usage: false,
  });
  
  const [error, setError] = useState({
    plans: null as string | null,
    subscription: null as string | null,
    history: null as string | null,
    usage: null as string | null,
  });

  // Usage polling
  const {
    usage,
    loading: usageLoading,
    error: usageError,
    refreshUsage,
    startPolling,
    stopPolling,
    isPolling,
    lastUpdated
  } = useUsagePolling({
    interval: 5 * 60 * 1000, // 5 minutes
    enabled: true,
    onThresholdReached: (percentage) => {
      // Threshold notifications are handled in the hook
      console.log(`Usage threshold reached: ${percentage}%`);
    }
  });

  // Load plans
  const loadPlans = async () => {
    setLoading(prev => ({ ...prev, plans: true }));
    setError(prev => ({ ...prev, plans: null }));
    
    try {
      const plansData = await subscriptionApi.getPlans();
      setPlans(plansData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load plans';
      setError(prev => ({ ...prev, plans: errorMessage }));
      notifications.error('Error', errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, plans: false }));
    }
  };

  // Load current subscription
  const loadCurrentSubscription = async () => {
    setLoading(prev => ({ ...prev, subscription: true }));
    setError(prev => ({ ...prev, subscription: null }));
    
    try {
      const subscription = await subscriptionApi.getCurrentSubscription();
      setCurrentSubscription(subscription);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription';
      setError(prev => ({ ...prev, subscription: errorMessage }));
      console.error('Failed to load subscription:', err);
    } finally {
      setLoading(prev => ({ ...prev, subscription: false }));
    }
  };

  // Load history
  const loadHistory = async () => {
    setLoading(prev => ({ ...prev, history: true }));
    setError(prev => ({ ...prev, history: null }));
    
    try {
      const historyData = await subscriptionApi.getSubscriptionHistory();
      setHistory(historyData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load history';
      setError(prev => ({ ...prev, history: errorMessage }));
      console.error('Failed to load history:', err);
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  };

  // Create subscription
  const createSubscription = async (planId: string, paymentMethodId?: string) => {
    try {
      const subscription = await subscriptionApi.createSubscription(planId, paymentMethodId);
      setCurrentSubscription(subscription);
      notifications.success('Success', 'Subscription created successfully!');
      return subscription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
      notifications.error('Error', errorMessage);
      throw err;
    }
  };

  // Update subscription
  const updateSubscription = async (planId: string) => {
    try {
      const subscription = await subscriptionApi.updateSubscription(planId);
      setCurrentSubscription(subscription);
      notifications.success('Success', 'Subscription updated successfully!');
      return subscription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subscription';
      notifications.error('Error', errorMessage);
      throw err;
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    try {
      await subscriptionApi.cancelSubscription();
      if (currentSubscription) {
        setCurrentSubscription({
          ...currentSubscription,
          status: 'cancelled' as const,
        });
      }
      notifications.success('Success', 'Subscription cancelled successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      notifications.error('Error', errorMessage);
      throw err;
    }
  };

  // Upgrade subscription
  const upgradeSubscription = async (planId: number, viaStripe: boolean = true) => {
    try {
      const response = await subscriptionApi.upgradeSubscription(planId, viaStripe);
      if (viaStripe && response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        await loadCurrentSubscription();
      }
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upgrade subscription';
      notifications.error('Error', errorMessage);
      throw err;
    }
  };

  // Downgrade subscription
  const downgradeSubscription = async (planId: number, immediately: boolean = false) => {
    try {
      const response = await subscriptionApi.downgradeSubscription(planId, immediately);
      await loadCurrentSubscription();
      notifications.success('Success', 'Subscription downgrade scheduled successfully!');
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to downgrade subscription';
      notifications.error('Error', errorMessage);
      throw err;
    }
  };

  // Initial data loading
  useEffect(() => {
    loadPlans();
    loadCurrentSubscription();
    loadHistory();
  }, []);

  // Update loading state for usage
  useEffect(() => {
    setLoading(prev => ({ ...prev, usage: usageLoading }));
  }, [usageLoading]);

  // Update error state for usage
  useEffect(() => {
    setError(prev => ({ ...prev, usage: usageError }));
  }, [usageError]);

  const value: SubscriptionContextType = {
    // Data
    plans,
    currentSubscription,
    history,
    usage,
    
    // Loading states
    loading,
    
    // Error states
    error,
    
    // Actions
    loadPlans,
    loadCurrentSubscription,
    loadHistory,
    refreshUsage,
    
    // Subscription management
    createSubscription,
    updateSubscription,
    cancelSubscription,
    upgradeSubscription,
    downgradeSubscription,
    
    // Polling control
    startUsagePolling: startPolling,
    stopUsagePolling: stopPolling,
    isPolling,
    lastUpdated,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}
