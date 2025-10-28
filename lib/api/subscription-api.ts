"use client";

import { BaseApiClient } from './base-api-client';
import type { 
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
  CheckoutRequest,
  CheckoutResponse
} from '../types/api';

export class SubscriptionApiClient extends BaseApiClient {
  // Get all available subscription plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await this.get<SubscriptionPlan[]>('/plans');
    
    // Handle both direct array response and wrapped response
    if (Array.isArray(response)) {
      return response;
    } else if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.error('Unexpected plans response format:', response);
      return [];
    }
  }

  // Get current subscription
  async getCurrentSubscription(): Promise<Subscription> {
    return this.get<Subscription>('/subscription');
  }

  // Get subscription history
  async getSubscriptionHistory(): Promise<SubscriptionHistory[]> {
    const response = await this.get<SubscriptionHistory[]>('/subscription/history');
    
    if (Array.isArray(response)) {
      return response;
    } else if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.error('Unexpected subscription history response format:', response);
      return [];
    }
  }

  // Get usage statistics
  async getUsage(): Promise<UsageStatistics> {
    return this.get<UsageStatistics>('/usage');
  }

  // Upgrade subscription
  async upgradeSubscription(request: UpgradeRequest): Promise<UpgradeResponse> {
    return this.post<UpgradeResponse>('/subscription/upgrade', request);
  }

  // Downgrade subscription
  async downgradeSubscription(request: DowngradeRequest): Promise<DowngradeResponse> {
    return this.post<DowngradeResponse>('/subscription/downgrade', request);
  }

  // Cancel subscription
  async cancelSubscription(request: CancelRequest): Promise<CancelResponse> {
    return this.post<CancelResponse>('/subscription/cancel', request);
  }

  // Create checkout session
  async createCheckoutSession(request: CheckoutRequest): Promise<CheckoutResponse> {
    return this.post<CheckoutResponse>('/checkout', request);
  }

  // Verify checkout session
  async verifyCheckoutSession(sessionId: string): Promise<{ success: boolean; subscription?: Subscription }> {
    return this.get<{ success: boolean; subscription?: Subscription }>(`/checkout/verify/${sessionId}`);
  }
}

// Create subscription API client instance
export const subscriptionApi = new SubscriptionApiClient();