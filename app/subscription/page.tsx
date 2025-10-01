"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubscriptionPlans from '@/components/subscription/subscription-plans';
import CurrentSubscription from '@/components/subscription/current-subscription';
import SubscriptionHistory from '@/components/subscription/subscription-history';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  History, 
  Settings, 
  TrendingUp,
  HelpCircle,
  Home,
  ArrowLeft
} from 'lucide-react';
import PageNavigation from '@/components/ui/page-navigation';

export default function SubscriptionPage() {
  const [activeTab, setActiveTab] = useState('current');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Navigation Header */}
        <PageNavigation title="Subscription Management" />

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Subscription Management</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Manage your subscription, view usage, and explore our plans to get the most out of Zooys Dashboard.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">Pro Plan</div>
                <div className="text-sm text-muted-foreground">Current Plan</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">2,450</div>
                <div className="text-sm text-muted-foreground">Requests Used</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">10,000</div>
                <div className="text-sm text-muted-foreground">Monthly Limit</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <History className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Months Active</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="current" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Current Plan</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Plans</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center space-x-2">
              <HelpCircle className="h-4 w-4" />
              <span>Help</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <CurrentSubscription />
          </TabsContent>

          <TabsContent value="plans">
            <SubscriptionPlans />
          </TabsContent>

          <TabsContent value="history">
            <SubscriptionHistory />
          </TabsContent>

          <TabsContent value="help">
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">How do I change my subscription plan?</h3>
                    <p className="text-muted-foreground">
                      You can upgrade or downgrade your plan at any time from the Plans tab. 
                      Changes will be prorated and reflected in your next billing cycle.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">What happens if I exceed my usage limit?</h3>
                    <p className="text-muted-foreground">
                      If you exceed your monthly usage limit, you'll be notified and can either 
                      upgrade your plan or wait for the next billing cycle to reset your usage.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Can I cancel my subscription anytime?</h3>
                    <p className="text-muted-foreground">
                      Yes, you can cancel your subscription at any time. You'll continue to have 
                      access to your current plan until the end of your billing period.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">How do I update my payment method?</h3>
                    <p className="text-muted-foreground">
                      You can update your payment method from the Current Plan tab by clicking 
                      the "Manage" button and then "Payment Methods".
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-left">
                      <div className="font-semibold">Contact Support</div>
                      <div className="text-sm text-muted-foreground">
                        Get help from our support team
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-left">
                      <div className="font-semibold">Documentation</div>
                      <div className="text-sm text-muted-foreground">
                        Read our comprehensive guides
                      </div>
                    </div>
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
