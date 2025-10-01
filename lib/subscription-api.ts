"use client";

import { api } from './advanced-api-client';
import { 
  SubscriptionPlan, 
  Subscription, 
  SubscriptionHistory,
  ApiResponse 
} from './types/api';

// Subscription API functions
export const subscriptionApi = {
  // Get all available subscription plans
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await api.get<SubscriptionPlan[]>('/plans');
    return response.data || [];
  },

  // Get current user's active subscription
  getCurrentSubscription: async (): Promise<Subscription | null> => {
    try {
      const response = await api.get<Subscription>('/subscription');
      return response.data || null;
    } catch (error) {
      console.error('Failed to get current subscription:', error);
      return null;
    }
  },

  // Get user's subscription history
  getSubscriptionHistory: async (): Promise<SubscriptionHistory[]> => {
    try {
      const response = await api.get<SubscriptionHistory[]>('/subscription/history');
      return response.data || [];
    } catch (error) {
      console.error('Failed to get subscription history:', error);
      return [];
    }
  },

  // Create new subscription
  createSubscription: async (planId: string, paymentMethodId?: string): Promise<Subscription> => {
    const response = await api.post<Subscription>('/subscription', {
      plan_id: planId,
      payment_method_id: paymentMethodId,
    });
    return response.data!;
  },

  // Update subscription plan
  updateSubscription: async (planId: string): Promise<Subscription> => {
    const response = await api.put<Subscription>('/subscription', {
      plan_id: planId,
    });
    return response.data!;
  },

  // Cancel subscription
  cancelSubscription: async (): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>('/subscription');
    return response.data!;
  },

  // Reactivate subscription
  reactivateSubscription: async (): Promise<Subscription> => {
    const response = await api.post<Subscription>('/subscription/reactivate');
    return response.data!;
  },

  // Get subscription usage
  getUsage: async (): Promise<{ usage: number; limit: number; reset_date: string }> => {
    const response = await api.get<{ usage: number; limit: number; reset_date: string }>('/subscription/usage');
    return response.data!;
  },
};

// Subscription hooks
export const useSubscription = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load subscription plans
  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const plansData = await subscriptionApi.getPlans();
      setPlans(plansData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  // Load current subscription
  const loadCurrentSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const subscription = await subscriptionApi.getCurrentSubscription();
      setCurrentSubscription(subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  // Load subscription history
  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const historyData = await subscriptionApi.getSubscriptionHistory();
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // Create subscription
  const createSubscription = async (planId: string, paymentMethodId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const subscription = await subscriptionApi.createSubscription(planId, paymentMethodId);
      setCurrentSubscription(subscription);
      return subscription;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update subscription
  const updateSubscription = async (planId: string) => {
    setLoading(true);
    setError(null);
    try {
      const subscription = await subscriptionApi.updateSubscription(planId);
      setCurrentSubscription(subscription);
      return subscription;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      await subscriptionApi.cancelSubscription();
      if (currentSubscription) {
        setCurrentSubscription({
          ...currentSubscription,
          status: 'cancelled' as const,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    plans,
    currentSubscription,
    history,
    loading,
    error,
    loadPlans,
    loadCurrentSubscription,
    loadHistory,
    createSubscription,
    updateSubscription,
    cancelSubscription,
  };
};

// Import useState for the hook
import { useState } from 'react';

