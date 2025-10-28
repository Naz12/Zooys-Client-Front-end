"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  CreditCard, 
  Calendar, 
  BarChart3,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useCheckout } from '@/lib/checkout-api';
import { useSubscription } from '@/lib/subscription-api';
import { notifications } from '@/lib/notifications';
import PageNavigation from '@/components/ui/page-navigation';
import { format } from 'date-fns';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loadCurrentSubscription, currentSubscription } = useSubscription();
  
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        // Instead of verifying the session, just refresh the subscription status
        // The webhook should have already processed the payment
        await loadCurrentSubscription();
        
        // Show success message
        notifications.success(
          'Payment Successful',
          'Your subscription has been activated successfully!'
        );
        
        setVerification({ success: true });
      } catch (err) {
        setError('Failed to refresh subscription status');
        console.error('Payment verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, loadCurrentSubscription]);

  // Countdown timer
  useEffect(() => {
    if (!loading && !error && currentSubscription) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, error, currentSubscription]);

  // Handle navigation when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && !loading && !error && currentSubscription) {
      router.push('/subscription');
    }
  }, [countdown, loading, error, currentSubscription, router]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold">Verifying Payment</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your payment...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold">Payment Verification Failed</h2>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex space-x-4">
              <Button onClick={() => router.push('/subscription')}>
                Go to Subscription
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8">
      {/* Navigation Header */}
      <PageNavigation title="Payment Successful" />

      {/* Success Content */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold">Payment Successful!</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your subscription has been activated successfully. You now have access to all premium features.
          </p>
        </div>

        {/* Subscription Details */}
        {currentSubscription && (
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold">{currentSubscription.plan?.name}</h2>
                  <Badge variant="default" className="bg-green-500">
                    Active
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Premium AI tools and features
                </p>
              </div>
            </div>

            {/* Subscription Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span>Billing</span>
                </div>
                <div className="font-semibold">
                  {currentSubscription.plan?.currency === 'USD' ? '$' : currentSubscription.plan?.currency}
                  {currentSubscription.plan?.price}
                  <span className="text-sm text-muted-foreground ml-1">
                    /month
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Next Billing</span>
                </div>
                <div className="font-semibold">
                  {formatDate(currentSubscription.ends_at)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  <span>Usage Limit</span>
                </div>
                <div className="font-semibold">
                  {currentSubscription.plan?.limit === -1 
                    ? 'Unlimited' 
                    : `${currentSubscription.plan?.limit.toLocaleString()} requests`
                  }
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">What's Next?</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">1</span>
              </div>
              <div>
                <h4 className="font-medium">Explore Premium Features</h4>
                <p className="text-sm text-muted-foreground">
                  Access all AI tools with your new subscription limits
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">2</span>
              </div>
              <div>
                <h4 className="font-medium">Monitor Your Usage</h4>
                <p className="text-sm text-muted-foreground">
                  Track your usage and manage your subscription from the dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">3</span>
              </div>
              <div>
                <h4 className="font-medium">Get Support</h4>
                <p className="text-sm text-muted-foreground">
                  Contact our support team if you need any assistance
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => router.push('/subscription')}
            size="lg"
            className="flex items-center space-x-2"
          >
            <span>View Subscription</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            size="lg"
          >
            Go to Dashboard
          </Button>
        </div>

        {/* Auto-redirect Notice */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            You'll be automatically redirected to your subscription page in{' '}
            <span className="font-semibold text-primary">{countdown}</span> seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
