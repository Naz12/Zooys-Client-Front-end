"use client";

import { Loader2, CheckCircle2, XCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { PDFJobStatus } from '@/lib/types/api';

export interface JobStatusProps {
  /** Job status data */
  status: PDFJobStatus | null;
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether polling is active */
  isPolling: boolean;
  /** Error message if any */
  error: string | null;
  /** Download URLs from result */
  downloadUrls?: string[];
  /** Callback when download button is clicked */
  onDownload?: (urls: string[]) => void;
  /** Custom download handler */
  onDownloadClick?: () => void;
}

/**
 * Job Status Component with Progress Bar
 * Displays job status, progress, and download button when completed
 */
export function JobStatus({
  status,
  progress,
  isPolling,
  error,
  downloadUrls = [],
  onDownload,
  onDownloadClick,
}: JobStatusProps) {
  const handleDownload = () => {
    if (onDownloadClick) {
      onDownloadClick();
    } else if (onDownload && downloadUrls.length > 0) {
      onDownload(downloadUrls);
    } else if (downloadUrls.length > 0) {
      // Default download behavior
      downloadUrls.forEach((url) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };

  // Status badge variants
  const getStatusBadge = () => {
    if (!status) return null;

    const statusMap = {
      pending: { label: 'Pending', variant: 'secondary' as const },
      running: { label: 'Processing', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'default' as const, icon: CheckCircle2 },
      failed: { label: 'Failed', variant: 'destructive' as const, icon: XCircle },
    };

    const statusInfo = statusMap[status.status];
    if (!statusInfo) return null;

    const Icon = statusInfo.icon;
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        {Icon && <Icon size={14} />}
        {statusInfo.label}
      </Badge>
    );
  };

  // Show nothing if no status and not polling
  if (!status && !isPolling && !error) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      {status && (
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          {isPolling && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span>Polling status...</span>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {(status?.status === 'running' || isPolling) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-3 flex items-start gap-2">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Status Error */}
      {status?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-3 flex items-start gap-2">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{status.error}</p>
        </div>
      )}

      {/* Download Button - Show when completed, even if URLs not yet fetched */}
      {status?.status === 'completed' && (
        downloadUrls.length > 0 ? (
          <Button
            onClick={handleDownload}
            className="w-full"
            size="lg"
          >
            <Download size={16} className="mr-2" />
            {downloadUrls.length > 1 ? `Download ${downloadUrls.length} Files` : 'Download File'}
          </Button>
        ) : onDownloadClick ? (
          <Button
            onClick={handleDownload}
            className="w-full"
            size="lg"
          >
            <Download size={16} className="mr-2" />
            Download File
          </Button>
        ) : (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Fetching download link...
          </div>
        )
      )}

      {/* Stage Information */}
      {status?.stage && status.stage !== 'completed' && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Stage: {status.stage}
        </p>
      )}
    </div>
  );
}

