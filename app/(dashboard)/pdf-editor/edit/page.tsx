"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JobStatus } from '@/components/pdf/job-status';
import { MergeForm } from '@/components/pdf/merge-form';
import { SplitForm } from '@/components/pdf/split-form';
import { CompressForm } from '@/components/pdf/compress-form';
import { WatermarkForm } from '@/components/pdf/watermark-form';
import { ProtectForm } from '@/components/pdf/protect-form';
import { UnlockForm } from '@/components/pdf/unlock-form';
import { PageNumbersForm } from '@/components/pdf/page-numbers-form';
import { AnnotateForm } from '@/components/pdf/annotate-form';
import { EditPDFForm } from '@/components/pdf/edit-pdf-form';
import { pdfOperationsApi } from '@/lib/api/pdf-operations-api';
import { useJobPolling } from '@/lib/hooks/use-job-polling';
import { toast } from 'react-hot-toast';
import type { 
  UploadedFile, 
  MergeParams, 
  SplitParams, 
  CompressParams,
  WatermarkParams,
  ProtectParams,
  UnlockParams,
  PageNumbersParams,
  AnnotateParams,
  EditPDFParams
} from '@/lib/types/api';

type OperationTab = 'edit' | 'compress' | 'page-numbers' | 'watermark' | 'protect' | 'unlock' | 'annotate' | 'merge' | 'split';

export default function PDFOperationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const operationParam = searchParams.get('operation');
  
  // File state
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mergeFileIds, setMergeFileIds] = useState<string[]>([]);
  const [mergeFiles, setMergeFiles] = useState<UploadedFile[]>([]);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<OperationTab>(
    (operationParam as OperationTab) || 'edit'
  );
  
  // Job state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [downloadUrls, setDownloadUrls] = useState<string[]>([]);
  
  // Operation parameters state
  const [mergeParams, setMergeParams] = useState<MergeParams>({
    page_order: 'as_uploaded',
    remove_blank_pages: false,
    add_page_numbers: false,
  });
  const [selectedMergeFileIds, setSelectedMergeFileIds] = useState<string[]>([]);
  const [splitParams, setSplitParams] = useState<SplitParams>({
    split_points: '',
    title_prefix: '',
  });
  const [compressParams, setCompressParams] = useState<CompressParams>({
    compression_level: 'medium',
    quality: 85,
  });
  const [watermarkParams, setWatermarkParams] = useState<WatermarkParams>({
    watermark_type: 'text',
    watermark_content: 'DRAFT',
    position_x: 50,
    position_y: 50,
    rotation: -45,
    opacity: 0.3,
    apply_to_all: true,
  });
  const [protectParams, setProtectParams] = useState<ProtectParams>({
    password: '',
    permissions: [],
  });
  const [unlockParams, setUnlockParams] = useState<UnlockParams>({
    password: '',
  });
  const [pageNumbersParams, setPageNumbersParams] = useState<PageNumbersParams>({
    position: 'bottom_right',
    format_type: 'arabic',
    font_size: 12,
    page_ranges: [],
  });
  const [annotateParams, setAnnotateParams] = useState<AnnotateParams>({
    annotations: [],
  });
  const [editPDFParams, setEditPDFParams] = useState<EditPDFParams>({
    page_order: 'as_is',
    remove_blank_pages: false,
  });

  // Load file_id from localStorage and set operation
  useEffect(() => {
    const editorFileId = localStorage.getItem('pdfEditorFileId');
    const editorFileName = localStorage.getItem('pdfEditorFileName');
    const mergeFileIdsStr = localStorage.getItem('pdfMergeFileIds');
    const mergeFilesStr = localStorage.getItem('pdfMergeFiles');
    const splitFileId = localStorage.getItem('pdfSplitFileId');
    const splitFileName = localStorage.getItem('pdfSplitFileName');

    // Determine operation from query param first
    const op = (operationParam as OperationTab);
    
    if (mergeFileIdsStr && mergeFilesStr && op === 'merge') {
      try {
        const ids = JSON.parse(mergeFileIdsStr);
        const files = JSON.parse(mergeFilesStr);
        setMergeFileIds(ids);
        setMergeFiles(files);
        setSelectedMergeFileIds(ids);
        if (files.length > 0) {
          setFileId(files[0].file_id);
          setFileName(files[0].filename);
        }
        setActiveTab('merge');
      } catch (e) {
        console.error('Error loading merge data:', e);
      }
    } else if (splitFileId && op === 'split') {
      setFileId(splitFileId);
      setFileName(splitFileName);
      setActiveTab('split');
    } else if (editorFileId && op) {
      setFileId(editorFileId);
      setFileName(editorFileName);
      setActiveTab(op);
    } else if (op) {
      // Operation specified but no file data - set operation anyway
      setActiveTab(op);
    } else {
      router.push('/pdf-editor');
    }
  }, [router, operationParam]);

  // Job polling hook
  const {
    status: jobStatus,
    progress,
    isPolling,
    error: pollingError,
    startPolling,
    stopPolling,
    reset: resetPolling,
  } = useJobPolling(
    async (job_id: string) => {
      switch (activeTab) {
        case 'merge':
          return pdfOperationsApi.getMergeStatus(job_id);
        case 'split':
          return pdfOperationsApi.getSplitStatus(job_id);
        case 'compress':
          return pdfOperationsApi.getCompressStatus(job_id);
        case 'watermark':
          return pdfOperationsApi.getWatermarkStatus(job_id);
        case 'page-numbers':
          return pdfOperationsApi.getPageNumbersStatus(job_id);
        case 'annotate':
          return pdfOperationsApi.getAnnotateStatus(job_id);
        case 'protect':
          return pdfOperationsApi.getProtectStatus(job_id);
        case 'unlock':
          return pdfOperationsApi.getUnlockStatus(job_id);
        case 'edit':
          return pdfOperationsApi.getEditPDFStatus(job_id);
        default:
          throw new Error('Unknown operation');
      }
    },
    currentJobId,
    { autoStart: false }
  );

  // Fetch result when job completes (only once)
  const hasFetchedResultRef = useRef<string | null>(null);
  
  // Log job status changes
  useEffect(() => {
    console.log('=== JOB STATUS UPDATE ===');
    console.log('Job Status:', jobStatus);
    console.log('Current Job ID:', currentJobId);
    console.log('Progress:', progress);
    console.log('Is Polling:', isPolling);
    console.log('Download URLs:', downloadUrls);
    console.log('Active Tab:', activeTab);
    console.log('========================');
  }, [jobStatus, currentJobId, progress, isPolling, downloadUrls, activeTab]);
  
  useEffect(() => {
    if (jobStatus?.status === 'completed' && currentJobId && hasFetchedResultRef.current !== currentJobId) {
      hasFetchedResultRef.current = currentJobId;
      
      console.log('=== JOB COMPLETED - FETCHING RESULT ===');
      console.log('Job ID:', currentJobId);
      console.log('Operation:', activeTab);
      
      const fetchResult = async () => {
        try {
          let result: any;
          switch (activeTab) {
            case 'merge':
              result = await pdfOperationsApi.getMergeResult(currentJobId);
              break;
            case 'split':
              result = await pdfOperationsApi.getSplitResult(currentJobId);
              break;
            case 'compress':
              result = await pdfOperationsApi.getCompressResult(currentJobId);
              break;
            case 'watermark':
              result = await pdfOperationsApi.getWatermarkResult(currentJobId);
              break;
            case 'page-numbers':
              result = await pdfOperationsApi.getPageNumbersResult(currentJobId);
              break;
            case 'annotate':
              result = await pdfOperationsApi.getAnnotateResult(currentJobId);
              break;
            case 'protect':
              result = await pdfOperationsApi.getProtectResult(currentJobId);
              break;
            case 'unlock':
              result = await pdfOperationsApi.getUnlockResult(currentJobId);
              break;
            case 'edit':
              result = await pdfOperationsApi.getEditPDFResult(currentJobId);
              break;
          }
          
          // Log the full result structure for debugging
          console.log('=== RESULT FROM SERVER ===');
          console.log('Full Result Object:', result);
          console.log('Result Type:', typeof result);
          console.log('Result Keys:', result ? Object.keys(result) : 'null');
          console.log('result.data:', result?.data);
          console.log('result.data?.result:', result?.data?.result);
          console.log('result.data?.download_urls:', result?.data?.download_urls);
          console.log('result.data?.download_url:', result?.data?.download_url);
          console.log('result.download_urls:', result?.download_urls);
          console.log('result.download_url:', result?.download_url);
          console.log('========================');
          
          // Try multiple possible result structures
          console.log('=== PARSING RESULT FOR DOWNLOAD URLS ===');
          if (result?.data?.result?.download_urls) {
            console.log('Found URLs at: result.data.result.download_urls');
            console.log('URLs:', result.data.result.download_urls);
            setDownloadUrls(result.data.result.download_urls);
            toast.success('Operation completed successfully!');
          } else if (result?.data?.result?.download_url) {
            console.log('Found URL at: result.data.result.download_url');
            console.log('URL:', result.data.result.download_url);
            setDownloadUrls([result.data.result.download_url]);
            toast.success('Operation completed successfully!');
          } else if (result?.data?.download_urls) {
            console.log('Found URLs at: result.data.download_urls');
            console.log('URLs:', result.data.download_urls);
            setDownloadUrls(result.data.download_urls);
            toast.success('Operation completed successfully!');
          } else if (result?.data?.download_url) {
            console.log('Found URL at: result.data.download_url');
            console.log('URL:', result.data.download_url);
            setDownloadUrls([result.data.download_url]);
            toast.success('Operation completed successfully!');
          } else if (result?.download_urls) {
            console.log('Found URLs at: result.download_urls');
            console.log('URLs:', result.download_urls);
            setDownloadUrls(result.download_urls);
            toast.success('Operation completed successfully!');
          } else if (result?.download_url) {
            console.log('Found URL at: result.download_url');
            console.log('URL:', result.download_url);
            setDownloadUrls([result.download_url]);
            toast.success('Operation completed successfully!');
          } else {
            console.warn('=== NO DOWNLOAD URLS FOUND ===');
            console.warn('Full result structure:', JSON.stringify(result, null, 2));
            console.warn('===================================');
            toast.error('Result received but no download URLs found');
          }
          
          console.log('=== AFTER PARSING ===');
          console.log('downloadUrls will be set to:', 
            result?.data?.result?.download_urls || 
            (result?.data?.result?.download_url ? [result.data.result.download_url] : null) ||
            result?.data?.download_urls ||
            (result?.data?.download_url ? [result.data.download_url] : null) ||
            result?.download_urls ||
            (result?.download_url ? [result.download_url] : null) ||
            'none found'
          );
          console.log('========================');
        } catch (error: any) {
          console.error('Error fetching result:', error);
          toast.error('Failed to get operation result');
          // Reset ref on error so we can retry if needed
          hasFetchedResultRef.current = null;
        }
      };
      fetchResult();
    }
  }, [jobStatus, currentJobId, activeTab]);

  // Start polling when currentJobId changes
  useEffect(() => {
    if (currentJobId && !isPolling) {
      startPolling();
    }
  }, [currentJobId, isPolling, startPolling]);

  // Handle download
  const handleDownload = useCallback(async (urls: string[]) => {
    for (const url of urls) {
      try {
        const blob = await pdfOperationsApi.downloadFromUrl(url);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = url.split('/').pop() || 'download.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } catch (error) {
        console.error('Download error:', error);
        toast.error(`Failed to download ${url}`);
      }
    }
  }, []);

  // Handle back
  const handleBack = useCallback(() => {
    localStorage.removeItem('pdfEditorFileId');
    localStorage.removeItem('pdfEditorFileName');
    localStorage.removeItem('pdfMergeFileIds');
    localStorage.removeItem('pdfMergeFiles');
    localStorage.removeItem('pdfSplitFileId');
    localStorage.removeItem('pdfSplitFileName');
    router.push('/pdf-editor');
  }, [router]);

  // Operation submit handlers
  const handleOperationSubmit = useCallback(async (operation: OperationTab, params: any) => {
    if (!fileId && operation !== 'merge') {
      toast.error('Please select a file first');
      return;
    }

    if (operation === 'merge') {
      if (selectedMergeFileIds.length < 2) {
        toast.error('Merge requires at least 2 files selected');
        return;
      }
    }

    try {
      let response: any;
      
      switch (operation) {
        case 'merge':
          response = await pdfOperationsApi.merge(selectedMergeFileIds, params);
          break;
        case 'split':
          response = await pdfOperationsApi.split(fileId!, params);
          break;
        case 'compress':
          response = await pdfOperationsApi.compress(fileId!, params);
          break;
        case 'watermark':
          response = await pdfOperationsApi.watermark(fileId!, params);
          break;
        case 'page-numbers':
          response = await pdfOperationsApi.addPageNumbers(fileId!, params);
          break;
        case 'annotate':
          response = await pdfOperationsApi.annotate(fileId!, params);
          break;
        case 'protect':
          response = await pdfOperationsApi.protect(fileId!, params);
          break;
        case 'unlock':
          response = await pdfOperationsApi.unlock(fileId!, params);
          break;
        case 'edit':
          response = await pdfOperationsApi.editPDF(fileId!, params);
          break;
      }

      if (response?.job_id) {
        setDownloadUrls([]);
        resetPolling();
        hasFetchedResultRef.current = null; // Reset result fetch flag for new job
        setCurrentJobId(response.job_id);
        toast.success(`${operation} operation started`);
      } else {
        throw new Error('No job_id returned');
      }
    } catch (error: any) {
      console.error('Operation error:', error);
      toast.error(error.message || 'Failed to start operation');
    }
  }, [fileId, selectedMergeFileIds, resetPolling]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-2"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {fileName || 'PDF Operations'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {mergeFileIds.length > 0 ? `${mergeFileIds.length} files` : fileName ? 'Single file' : ''} • {activeTab ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ') : ''}
            </p>
          </div>
        </div>

        {/* Job Status */}
        {currentJobId && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Operation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <JobStatus
                status={jobStatus}
                progress={progress}
                isPolling={isPolling}
                error={pollingError}
                downloadUrls={downloadUrls}
                onDownload={handleDownload}
              />
            </CardContent>
          </Card>
        )}

        {/* Operations Panel - Show only selected operation */}
        {activeTab && (
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Edit PDF */}
              {activeTab === 'edit' && (
                <div className="space-y-4">
                  <EditPDFForm
                    params={editPDFParams}
                    onParamsChange={setEditPDFParams}
                    onSubmit={() => handleOperationSubmit('edit', editPDFParams)}
                    disabled={isPolling || !fileId}
                  />
                  <Button
                    onClick={() => handleOperationSubmit('edit', editPDFParams)}
                    disabled={!fileId || isPolling}
                    className="w-full"
                  >
                    {isPolling ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Apply Edit'
                    )}
                  </Button>
                </div>
              )}

              {/* Compress PDF */}
              {activeTab === 'compress' && (
                <div className="space-y-4">
                  <CompressForm
                    params={compressParams}
                    onParamsChange={setCompressParams}
                    onSubmit={() => handleOperationSubmit('compress', compressParams)}
                    disabled={isPolling || !fileId}
                  />
                  <Button
                    onClick={() => handleOperationSubmit('compress', compressParams)}
                    disabled={!fileId || isPolling}
                    className="w-full"
                  >
                    {isPolling ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Compress PDF'
                    )}
                  </Button>
                </div>
              )}

              {/* Add Page Numbers */}
              {activeTab === 'page-numbers' && (
                <div className="space-y-4">
                  <PageNumbersForm
                    params={pageNumbersParams}
                    onParamsChange={setPageNumbersParams}
                    onSubmit={() => handleOperationSubmit('page-numbers', pageNumbersParams)}
                    disabled={isPolling || !fileId}
                  />
                  <Button
                    onClick={() => handleOperationSubmit('page-numbers', pageNumbersParams)}
                    disabled={!fileId || isPolling}
                    className="w-full"
                  >
                    {isPolling ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Add Page Numbers'
                    )}
                  </Button>
                </div>
              )}

              {/* Watermark */}
              {activeTab === 'watermark' && (
                <div className="space-y-4">
                  <WatermarkForm
                    params={watermarkParams}
                    onParamsChange={setWatermarkParams}
                    onSubmit={() => handleOperationSubmit('watermark', watermarkParams)}
                    disabled={isPolling || !fileId}
                  />
                  <Button
                    onClick={() => handleOperationSubmit('watermark', watermarkParams)}
                    disabled={!fileId || isPolling || !watermarkParams.watermark_content}
                    className="w-full"
                  >
                    {isPolling ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Add Watermark'
                    )}
                  </Button>
                </div>
              )}

              {/* Protect PDF */}
              {activeTab === 'protect' && (
                <div className="space-y-4">
                  <ProtectForm
                    params={protectParams}
                    onParamsChange={setProtectParams}
                    onSubmit={() => handleOperationSubmit('protect', protectParams)}
                    disabled={isPolling || !fileId}
                  />
                  <Button
                    onClick={() => handleOperationSubmit('protect', protectParams)}
                    disabled={!fileId || isPolling || !protectParams.password}
                    className="w-full"
                  >
                    {isPolling ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Protect PDF'
                    )}
                  </Button>
                </div>
              )}

              {/* Unlock PDF */}
              {activeTab === 'unlock' && (
                <div className="space-y-4">
                  <UnlockForm
                    params={unlockParams}
                    onParamsChange={setUnlockParams}
                    onSubmit={() => handleOperationSubmit('unlock', unlockParams)}
                    disabled={isPolling || !fileId}
                  />
                  <Button
                    onClick={() => handleOperationSubmit('unlock', unlockParams)}
                    disabled={!fileId || isPolling || !unlockParams.password}
                    className="w-full"
                  >
                    {isPolling ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Unlock PDF'
                    )}
                  </Button>
                </div>
              )}

              {/* Annotate PDF */}
              {activeTab === 'annotate' && (
                <div className="space-y-4">
                  <AnnotateForm
                    params={annotateParams}
                    onParamsChange={setAnnotateParams}
                    onSubmit={() => handleOperationSubmit('annotate', annotateParams)}
                    disabled={isPolling || !fileId}
                  />
                  <Button
                    onClick={() => handleOperationSubmit('annotate', annotateParams)}
                    disabled={!fileId || isPolling}
                    className="w-full"
                  >
                    {isPolling ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Annotate PDF'
                    )}
                  </Button>
                </div>
              )}

              {/* Merge PDFs */}
              {activeTab === 'merge' && (
                <div className="space-y-4">
                  <MergeForm
                    files={mergeFiles || []}
                    selectedFileIds={selectedMergeFileIds}
                    onSelectedFileIdsChange={setSelectedMergeFileIds}
                    params={mergeParams}
                    onParamsChange={setMergeParams}
                    onSubmit={() => handleOperationSubmit('merge', mergeParams)}
                    disabled={isPolling || mergeFiles.length < 2}
                  />
                  <Button
                    onClick={() => handleOperationSubmit('merge', mergeParams)}
                    disabled={selectedMergeFileIds.length < 2 || isPolling || mergeFiles.length < 2}
                    className="w-full"
                  >
                    {isPolling ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Merge PDFs'
                    )}
                  </Button>
                </div>
              )}

              {/* Split PDF */}
              {activeTab === 'split' && (
                <div className="space-y-4">
                  <SplitForm
                    params={splitParams}
                    onParamsChange={setSplitParams}
                    onSubmit={() => handleOperationSubmit('split', splitParams)}
                    disabled={isPolling || !fileId}
                  />
                  <Button
                    onClick={() => handleOperationSubmit('split', splitParams)}
                    disabled={!fileId || isPolling}
                    className="w-full"
                  >
                    {isPolling ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Split PDF'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
