"use client";

import { useState } from 'react';
import { subscriptionApi } from './api';
import { CheckoutRequest, CheckoutResponse, Subscription } from './types/api';

export const checkoutApi = {
  createCheckoutSession: async (
    planId: number, 
    successUrl?: string, 
    cancelUrl?: string
  ): Promise<CheckoutResponse> => {
    console.log('Creating checkout session for plan ID:', planId);
    
    const requestData: CheckoutRequest = { 
      plan_id: planId,
      success_url: successUrl || `${window.location.origin}/subscription/success`,
      cancel_url: cancelUrl || `${window.location.origin}/subscription`
    };
    
    console.log('Request data:', requestData);
    
    const response = await subscriptionApi.createCheckoutSession(requestData);
    console.log('Checkout response:', response);
    
    // Handle both direct response and wrapped response
    if (response.checkout_url) {
      return response;
    } else if (response.data && response.data.checkout_url) {
      return response.data;
    } else {
      console.error('Unexpected response format:', response);
      throw new Error('Invalid checkout response format');
    }
  },

  // Verify checkout session
  verifyCheckoutSession: async (sessionId: string): Promise<{ success: boolean; subscription?: Subscription }> => {
    return subscriptionApi.verifyCheckoutSession(sessionId);
  }
};

// Checkout hooks
export const useCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create checkout session and redirect
  const createCheckoutSession = async (
    planId: number, 
    successUrl?: string, 
    cancelUrl?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const session = await checkoutApi.createCheckoutSession(planId, successUrl, cancelUrl);
      if (session.checkout_url) {
        window.location.href = session.checkout_url;
      }
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify checkout session
  const verifyCheckoutSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await checkoutApi.verifyCheckoutSession(sessionId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify checkout session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createCheckoutSession,
    verifyCheckoutSession,
  };
};

