"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  XCircle, 
  CreditCard, 
  ArrowLeft,
  RefreshCw,
  Mail,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import PageNavigation from '@/components/ui/page-navigation';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen space-y-8">
      {/* Navigation Header */}
      <PageNavigation title="Payment Cancelled" />

      {/* Cancel Content */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cancel Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold">Payment Cancelled</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your payment was cancelled or failed. Don't worry, you can try again or explore our other options.
          </p>
        </div>

        {/* Current Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Status</h2>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Payment Pending
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Your subscription is not active yet. Complete the payment process to access premium features.
          </p>
        </Card>

        {/* What Happened */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">What Happened?</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium">Payment Process Interrupted</h4>
                <p className="text-sm text-muted-foreground">
                  The payment process was cancelled before completion. This could be due to browser issues, 
                  network problems, or intentional cancellation.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">No Charges Made</h4>
                <p className="text-sm text-muted-foreground">
                  No charges were made to your payment method. You can safely try again with the same or different payment method.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">What Can You Do?</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">1</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Try Again</h4>
                <p className="text-sm text-muted-foreground">
                  Retry the payment process with the same or different payment method
                </p>
              </div>
              <Button onClick={() => router.push('/subscription')}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">2</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Choose a Different Plan</h4>
                <p className="text-sm text-muted-foreground">
                  Explore our other subscription plans that might better fit your needs
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push('/subscription')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                View Plans
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">3</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Contact Support</h4>
                <p className="text-sm text-muted-foreground">
                  Get help from our support team if you're experiencing issues
                </p>
              </div>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </Card>

        {/* Alternative Options */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Need Help?</h4>
              <p className="text-sm text-blue-700 mt-1">
                If you continue to experience payment issues, please contact our support team. 
                We're here to help you get started with your subscription.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="text-blue-700 border-blue-300">
                  <Mail className="h-3 w-3 mr-1" />
                  Email Support
                </Button>
                <Button size="sm" variant="outline" className="text-blue-700 border-blue-300">
                  <HelpCircle className="h-3 w-3 mr-1" />
                  Help Center
                </Button>
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
            <RefreshCw className="h-4 w-4" />
            <span>Try Payment Again</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            size="lg"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>

        {/* Additional Information */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Having trouble with payments? Check our{' '}
            <a href="#" className="text-primary hover:underline">payment troubleshooting guide</a>{' '}
            or contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
