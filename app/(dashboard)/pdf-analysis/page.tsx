"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import UniversalResultDisplay from "@/components/universal-result-display";
import { 
  FileText, 
  ArrowLeft, 
  Settings, 
  Brain, 
  Download, 
  Maximize, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  MoreHorizontal 
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PDFAnalysisPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [autoFit, setAutoFit] = useState("page");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    // Get data from URL parameters or localStorage
    const pdfData = searchParams.get('pdfData');
    const summary = searchParams.get('summary');
    
    if (pdfData) {
      try {
        const parsedPdfData = JSON.parse(decodeURIComponent(pdfData));
        
        // Handle both relative and absolute URLs
        let pdfUrl = parsedPdfData.url;
        if (pdfUrl && pdfUrl.startsWith('/')) {
          pdfUrl = `http://localhost:8000${pdfUrl}`;
        }
        
        setPdfUrl(pdfUrl);
        setSummaryData(parsedPdfData.summary);
      } catch (error) {
        console.error('Error parsing PDF data:', error);
        showError("Error", "Invalid PDF data");
        router.push('/pdf-summarizer');
      }
    } else {
      // Try to get from localStorage as fallback
      const storedData = localStorage.getItem('pdfAnalysisData');
      console.log('Stored data from localStorage:', storedData);
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          console.log('Parsed data:', data);
          console.log('PDF URL from stored data:', data.url);
          
          // Handle both relative and absolute URLs
          let pdfUrl = data.url;
          if (pdfUrl && pdfUrl.startsWith('/')) {
            // Convert relative URL to full backend URL
            pdfUrl = `http://localhost:8000${pdfUrl}`;
            console.log('Converted relative URL to full URL:', pdfUrl);
          }
          
          setPdfUrl(pdfUrl);
          setSummaryData(data.summary);
        } catch (error) {
          console.error('Error parsing stored data:', error);
          router.push('/pdf-summarizer');
        }
      } else {
        console.log('No stored data found, redirecting to pdf-summarizer');
        router.push('/pdf-summarizer');
      }
    }
  }, []); // Empty dependency array to run only once on mount

  const handleBackToUpload = () => {
    // Clear stored data
    localStorage.removeItem('pdfAnalysisData');
    router.push('/pdf-summarizer');
  };

  const handleRegenerate = () => {
    showSuccess("Info", "Regenerating summary...");
    // Add regeneration logic here
  };

  const handleExport = (format: string) => {
    console.log(`Exporting as ${format}`);
    showSuccess("Info", `Exporting as ${format}...`);
  };

  if (!pdfUrl || !summaryData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading PDF analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[85vh] flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-muted/50 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToUpload}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium">PDF Analysis</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="ghost" size="sm">
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 h-full overflow-hidden">
        {/* Left Side - PDF Viewer with Controls */}
        <div className="bg-card border-r border-border flex flex-col">
          {/* PDF Controls */}
          <div className="bg-muted/30 border-b border-border px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
              </div>
              <Button variant="ghost" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={autoFit}
                onChange={(e) => setAutoFit(e.target.value)}
                className="text-xs bg-background border border-border rounded px-2 py-1"
              >
                <option value="page">Auto fit</option>
                <option value="width">Fit width</option>
                <option value="height">Fit height</option>
              </select>
              <Button variant="ghost" size="sm">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">{zoomLevel}%</span>
              <Button variant="ghost" size="sm">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* PDF Viewer - Fixed to prevent refreshing */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-900">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="PDF Preview"
              key={pdfUrl} // Use key to prevent unnecessary re-renders
              onLoad={() => console.log('PDF loaded successfully')}
              onError={() => console.error('PDF failed to load:', pdfUrl)}
            />
          </div>
        </div>

        {/* Right Side - AI Summary with Controls */}
        <div className="bg-card flex flex-col h-full">
          {/* Summary Controls */}
          <div className="flex-shrink-0 bg-muted/30 border-b border-border px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="bg-primary/10 text-primary">
                <Brain className="h-4 w-4 mr-2" />
                AI Notes
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                AI Chat
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Summary Display */}
          <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {/* Check if this is the new TextJobResultData format */}
            {summaryData.summary && summaryData.key_points && summaryData.confidence_score !== undefined ? (
              <UniversalResultDisplay
                result={summaryData}
                onRegenerate={handleRegenerate}
                onExport={handleExport}
                showMetadata={true}
                showActions={true}
              />
            ) : (
              /* Fallback to old format display */
              <>
                {/* Fixed Header */}
                <div className="flex-shrink-0 p-4 border-b border-border bg-card">
                  <h2 className="text-lg font-semibold mb-2">
                    Summary of {summaryData.source?.title || 'PDF Document'}
                  </h2>
                  <div className="text-sm text-muted-foreground">
                    {summaryData.source?.author && `By ${summaryData.source.author} • `}
                    {summaryData.metadata?.wordCount} words • {summaryData.metadata?.processingTime}s processing time
                  </div>
                </div>
                
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {summaryData.content}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex-shrink-0 border-t border-border p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("text")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Confidence: {Math.round((summaryData.metadata?.confidence || 0) * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
