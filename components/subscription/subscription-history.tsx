"use client";

import React, { useEffect, useState } from 'react';
import { useSubscription } from '@/lib/subscription-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function SubscriptionHistory() {
  const {
    history,
    loading,
    error,
    loadHistory,
  } = useSubscription();

  useEffect(() => {
    loadHistory();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'expired':
        return 'bg-gray-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency;
    return `${symbol}${price}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold">Failed to Load History</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadHistory} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">No Subscription History</h3>
          <p className="text-muted-foreground">
            You don't have any subscription history yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription History</h2>
          <p className="text-muted-foreground">
            View your past and current subscriptions
          </p>
        </div>
        <Button onClick={loadHistory} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* History Timeline */}
      <div className="space-y-4">
        {history.map((subscription, index) => (
          <Card key={subscription.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(subscription.status)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold">
                      {subscription.plan_id} Plan
                    </h3>
                    <Badge 
                      variant="secondary"
                      className={getStatusColor(subscription.status)}
                    >
                      {subscription.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>{formatPrice(subscription.price, subscription.currency)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Started {formatDate(subscription.starts_at)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Ended {formatDate(subscription.ends_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {formatDate(subscription.created_at)}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {history.filter(s => s.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active Subscriptions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {history.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Subscriptions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatPrice(
                history.reduce((sum, s) => sum + s.price, 0),
                history[0]?.currency || 'USD'
              )}
            </div>
            <div className="text-sm text-muted-foreground">Total Spent</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

