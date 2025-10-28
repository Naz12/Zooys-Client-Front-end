"use client";

import { useState, useCallback, useRef } from 'react';
import { subscriptionApi } from './api';
import { 
  SubscriptionPlan, 
  Subscription, 
  SubscriptionHistory,
  UsageStatistics,
  UpgradeRequest,
  UpgradeResponse,
  DowngradeRequest,
  DowngradeResponse,
  CancelRequest,
  CancelResponse,
  ApiResponse 
} from './types/api';

// Subscription API functions - wrapper around the new modular API
export const subscriptionApiWrapper = {
  // Get all available subscription plans
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    try {
      return await subscriptionApi.getPlans();
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  },

  // Get current user's active subscription
  getCurrentSubscription: async (): Promise<Subscription | null> => {
    try {
      const data = await subscriptionApi.getCurrentSubscription();
      
      // Handle "No active subscription" case
      if (data && data.status === 'none') {
        return null;
      }
      
      return data || null;
    } catch (error) {
      console.error('Failed to get current subscription:', error);
      throw new Error('Subscription endpoint not available. Please contact support.');
    }
  },

  // Get user's subscription history
  getSubscriptionHistory: async (): Promise<SubscriptionHistory[]> => {
    try {
      return await subscriptionApi.getSubscriptionHistory();
    } catch (error) {
      console.error('Failed to get subscription history:', error);
      throw new Error('Subscription history endpoint not available. Please contact support.');
    }
  },

  // Get subscription usage
  getUsage: async (): Promise<UsageStatistics> => {
    try {
      return await subscriptionApi.getUsage();
    } catch (error) {
      console.error('Failed to get usage:', error);
      throw new Error('Usage endpoint not available. Please contact support.');
    }
  },

  // Upgrade subscription
  upgradeSubscription: async (request: UpgradeRequest): Promise<UpgradeResponse> => {
    try {
      return await subscriptionApi.upgradeSubscription(request);
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  },

  // Downgrade subscription
  downgradeSubscription: async (request: DowngradeRequest): Promise<DowngradeResponse> => {
    try {
      return await subscriptionApi.downgradeSubscription(request);
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      throw error;
    }
  },

  // Cancel subscription
  cancelSubscription: async (request: CancelRequest): Promise<CancelResponse> => {
    try {
      return await subscriptionApi.cancelSubscription(request);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }
};

// Subscription hooks
export const useSubscription = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const plans = await subscriptionApiWrapper.getPlans();
      return plans;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch plans';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const subscription = await subscriptionApiWrapper.getCurrentSubscription();
      return subscription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubscriptionHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await subscriptionApiWrapper.getSubscriptionHistory();
      return history;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription history';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usage = await subscriptionApiWrapper.getUsage();
      return usage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch usage';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const upgradeSubscription = useCallback(async (request: UpgradeRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await subscriptionApiWrapper.upgradeSubscription(request);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upgrade subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downgradeSubscription = useCallback(async (request: DowngradeRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await subscriptionApiWrapper.downgradeSubscription(request);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to downgrade subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(async (request: CancelRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await subscriptionApiWrapper.cancelSubscription(request);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchPlans,
    fetchCurrentSubscription,
    fetchSubscriptionHistory,
    fetchUsage,
    upgradeSubscription,
    downgradeSubscription,
    cancelSubscription,
  };
};