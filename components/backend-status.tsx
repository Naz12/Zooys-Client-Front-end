"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface BackendStatusProps {
  onStatusChange?: (isOnline: boolean) => void;
}

export default function BackendStatus({ onStatusChange }: BackendStatusProps) {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
  const [details, setDetails] = useState<string>('');

  const checkBackendStatus = async () => {
    setStatus('checking');
    setDetails('Checking backend connection...');

    try {
      // Check if server is running
      const serverResponse = await fetch('http://localhost:8000/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Backend server status:', serverResponse.status);
      
      if (serverResponse.ok) {
        setStatus('online');
        setDetails(`Backend is running (Status: ${serverResponse.status})`);
        onStatusChange?.(true);
      } else {
        setStatus('error');
        setDetails(`Backend responded with status: ${serverResponse.status}`);
        onStatusChange?.(false);
      }
      
    } catch (error) {
      console.error('Backend check failed:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          setStatus('error');
          setDetails('CORS Error: Backend server is running but CORS is not configured. Backend needs to allow requests from http://localhost:3000');
          onStatusChange?.(false);
        } else if (error.message.includes('Failed to fetch')) {
          setStatus('offline');
          setDetails('Backend server is not running on http://localhost:8000');
          onStatusChange?.(false);
        } else {
          setStatus('offline');
          setDetails(`Connection failed: ${error.message}`);
          onStatusChange?.(false);
        }
      } else {
        setStatus('offline');
        setDetails('Cannot connect to backend server on http://localhost:8000');
        onStatusChange?.(false);
      }
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'border-blue-200 bg-blue-50';
      case 'online':
        return 'border-green-200 bg-green-50';
      case 'offline':
        return 'border-red-200 bg-red-50';
      case 'error':
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  return (
    <Card className={`border ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <div>
              <h4 className="font-medium text-sm">Backend Status</h4>
              <p className="text-xs text-muted-foreground">{details}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkBackendStatus}
            disabled={status === 'checking'}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Check
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
