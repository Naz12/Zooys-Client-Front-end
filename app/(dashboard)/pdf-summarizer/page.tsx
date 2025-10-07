"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, Plus, Search, Trash2, Eye, Calendar, AlertCircle } from "lucide-react";
import { aiResultsApi } from "@/lib/api-client";
import { AIResult } from "@/lib/types/api";

// Define the structure for result_data
interface SummaryResultData {
  summary?: string;
  [key: string]: unknown;
}
import { useNotifications } from "@/lib/notifications";

export default function PDFSummarizerPage() {
  const router = useRouter();
  const { showError, showSuccess } = useNotifications();
  
  const [pdfSummaries, setPdfSummaries] = useState<AIResult[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<AIResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Removed pagination state - loading all summaries at once
  const isLoadingRef = useRef(false);

  const loadPdfSummaries = useCallback(async (search?: string) => {
    // Prevent multiple simultaneous requests
    if (isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      const searchParam = search && search.trim().length > 0 ? search : undefined;
      const response = await aiResultsApi.getResults('summarize', searchParam, 1, 100); // Load up to 100 summaries
      
      // Debug log to see the actual response structure
      console.log('PDF Summaries API Response:', response);
      
      // Handle different response structures
      const summaries = response.ai_results || response.data?.ai_results || [];
      
      // Validate that we have a valid array
      if (!Array.isArray(summaries)) {
        console.error('Invalid response structure:', response);
        setPdfSummaries([]);
        setBackendAvailable(false);
        showError("Invalid Response", "The server returned an invalid response format");
        return;
      }
      
      setPdfSummaries(summaries as AIResult[]);
      setBackendAvailable(true);
    } catch (error) {
      console.error('Failed to load PDF summaries:', error);

      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
          setBackendAvailable(false);
          showError("Backend Connection Error", "Cannot connect to the backend server. Please ensure the server is running on http://localhost:8000 and CORS is properly configured.");
        } else if (error.message.includes('Backend server is not running')) {
          setBackendAvailable(false);
          showError("Backend Not Available", "The backend server is not running. Please start the backend server on http://localhost:8000");
        } else if (error.message.includes('Backend server error') || error.message.includes('HTML instead of JSON') || error.message.includes('Invalid JSON response')) {
          setBackendAvailable(false);
          showError("Backend Server Error", "The backend server returned an error page instead of JSON. This usually means there's an error in the backend code. Please check the backend server logs.");
        } else if (error.message.includes('500') && (error as any).rawResponse?.includes('<!DOCTYPE html>')) {
          setBackendAvailable(false);
          showError("Backend Server Error", "The backend server returned an HTML error page (500 Internal Server Error). This indicates a server-side error. Please check the backend server logs.");
        } else {
          setBackendAvailable(false);
          showError("Backend Error", "Failed to load PDF summaries. The backend server may be experiencing issues.");
        }
      } else {
        setBackendAvailable(false);
        showError("Error", "Failed to load PDF summaries");
      }
      setPdfSummaries([]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Load PDF summaries on mount and search changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      loadPdfSummaries(undefined);
    } else {
      const timeoutId = setTimeout(() => {
        loadPdfSummaries(searchTerm);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm]);


  const handleDeleteSummary = async (id: number) => {
    try {
      await aiResultsApi.deleteResult(id);
      
      // Remove from local state immediately
      setPdfSummaries(prev => prev.filter(summary => summary.id !== id));
      
      // Clear selection if deleted item was selected
      if (selectedSummary?.id === id) {
        setSelectedSummary(null);
      }
      
      showSuccess("Success", "PDF summary deleted successfully");
    } catch (error) {
      console.error('Failed to delete PDF summary:', error);
      showError("Error", "Failed to delete PDF summary");
    }
  };

  const handleViewSummary = (summary: AIResult) => {
    setSelectedSummary(summary);
  };

  const handleCreateNew = () => {
    router.push('/pdf-summarizer/create');
  };

  const handleViewPDF = (summary: AIResult) => {
    if (summary.file_url) {
      // Store data for the analysis page
      const analysisData = {
        url: summary.file_url.startsWith('http') ? summary.file_url : `http://localhost:8000${summary.file_url}`,
        summary: {
          id: summary.id.toString(),
          content: (() => {
            try {
              const resultData = summary.result_data;
              if (typeof resultData === 'string') {
                const parsed = JSON.parse(resultData);
                return parsed?.summary || 'No summary available';
              } else if (resultData && typeof resultData === 'object') {
                return (resultData as SummaryResultData)?.summary || 'No summary available';
              }
              return 'No summary available';
            } catch (error) {
              console.error('Error parsing result_data:', error);
              return 'No summary available';
            }
          })(),
          contentType: 'pdf',
        source: {
            title: summary.title,
            author: summary.metadata?.source_info?.author || 'Unknown'
        },
        metadata: {
            wordCount: summary.metadata?.source_info?.word_count || 0,
            processingTime: summary.metadata?.processing_time || '0s',
            confidence: summary.metadata?.confidence || 0.95
          },
          timestamp: summary.created_at
        }
      };
      
        localStorage.setItem('pdfAnalysisData', JSON.stringify(analysisData));
      router.push('/pdf-analysis');
      } else {
        showError("Error", "PDF file not found");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown";
      
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      if (diffInHours < 48) return "Yesterday";
      
      return date.toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PDF Summarizer</h1>
          <p className="text-muted-foreground">
            Create and manage AI-powered PDF summaries
          </p>
        </div>
        <Button 
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Summary
        </Button>
      </div>

      {/* Backend Availability Warning */}
      {!backendAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">Backend Server Not Available</h3>
              <p className="text-sm text-yellow-700">
                The backend server is not running. Please start the backend server on <code className="bg-yellow-100 px-1 rounded">http://localhost:8000</code> to use all features.
              </p>
                    </div>
                    </div>
                </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search PDF summaries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* PDF Summaries Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Summary List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PDF Summaries
              </CardTitle>
            </CardHeader>
            <CardContent>
                    {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading summaries...</p>
                </div>
              ) : !backendAvailable ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="font-medium mb-2 text-red-900">Backend Server Unavailable</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The backend server is not responding. Please ensure the server is running on http://localhost:8000
                  </p>
                  <div className="space-y-2">
                    <Button onClick={() => loadPdfSummaries(searchTerm)} size="sm" variant="outline">
                      Retry Connection
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Check the browser console for more details
                    </p>
                  </div>
                </div>
              ) : pdfSummaries.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No PDF summaries yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first PDF summary to get started
                  </p>
                  <Button onClick={handleCreateNew} size="sm">
                    Create Summary
                  </Button>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                  {pdfSummaries.map((summary) => (
                    <div
                      key={summary.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSummary?.id === summary.id
                          ? 'border-red-200 bg-red-50'
                          : 'border-border hover:border-red-200'
                      }`}
                      onClick={() => handleViewSummary(summary)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {summary.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {summary.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {summary.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(summary.created_at)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSummary(summary.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
              )}
            </CardContent>
          </Card>
          </div>

        {/* Right Panel - Summary Details */}
        <div className="lg:col-span-2">
          {selectedSummary ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <FileText className="h-5 w-5" />
                  {selectedSummary.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div>
                  <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Description</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedSummary.description || 'No description available'}
                  </p>
                </div>

                  <div>
                  <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Summary</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border max-h-64 overflow-y-auto">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {(() => {
                        try {
                          const resultData = selectedSummary.result_data;
                          if (typeof resultData === 'string') {
                            const parsed = JSON.parse(resultData);
                            return parsed?.summary || 'No summary available';
                          } else if (resultData && typeof resultData === 'object') {
                            return (resultData as SummaryResultData)?.summary || 'No summary available';
                          }
                          return 'No summary available';
                        } catch (error) {
                          console.error('Error parsing result_data:', error);
                          return 'No summary available';
                        }
                      })()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedSummary.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Created {formatDate(selectedSummary.created_at)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewPDF(selectedSummary)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View PDF & Summary
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteSummary(selectedSummary.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Summary Details
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Summary Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a summary from the list to view details
                </p>
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}