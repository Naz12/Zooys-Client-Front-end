# Subscription Plan Documentation

## Overview

This document provides comprehensive documentation for the client-side subscription management system implemented for the Note GPT Dashboard. The system includes subscription management, payment processing with Stripe Checkout, real-time usage tracking, and complete plan upgrade/downgrade functionality.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [API Endpoints](#api-endpoints)
3. [TypeScript Types](#typescript-types)
4. [Components](#components)
5. [Hooks & Context](#hooks--context)
6. [Payment Integration](#payment-integration)
7. [Usage Tracking](#usage-tracking)
8. [Mobile Optimization](#mobile-optimization)
9. [Environment Configuration](#environment-configuration)
10. [Implementation Guide](#implementation-guide)

## System Architecture

### Core Components

```
lib/
├── types/api.ts                    # TypeScript type definitions
├── subscription-api.ts             # Subscription API client
├── checkout-api.ts                 # Stripe Checkout API client
├── subscription-context.tsx        # Global subscription state
├── hooks/use-usage-polling.ts      # Real-time usage polling
└── environment.ts                  # Environment configuration

components/subscription/
├── usage-display.tsx               # Usage statistics display
├── usage-alerts.tsx                # Usage threshold alerts
├── current-subscription.tsx        # Current subscription overview
├── subscription-plans.tsx          # Plan selection interface
├── plan-card.tsx                   # Individual plan card
├── upgrade-dialog.tsx              # Upgrade confirmation dialog
├── downgrade-dialog.tsx            # Downgrade confirmation dialog
└── checkout-flow.tsx               # Stripe Checkout flow

app/(dashboard)/subscription/
├── page.tsx                        # Main subscription page
├── success/page.tsx                # Payment success page
└── cancel/page.tsx                 # Payment cancellation page
```

## API Endpoints

### Subscription Management

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/plans` | GET | Get available subscription plans | `SubscriptionPlan[]` |
| `/api/subscription` | GET | Get current subscription | `Subscription` |
| `/api/subscription/history` | GET | Get subscription history | `SubscriptionHistory[]` |
| `/api/subscription/upgrade` | POST | Upgrade subscription | `UpgradeResponse` |
| `/api/subscription/downgrade` | POST | Downgrade subscription | `DowngradeResponse` |
| `/api/subscription/cancel` | POST | Cancel subscription | `CancelResponse` |
| `/api/usage` | GET | Get usage statistics | `UsageStatistics` |

### Payment Processing

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/checkout` | POST | Create Stripe checkout session | `CheckoutSession` |
| `/api/checkout/verify/{sessionId}` | GET | Verify checkout session | `CheckoutVerification` |
| `/api/stripe/webhook` | POST | Stripe webhook handler | Webhook events |

## TypeScript Types

### Core Subscription Types

```typescript
interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  currency: string;
  limit: number;
  is_active: boolean;
  interval: 'monthly' | 'yearly';
  description?: string;
  features: string[];
  popular?: boolean;
  testing?: boolean;
}

interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  plan: SubscriptionPlan;
  active: boolean;
  starts_at: string;
  ends_at: string;
  current_usage: number;
  usage_reset_date: string;
  billing_cycle_start: string;
  grace_period_ends_at: string | null;
  last_alert_sent_at: string | null;
  created_at: string;
  updated_at: string;
  status: 'active' | 'cancelled' | 'expired' | 'inactive';
  price: number;
  currency: string;
  limit: number;
}

interface UsageStatistics {
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  plan: string;
  price: number;
  currency: string;
  plan_limit: number;
  current_usage: number;
  remaining_usage: number;
  usage_percentage: number;
  starts_at: string;
  ends_at: string;
  usage_reset_date: string;
  billing_cycle_start: string;
  in_grace_period: boolean;
  days_until_reset: number;
  usage_by_tool: Record<string, number>;
}
```

### Upgrade/Downgrade Types

```typescript
interface UpgradeRequest {
  plan_id: number;
  via_stripe: boolean;
}

interface UpgradeResponse {
  success: boolean;
  message: string;
  checkout_url: string;
  session_id: string;
  proration_amount: number;
  new_plan: SubscriptionPlan;
  effective_date: string;
}

interface DowngradeRequest {
  plan_id: number;
  immediately?: boolean;
}

interface DowngradeResponse {
  success: boolean;
  message: string;
  new_plan: SubscriptionPlan;
  effective_date: string;
  proration_credit: number;
}
```

## Components

### UsageDisplay Component

**File:** `components/subscription/usage-display.tsx`

Displays real-time usage statistics with:
- Progress bar with color coding
- Usage breakdown by tool
- Days until reset countdown
- Grace period alerts

**Props:**
```typescript
interface UsageDisplayProps {
  usage: UsageStatistics;
  className?: string;
}
```

### UsageAlerts Component

**File:** `components/subscription/usage-alerts.tsx`

Shows usage threshold alerts with:
- Warning notifications at 80%, 90%, 100%
- Grace period information
- Upgrade prompts
- Payment management options

**Props:**
```typescript
interface UsageAlertsProps {
  usage: UsageStatistics;
  onUpgrade?: () => void;
  onManagePayment?: () => void;
  className?: string;
}
```

### UpgradeDialog Component

**File:** `components/subscription/upgrade-dialog.tsx`

Handles subscription upgrades with:
- Proration amount calculation
- New plan benefits display
- Cost difference calculation
- Stripe Checkout redirection

**Props:**
```typescript
interface UpgradeDialogProps {
  currentPlan: SubscriptionPlan;
  targetPlan: SubscriptionPlan;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### DowngradeDialog Component

**File:** `components/subscription/downgrade-dialog.tsx`

Handles subscription downgrades with:
- Feature loss warnings
- Credit information
- Immediate vs end-of-cycle options
- Confirmation flow

**Props:**
```typescript
interface DowngradeDialogProps {
  currentPlan: SubscriptionPlan;
  targetPlan: SubscriptionPlan;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### CheckoutFlow Component

**File:** `components/subscription/checkout-flow.tsx`

Manages Stripe Checkout integration with:
- Plan summary display
- Security notices
- Loading states
- Error handling

**Props:**
```typescript
interface CheckoutFlowProps {
  plan: SubscriptionPlan;
  onSuccess?: (subscriptionId: string) => void;
  onCancel?: () => void;
  className?: string;
}
```

## Hooks & Context

### useUsagePolling Hook

**File:** `lib/hooks/use-usage-polling.ts`

Provides real-time usage polling with:
- Configurable polling interval (default: 5 minutes)
- Threshold-based notifications
- Visibility change handling
- Error recovery

**Usage:**
```typescript
const {
  usage,
  loading,
  error,
  refreshUsage,
  startPolling,
  stopPolling,
  isPolling,
  lastUpdated
} = useUsagePolling({
  interval: 5 * 60 * 1000,
  enabled: true,
  onThresholdReached: (percentage) => {
    // Handle threshold notifications
  }
});
```

### SubscriptionContext

**File:** `lib/subscription-context.tsx`

Provides global subscription state management with:
- Current subscription data
- Usage statistics
- Plans list
- Loading states
- Error handling
- Real-time updates

**Usage:**
```typescript
const {
  plans,
  currentSubscription,
  usage,
  loading,
  error,
  loadPlans,
  loadCurrentSubscription,
  upgradeSubscription,
  downgradeSubscription
} = useSubscriptionContext();
```

## Payment Integration

### Stripe Checkout Flow

1. **Plan Selection**: User selects a plan
2. **Checkout Session**: Create Stripe checkout session via `/api/checkout`
3. **Redirect**: Redirect to Stripe Checkout URL
4. **Payment**: User completes payment on Stripe
5. **Webhook**: Stripe sends webhook to `/api/stripe/webhook`
6. **Success**: Redirect to `/subscription/success`
7. **Verification**: Verify payment completion

### Payment Success Page

**File:** `app/(dashboard)/subscription/success/page.tsx`

Features:
- Session verification
- Success message display
- Updated subscription info
- Auto-redirect after 5 seconds

### Payment Cancellation Page

**File:** `app/(dashboard)/subscription/cancel/page.tsx`

Features:
- Cancellation message
- Retry payment option
- Alternative plan suggestions
- Support contact

## Usage Tracking

### Real-time Updates

The system provides real-time usage tracking through:

1. **Polling Hook**: `useUsagePolling` polls `/api/usage` every 5 minutes
2. **Threshold Alerts**: Notifications at 80%, 90%, and 100% usage
3. **Visual Indicators**: Color-coded progress bars
4. **Grace Period**: Handles payment failures with grace periods

### Usage Thresholds

| Threshold | Color | Action |
|-----------|-------|--------|
| < 75% | Green | Normal usage |
| 75-90% | Yellow | Warning notification |
| 90-100% | Red | Critical warning |
| 100% | Red | Limit reached, upgrade required |

### Usage Breakdown

The system tracks usage by tool:
- YouTube Summarizer
- AI Writer
- PDF Summarizer
- Math Solver
- Flashcards Generator
- Diagram Generator

## Mobile Optimization

### Responsive Design

All components are mobile-first with:
- Touch-friendly buttons (minimum 44px)
- Swipeable tabs on mobile
- Stack layout for small screens
- Collapsible sections
- Pull-to-refresh for usage data

### Mobile-Specific Features

- **Progress Bars**: Responsive with mobile-friendly sizing
- **Comparison Tables**: Horizontal scroll on mobile
- **Dialogs**: Full-screen on mobile devices
- **Navigation**: Touch-optimized navigation

## Environment Configuration

### Required Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Frontend Configuration
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# Optional Configuration
NEXT_PUBLIC_TOKEN_STORAGE_KEY=auth_token
NEXT_PUBLIC_USER_STORAGE_KEY=auth_user
```

### Environment Setup

**File:** `lib/environment.ts`

```typescript
export const environment = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
  // ... other configurations
};
```

## Implementation Guide

### Setting Up the Subscription System

1. **Install Dependencies**:
   ```bash
   npm install @stripe/stripe-js @stripe/react-stripe-js date-fns
   ```

2. **Configure Environment**:
   - Add Stripe publishable key
   - Set API base URL
   - Configure frontend URL

3. **Wrap App with Provider**:
   ```typescript
   import { SubscriptionProvider } from '@/lib/subscription-context';
   
   function App({ children }) {
     return (
       <SubscriptionProvider>
         {children}
       </SubscriptionProvider>
     );
   }
   ```

4. **Add Routes**:
   - `/subscription` - Main subscription page
   - `/subscription/success` - Payment success page
   - `/subscription/cancel` - Payment cancellation page

### Usage Examples

#### Basic Subscription Management

```typescript
import { useSubscriptionContext } from '@/lib/subscription-context';

function SubscriptionPage() {
  const {
    plans,
    currentSubscription,
    usage,
    loadPlans,
    upgradeSubscription
  } = useSubscriptionContext();

  useEffect(() => {
    loadPlans();
  }, []);

  const handleUpgrade = async (planId: number) => {
    try {
      await upgradeSubscription(planId);
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  return (
    <div>
      {/* Render subscription components */}
    </div>
  );
}
```

#### Real-time Usage Tracking

```typescript
import { useUsagePolling } from '@/lib/hooks/use-usage-polling';

function UsageTracker() {
  const {
    usage,
    loading,
    error,
    refreshUsage
  } = useUsagePolling({
    interval: 5 * 60 * 1000,
    enabled: true,
    onThresholdReached: (percentage) => {
      if (percentage >= 90) {
        // Show critical warning
      }
    }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Usage: {usage?.current_usage} / {usage?.plan_limit}</h3>
      <div>Percentage: {usage?.usage_percentage}%</div>
    </div>
  );
}
```

### Error Handling

The system includes comprehensive error handling:

1. **API Errors**: Network failures, server errors
2. **Payment Errors**: Stripe failures, card declines
3. **Validation Errors**: Form validation, input errors
4. **User Feedback**: Toast notifications, error messages

### Testing

#### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import { UsageDisplay } from '@/components/subscription/usage-display';

test('displays usage statistics', () => {
  const mockUsage = {
    current_usage: 50,
    plan_limit: 100,
    usage_percentage: 50,
    // ... other properties
  };

  render(<UsageDisplay usage={mockUsage} />);
  
  expect(screen.getByText('50 / 100')).toBeInTheDocument();
  expect(screen.getByText('50.0%')).toBeInTheDocument();
});
```

#### Integration Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { SubscriptionProvider } from '@/lib/subscription-context';

test('loads subscription data', async () => {
  render(
    <SubscriptionProvider>
      <SubscriptionPage />
    </SubscriptionProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
  });
});
```

## Security Considerations

### Payment Security

- **PCI Compliance**: All payment processing handled by Stripe
- **Token Management**: Secure token storage and handling
- **Webhook Verification**: Stripe webhook signature verification
- **HTTPS**: All API communication over HTTPS

### Data Protection

- **Input Validation**: Client and server-side validation
- **Error Handling**: No sensitive data in error messages
- **User Data**: Secure handling of user information

## Performance Optimization

### Loading Performance

- **Code Splitting**: Lazy loading of subscription components
- **Caching**: API response caching
- **Optimistic Updates**: Immediate UI updates
- **Skeleton Loading**: Loading placeholders

### User Experience

- **Real-time Updates**: Live usage tracking
- **Error Recovery**: Automatic retry for failed requests
- **Offline Support**: Basic offline functionality
- **Mobile Performance**: Optimized for mobile devices

## Troubleshooting

### Common Issues

1. **Stripe Checkout Not Loading**:
   - Check Stripe publishable key
   - Verify API endpoint configuration
   - Check network connectivity

2. **Usage Not Updating**:
   - Verify polling is enabled
   - Check API endpoint availability
   - Review browser console for errors

3. **Payment Success Page Not Loading**:
   - Verify session ID in URL
   - Check API verification endpoint
   - Review webhook configuration

### Debug Mode

Enable debug mode by setting:
```bash
NEXT_PUBLIC_DEBUG_MODE=true
```

This will provide additional logging and error information.

## Future Enhancements

### Planned Features

1. **Advanced Analytics**: Detailed usage analytics
2. **Bulk Operations**: Batch subscription management
3. **Custom Plans**: User-defined subscription plans
4. **Multi-currency**: Support for multiple currencies
5. **API Access**: Subscription management API

### Performance Improvements

1. **WebSocket Integration**: Real-time updates via WebSocket
2. **Service Worker**: Offline functionality
3. **Progressive Web App**: PWA features
4. **Advanced Caching**: Intelligent caching strategies

## Support

For technical support or questions about the subscription system:

1. **Documentation**: Refer to this documentation
2. **Code Comments**: Check inline code comments
3. **Issue Tracking**: Use project issue tracker
4. **Team Contact**: Contact development team

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team
