"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const errorParam = searchParams.get('error');

        // Handle error from backend
        if (errorParam) {
          const errorMessage = decodeURIComponent(errorParam);
          setError(errorMessage);
          setIsProcessing(false);
          
          // Redirect to login after showing error
          setTimeout(() => {
            router.push('/');
          }, 3000);
          return;
        }

        // Check if we have required parameters
        if (!token || !userParam) {
          setError('Missing authentication data. Please try again.');
          setIsProcessing(false);
          
          setTimeout(() => {
            router.push('/');
          }, 3000);
          return;
        }

        // Decode user information
        let user;
        try {
          // Decode base64 string
          const decodedString = atob(userParam);
          user = JSON.parse(decodedString);
        } catch (parseError) {
          console.error('Failed to parse user data:', parseError);
          setError('Invalid authentication data. Please try again.');
          setIsProcessing(false);
          
          setTimeout(() => {
            router.push('/');
          }, 3000);
          return;
        }

        // Store token and user data
        try {
          // Use the auth context to handle authentication
          await loginWithToken(token, user);
          
          // Get return URL if stored
          const returnUrl = sessionStorage.getItem('return_url') || '/';
          sessionStorage.removeItem('return_url');
          
          // Redirect to dashboard or return URL
          router.push(returnUrl);
        } catch (authError) {
          console.error('Authentication failed:', authError);
          setError('Failed to complete authentication. Please try again.');
          setIsProcessing(false);
          
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } catch (err) {
        console.error('Callback processing error:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsProcessing(false);
        
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, router, loginWithToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-4">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <h2 className="text-xl font-semibold">Completing sign in...</h2>
              <p className="text-muted-foreground">
                Please wait while we complete your authentication.
              </p>
            </>
          ) : error ? (
            <>
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-red-600">Authentication Failed</h2>
              <p className="text-muted-foreground">{error}</p>
              <p className="text-sm text-muted-foreground mt-4">
                Redirecting to login page...
              </p>
            </>
          ) : (
            <>
              <div className="text-green-500 text-4xl mb-4">✓</div>
              <h2 className="text-xl font-semibold">Success!</h2>
              <p className="text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

