"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { UsageStatistics } from '@/lib/types/api';
import { subscriptionApi } from '@/lib/subscription-api';
import { notifications } from '@/lib/notifications';

interface UseUsagePollingOptions {
  interval?: number; // Polling interval in milliseconds (default: 5 minutes)
  enabled?: boolean; // Whether polling is enabled (default: true)
  onThresholdReached?: (percentage: number) => void; // Callback when usage threshold is reached
  thresholds?: number[]; // Usage percentage thresholds to trigger alerts (default: [80, 90, 100])
}

interface UseUsagePollingReturn {
  usage: UsageStatistics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshUsage: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
}

export function useUsagePolling(options: UseUsagePollingOptions = {}): UseUsagePollingReturn {
  const {
    interval = 5 * 60 * 1000, // 5 minutes
    enabled = true,
    onThresholdReached,
    thresholds = [80, 90, 100]
  } = options;

  const [usage, setUsage] = useState<UsageStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousUsageRef = useRef<UsageStatistics | null>(null);
  const thresholdTriggeredRef = useRef<Set<number>>(new Set());

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const usageData = await subscriptionApi.getUsageStatistics();
      
      if (usageData) {
        setUsage(usageData);
        setLastUpdated(new Date());
        
        // Check for threshold crossings
        if (previousUsageRef.current && onThresholdReached) {
          const currentPercentage = usageData.usage_percentage;
          const previousPercentage = previousUsageRef.current.usage_percentage;
          
          thresholds.forEach(threshold => {
            if (
              currentPercentage >= threshold && 
              previousPercentage < threshold &&
              !thresholdTriggeredRef.current.has(threshold)
            ) {
              thresholdTriggeredRef.current.add(threshold);
              onThresholdReached(threshold);
              
              // Show notification based on threshold
              if (threshold === 100) {
                notifications.error(
                  'Usage Limit Reached',
                  'You have reached your monthly usage limit. Please upgrade your plan to continue.'
                );
              } else if (threshold === 90) {
                notifications.warning(
                  'Usage Warning',
                  `You've used ${currentPercentage.toFixed(1)}% of your monthly limit. Consider upgrading soon.`
                );
              } else if (threshold === 80) {
                notifications.info(
                  'Usage Update',
                  `You've used ${currentPercentage.toFixed(1)}% of your monthly limit.`
                );
              }
            }
          });
        }
        
        previousUsageRef.current = usageData;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch usage statistics';
      setError(errorMessage);
      console.error('Usage polling error:', err);
    } finally {
      setLoading(false);
    }
  }, [onThresholdReached, thresholds]);

  const refreshUsage = useCallback(async () => {
    await fetchUsage();
  }, [fetchUsage]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsPolling(true);
    intervalRef.current = setInterval(fetchUsage, interval);
  }, [fetchUsage, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Handle visibility change to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (enabled) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling]);

  // Initial fetch and polling setup
  useEffect(() => {
    if (enabled) {
      fetchUsage();
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, fetchUsage, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    usage,
    loading,
    error,
    lastUpdated,
    refreshUsage,
    startPolling,
    stopPolling,
    isPolling
  };
}
