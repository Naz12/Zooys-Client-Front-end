"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

export default function ApiTestPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [parsedData, setParsedData] = useState<any>(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing direct fetch...');
      const response = await fetch('http://localhost:8000/api/plans', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 233|tczkNMjK4lcG1cnnXC9T7sNPtDO0H2jxXgq99p7D6e1d814c'
        }
      });
      
      console.log('Fetch response:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Parsed JSON data:', data);
      console.log('Data type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      setRawResponse(response);
      setParsedData(data);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testApi();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">API Response Test</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Direct Fetch Test</h2>
        <div className="space-y-4">
          <Button onClick={testApi} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Test API
          </Button>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="font-semibold text-red-800">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {parsedData && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-semibold text-green-800">Parsed Data:</h3>
                <pre className="text-green-700 text-sm overflow-auto max-h-96">
                  {JSON.stringify(parsedData, null, 2)}
                </pre>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-semibold text-blue-800">Data Info:</h3>
                <p><strong>Type:</strong> {typeof parsedData}</p>
                <p><strong>Is Array:</strong> {Array.isArray(parsedData) ? 'Yes' : 'No'}</p>
                <p><strong>Length:</strong> {Array.isArray(parsedData) ? parsedData.length : 'N/A'}</p>
                {Array.isArray(parsedData) && parsedData.length > 0 && (
                  <p><strong>First Item Keys:</strong> {Object.keys(parsedData[0]).join(', ')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Console Logs</h2>
        <p className="text-muted-foreground">
          Check the browser console for detailed API call logs.
        </p>
      </Card>
    </div>
  );
}




