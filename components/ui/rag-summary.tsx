"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain, 
  Search, 
  Loader2, 
  Check, 
  AlertCircle, 
  FileText,
  Clock,
  Hash,
  Trash2,
  RefreshCw
} from "lucide-react";
import { ragApi, type RAGStatusResponse, type RAGSummaryResponse } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";

interface RAGSummaryProps {
  uploadId: number;
  onSummaryGenerated?: (summary: string) => void;
  className?: string;
}

export default function RAGSummary({
  uploadId,
  onSummaryGenerated,
  className = "",
}: RAGSummaryProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [query, setQuery] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ragStatus, setRagStatus] = useState<RAGStatusResponse | null>(null);
  const [summaryData, setSummaryData] = useState<RAGSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check RAG status on component mount
  useEffect(() => {
    if (uploadId) {
      checkRAGStatus();
    }
  }, [uploadId]);

  const checkRAGStatus = async () => {
    if (!user) return;
    
    try {
      const status = await ragApi.getStatus(uploadId);
      setRagStatus(status);
    } catch (error) {
      console.error("Failed to check RAG status:", error);
      setError("Failed to check RAG status");
    }
  };

  const processDocument = async () => {
    if (!user) {
      showError("Error", "Please log in to process documents");
      return;
    }

    setProcessing(true);
    setError(null);
    
    try {
      await ragApi.processDocument(uploadId);
      showSuccess("Success", "Document processed for RAG successfully!");
      await checkRAGStatus(); // Refresh status
    } catch (error) {
      console.error("Failed to process document:", error);
      showError("Error", "Failed to process document for RAG");
    } finally {
      setProcessing(false);
    }
  };

  const generateSummary = async () => {
    if (!query.trim()) {
      showError("Error", "Please enter a query");
      return;
    }

    if (!user) {
      showError("Error", "Please log in to generate summaries");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await ragApi.getSummary({
        upload_id: uploadId,
        query: query.trim(),
        max_chunks: 5,
        mode: "detailed",
        language: "en"
      });
      
      setSummary(response.summary);
      setSummaryData(response);
      onSummaryGenerated?.(response.summary);
      showSuccess("Success", "RAG summary generated successfully!");
    } catch (error) {
      console.error("Failed to generate RAG summary:", error);
      showError("Error", "Failed to generate RAG summary");
    } finally {
      setLoading(false);
    }
  };

  const deleteRAGData = async () => {
    if (!user) {
      showError("Error", "Please log in to delete RAG data");
      return;
    }

    try {
      await ragApi.deleteData(uploadId);
      showSuccess("Success", "RAG data deleted successfully!");
      await checkRAGStatus();
      setSummary("");
      setSummaryData(null);
    } catch (error) {
      console.error("Failed to delete RAG data:", error);
      showError("Error", "Failed to delete RAG data");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not processed";
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (duration: string) => {
    const seconds = parseFloat(duration.replace('s', ''));
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className={`bg-background border border-border ${className}`}>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Brain size={20} className="text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">RAG Document Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Intelligent document processing with query-specific summaries
            </p>
          </div>
        </div>

        {/* RAG Status */}
        <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">RAG Status</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkRAGStatus}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
          
          {ragStatus ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${ragStatus.rag_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  {ragStatus.rag_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Chunks: {ragStatus.chunk_count}
              </div>
              <div className="text-sm text-muted-foreground">
                Processed: {formatDate(ragStatus.processed_at)}
              </div>
              <div className="text-sm text-muted-foreground">
                Pages: {ragStatus.page_range.min}-{ragStatus.page_range.max}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading status...</span>
            </div>
          )}
        </div>

        {/* Process Document Button */}
        {ragStatus && !ragStatus.rag_enabled && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Process this document to enable intelligent query-based summarization.
            </p>
            <Button
              onClick={processDocument}
              disabled={processing}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Document...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Process Document for RAG
                </>
              )}
            </Button>
          </div>
        )}

        {/* Query Input */}
        {ragStatus?.rag_enabled && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Search size={16} className="text-purple-500" />
              <h4 className="font-medium text-sm">Ask a Question</h4>
            </div>
            
            <div className="space-y-2">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What would you like to know about this document? (e.g., 'What are the main benefits?', 'Explain the technical details', 'Summarize the key findings')"
                className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
              />
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={generateSummary}
                  disabled={loading || !query.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Generate RAG Summary
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={deleteRAGData}
                  variant="outline"
                  className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete RAG Data
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Display */}
        {summary && summaryData && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FileText size={16} className="text-purple-500" />
              <h4 className="font-medium text-sm">RAG Summary</h4>
            </div>
            
            <div className="bg-muted/20 border border-border rounded-lg p-4">
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                {summary}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <h5 className="font-medium text-sm mb-3">Analysis Details</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-500">
                    {summaryData.metadata.chunks_used}
                  </div>
                  <div className="text-xs text-muted-foreground">Chunks Used</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-500">
                    {formatDuration(summaryData.metadata.processing_time)}
                  </div>
                  <div className="text-xs text-muted-foreground">Processing Time</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-500">
                    {Math.round(summaryData.metadata.confidence * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-500">
                    {summaryData.metadata.tokens_used}
                  </div>
                  <div className="text-xs text-muted-foreground">Tokens Used</div>
                </div>
              </div>
            </div>

            {/* Source Chunks */}
            {summaryData.source_info.chunks.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Relevant Content Sources</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {summaryData.source_info.chunks.map((chunk, index) => (
                    <div key={chunk.id} className="bg-background border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-purple-500">
                          Chunk {chunk.chunk_index + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(chunk.similarity * 100)}% match
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {chunk.content}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>Pages: {chunk.page_start}-{chunk.page_end}</span>
                        <span>Length: {chunk.content.length} chars</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
