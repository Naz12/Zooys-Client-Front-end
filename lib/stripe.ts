"use client";

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { environment } from './environment';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Payment intent types
export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CreatePaymentIntentRequest {
  plan_id: string;
  amount: number;
  currency: string;
  customer_id?: string;
}

// Stripe API functions
export const stripeApi = {
  // Create payment intent
  createPaymentIntent: async (data: CreatePaymentIntentRequest): Promise<PaymentIntent> => {
    const response = await fetch(`${environment.API_BASE_URL}/stripe/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return response.json();
  },

  // Create customer
  createCustomer: async (email: string, name: string): Promise<{ customer_id: string }> => {
    const response = await fetch(`${environment.API_BASE_URL}/stripe/create-customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      throw new Error('Failed to create customer');
    }

    return response.json();
  },

  // Create subscription
  createSubscription: async (plan_id: string, customer_id: string, payment_method_id: string): Promise<{ subscription_id: string }> => {
    const response = await fetch(`${environment.API_BASE_URL}/stripe/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({
        plan_id,
        customer_id,
        payment_method_id,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }

    return response.json();
  },

  // Update subscription
  updateSubscription: async (subscription_id: string, plan_id: string): Promise<{ subscription_id: string }> => {
    const response = await fetch(`${environment.API_BASE_URL}/stripe/update-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({
        subscription_id,
        plan_id,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update subscription');
    }

    return response.json();
  },

  // Cancel subscription
  cancelSubscription: async (subscription_id: string): Promise<{ message: string }> => {
    const response = await fetch(`${environment.API_BASE_URL}/stripe/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ subscription_id }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return response.json();
  },

  // Get payment methods
  getPaymentMethods: async (customer_id: string): Promise<any[]> => {
    const response = await fetch(`${environment.API_BASE_URL}/stripe/payment-methods/${customer_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get payment methods');
    }

    return response.json();
  },

  // Add payment method
  addPaymentMethod: async (customer_id: string, payment_method_id: string): Promise<{ message: string }> => {
    const response = await fetch(`${environment.API_BASE_URL}/stripe/add-payment-method`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({
        customer_id,
        payment_method_id,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add payment method');
    }

    return response.json();
  },

  // Remove payment method
  removePaymentMethod: async (payment_method_id: string): Promise<{ message: string }> => {
    const response = await fetch(`${environment.API_BASE_URL}/stripe/remove-payment-method`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ payment_method_id }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove payment method');
    }

    return response.json();
  },
};

// Payment processing utilities
export const paymentUtils = {
  // Format amount for display
  formatAmount: (amount: number, currency: string): string => {
    const symbol = currency === 'USD' ? '$' : currency;
    return `${symbol}${(amount / 100).toFixed(2)}`;
  },

  // Validate card number
  validateCardNumber: (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');
    return /^\d{13,19}$/.test(cleaned);
  },

  // Validate expiry date
  validateExpiryDate: (expiryDate: string): boolean => {
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expMonth = parseInt(month);
    const expYear = parseInt(year);

    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
  },

  // Validate CVC
  validateCVC: (cvc: string): boolean => {
    return /^\d{3,4}$/.test(cvc);
  },

  // Get card type from number
  getCardType: (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6/.test(cleaned)) return 'discover';
    
    return 'unknown';
  },
};

// Webhook event types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

// Webhook handlers
export const webhookHandlers = {
  // Handle checkout session completed
  handleCheckoutSessionCompleted: async (session: any) => {
    console.log('Checkout session completed:', session);
    // Update subscription status in your app
  },

  // Handle invoice payment failed
  handleInvoicePaymentFailed: async (invoice: any) => {
    console.log('Invoice payment failed:', invoice);
    // Notify user of payment failure
  },

  // Handle customer subscription deleted
  handleCustomerSubscriptionDeleted: async (subscription: any) => {
    console.log('Customer subscription deleted:', subscription);
    // Update subscription status in your app
  },

  // Handle invoice payment succeeded
  handleInvoicePaymentSucceeded: async (invoice: any) => {
    console.log('Invoice payment succeeded:', invoice);
    // Update subscription status in your app
  },
};

