"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Zap
} from 'lucide-react';
import { UsageStatistics } from '@/lib/types/api';
import { format } from 'date-fns';

interface UsageDisplayProps {
  usage: UsageStatistics;
  className?: string;
}

export default function UsageDisplay({ usage, className }: UsageDisplayProps) {
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 100) return { text: 'Limit Reached', color: 'text-red-600', icon: AlertTriangle };
    if (percentage >= 90) return { text: 'Near Limit', color: 'text-yellow-600', icon: AlertTriangle };
    if (percentage >= 75) return { text: 'High Usage', color: 'text-yellow-600', icon: TrendingUp };
    return { text: 'Normal', color: 'text-green-600', icon: CheckCircle };
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const status = getUsageStatus(usage.usage_percentage);
  const StatusIcon = status.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Usage Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Usage Statistics</h3>
              <p className="text-sm text-muted-foreground">
                {usage.plan} • {usage.currency}${usage.price}
              </p>
            </div>
          </div>
          <Badge 
            variant={usage.status === 'active' ? 'default' : 'secondary'}
            className={`${status.color} bg-opacity-10`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.text}
          </Badge>
        </div>

        {/* Usage Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Usage</span>
            <span className="font-medium">
              {usage.current_usage.toLocaleString()} / {usage.plan_limit === -1 ? '∞' : usage.plan_limit.toLocaleString()}
            </span>
          </div>
          
          <Progress 
            value={Math.min(usage.usage_percentage, 100)} 
            className="h-3"
          />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0</span>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-white text-xs ${getUsageColor(usage.usage_percentage)}`}>
                {usage.usage_percentage.toFixed(1)}%
              </span>
              {usage.plan_limit !== -1 && (
                <span>{usage.remaining_usage.toLocaleString()} remaining</span>
              )}
            </div>
            <span>{usage.plan_limit === -1 ? '∞' : usage.plan_limit.toLocaleString()}</span>
          </div>
        </div>

        {/* Reset Information */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Usage resets in</span>
            </div>
            <span className="font-medium">{usage.days_until_reset} days</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Reset date</span>
            </div>
            <span className="font-medium">{formatDate(usage.usage_reset_date)}</span>
          </div>
        </div>
      </Card>

      {/* Usage by Tool */}
      {usage.by_tool && Object.keys(usage.by_tool).length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Usage by Tool</h4>
          <div className="space-y-3">
            {Object.entries(usage.by_tool).map(([tool, count]) => (
              <div key={tool} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{tool}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {count.toLocaleString()} requests
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Grace Period Alert */}
      {usage.in_grace_period && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <h4 className="font-medium text-yellow-900">Grace Period Active</h4>
              <p className="text-sm text-yellow-700">
                Your subscription is in a grace period. Please update your payment method to continue using the service.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
