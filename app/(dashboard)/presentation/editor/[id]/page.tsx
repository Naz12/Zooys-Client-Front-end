"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PowerPointEditor from '@/components/presentation/PowerPointEditor';
import { presentationApi } from '@/lib/presentation-api-client';
import { PresentationOutline } from '@/lib/presentation-workflow-context';
import { useNotifications } from '@/lib/notifications';

export default function PresentationEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { showError, showSuccess } = useNotifications();
  const [outline, setOutline] = useState<PresentationOutline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileId, setFileId] = useState<number | null>(null);
  const [fileMetadata, setFileMetadata] = useState<{
    template?: string;
    color_scheme?: string;
    font_style?: string;
  } | null>(null);

  const fileIdParam = params.id as string;

  useEffect(() => {
    const fetchPresentationFile = async () => {
      try {
        setLoading(true);
        const id = parseInt(fileIdParam);
        
        if (isNaN(id)) {
          throw new Error('Invalid file ID');
        }
        
        setFileId(id);
        console.log('Loading presentation file content with ID:', id);
        
        // Use the new content endpoint to get editable content
        try {
          const response = await presentationApi.getPresentationFileContent(id);
          console.log('File content response:', response);
          
          // The backend returns content directly in the response:
          // { success: true, content: { title, slides: [...] }, file_id, title, template, ... }
          // OR wrapped in response.data: { success: true, data: { content: {...}, file_id, ... } }
          const responseData = (response as any).data || response;
            
          // Check if response is successful and has content
          if (response.success === true && responseData.content) {
            // The backend returns content in this format:
            // {
            //   content: { title, slides: [{ slide_number, header, subheaders, slide_type, content }] },
            //   file_id, title, template, color_scheme, font_style
            // }
            const backendContent = responseData.content;
            
            if (!backendContent || !backendContent.slides) {
              throw new Error('Content data not available for this file');
            }
            
            // Store file metadata (template, color_scheme, font_style) for re-export
            setFileMetadata({
              template: responseData.template || 'corporate_blue',
              color_scheme: responseData.color_scheme || 'blue',
              font_style: responseData.font_style || 'modern'
            });
            
            // Convert backend format to PresentationOutline format
            const apiOutline: PresentationOutline = {
              title: backendContent.title || responseData.title || `Presentation ${id}`,
              slide_count: backendContent.slides.length,
              estimated_duration: "10-15 minutes",
              slides: backendContent.slides.map((slide: any, index: number) => {
                // Backend format: { slide_number, header, subheaders, slide_type, content }
                // Frontend format: { title, content, slide_type, order }
                return {
                  title: slide.header || `Slide ${slide.slide_number || index + 1}`,
                content: slide.content || slide.subheaders?.join('\n') || '',
                  slide_type: slide.slide_type || 'content',
                  order: slide.slide_number || index + 1
                };
              })
            };
            
            console.log('Converted outline:', apiOutline);
            setOutline(apiOutline);
          } else {
            // Only throw error if response is not successful
            if (response.success !== true) {
              throw new Error((response as any).error || 'Failed to load presentation content');
            } else {
              throw new Error('Content field is missing in the response');
            }
          }
        } catch (apiError: any) {
          console.error('Error fetching presentation content:', apiError);
          console.error('Error details:', {
            message: apiError?.message,
            status: apiError?.status,
            response: apiError?.response,
            userMessage: apiError?.userMessage,
            rawResponse: apiError?.rawResponse
          });
          
          // Extract error message from various possible locations
          let errorMessage = 'Failed to load presentation content';
          
          if (apiError?.userMessage) {
            errorMessage = apiError.userMessage;
          } else if (apiError?.response?.error) {
            errorMessage = apiError.response.error;
          } else if (apiError?.response?.data?.error) {
            errorMessage = apiError.response.data.error;
          } else if (apiError?.response?.data?.message) {
            errorMessage = apiError.response.data.message;
          } else if (apiError?.message) {
            errorMessage = apiError.message;
          }
          
          // Check if it's a "content not available" error (for older files)
          const lowerErrorMessage = errorMessage.toLowerCase();
          if (lowerErrorMessage.includes('not available') || 
              lowerErrorMessage.includes('not found') || 
              apiError?.status === 404) {
            setError('Content data not available for this file. This file may have been created before the edit feature was added. You can still create a new presentation.');
            
            // Create a basic outline so user can still work
            const fallbackOutline: PresentationOutline = {
              title: `Presentation ${id}`,
              slide_count: 1,
              estimated_duration: "10-15 minutes",
              slides: [{
                title: `Presentation ${id}`,
                content: 'Content data not available. Please create a new presentation to edit.',
                slide_type: 'title',
                order: 1
              }]
            };
            setOutline(fallbackOutline);
          } else {
            setError(errorMessage);
            showError(errorMessage);
          }
        }
      } catch (error: any) {
        console.error('Error fetching presentation file:', error);
        const errorMessage = error?.message || 'Failed to load presentation file';
        setError(errorMessage);
        showError(errorMessage + '. You can still create a new presentation.');
        
        // Create a basic outline so user can still edit
        const fallbackOutline: PresentationOutline = {
          title: `Presentation ${fileIdParam}`,
          slide_count: 1,
          estimated_duration: "10-15 minutes",
          slides: [{
            title: `Presentation ${fileIdParam}`,
            content: 'Start editing your presentation',
            slide_type: 'title',
            order: 1
          }]
          };
        setOutline(fallbackOutline);
      } finally {
        setLoading(false);
      }
    };

    if (fileIdParam) {
      fetchPresentationFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileIdParam]); // Only depend on fileIdParam to prevent multiple calls

  const handleSave = async (editedContent: any) => {
    if (!fileId || !outline) {
      showError('File ID or content not available');
      return;
    }
    
    try {
      // Convert editor content to backend format
      // Backend expects: { title, slides: [{ slide_number, header, subheaders, slide_type, content }] }
      const contentToExport = editedContent ? {
        title: editedContent.title,
        slides: editedContent.slides.map((slide: any, index: number) => ({
          slide_number: slide.order || index + 1,
          header: slide.title,
          subheaders: slide.content ? slide.content.split('\n').filter((s: string) => s.trim()) : [],
          slide_type: slide.slide_type || 'content',
          content: slide.content || ''
        }))
      } : {
        title: outline.title,
        slides: outline.slides.map((slide, index) => ({
          slide_number: slide.order || index + 1,
          header: slide.title,
          subheaders: slide.content ? slide.content.split('\n').filter((s: string) => s.trim()) : [],
          slide_type: slide.slide_type || 'content',
          content: slide.content || ''
        }))
      };

      // Call export endpoint with edited content
      // Use stored template metadata if available, otherwise use defaults
      const exportResponse = await presentationApi.exportPresentation({
        content: contentToExport,
        template: fileMetadata?.template || 'corporate_blue',
        color_scheme: fileMetadata?.color_scheme || 'blue',
        font_style: fileMetadata?.font_style || 'modern'
      });

      if (!exportResponse.success || !exportResponse.job_id) {
        throw new Error('Failed to start export');
      }

      showSuccess('Export started! Generating updated presentation...');

      // Poll for job completion
      const pollJobStatus = async (jobId: string, maxAttempts = 60, interval = 2500) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            const statusResponse = await presentationApi.getJobStatus(jobId);
            
            if (!statusResponse.success) {
              throw new Error(statusResponse.error || 'Failed to get job status');
            }

            if (statusResponse.status === 'completed') {
              const resultResponse = await presentationApi.getJobResult(jobId);
              if (resultResponse.success && resultResponse.result) {
                return { success: true, result: resultResponse.result };
              } else {
                throw new Error(resultResponse.error || 'Failed to get job result');
              }
            } else if (statusResponse.status === 'failed') {
              throw new Error(statusResponse.error || 'Export failed');
            }

            await new Promise(resolve => setTimeout(resolve, interval));
          } catch (error) {
            if (attempt === maxAttempts - 1) {
              throw error;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
          }
        }
        throw new Error('Export timeout');
      };

      const pollResult = await pollJobStatus(exportResponse.job_id);

      if (pollResult.success && pollResult.result) {
        const newFile = pollResult.result;
        showSuccess(`Presentation saved successfully! New file ID: ${newFile.file_id}`);
        
        // Optionally redirect to the new file or refresh
        // router.push(`/presentation/editor/${newFile.file_id}`);
      } else {
        throw new Error('Export completed but result is incomplete');
      }
    } catch (error) {
      console.error('Error saving presentation:', error);
      showError(error instanceof Error ? error.message : 'Failed to save presentation');
    }
  };

  const handleDownload = () => {
    console.log('Downloading presentation');
    // This will be handled by the PowerPointEditor component
  };

  const handleBack = () => {
    router.push('/presentation');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading Presentation Editor</h3>
            <p className="text-muted-foreground">Please wait while we load your presentation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !outline) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Presentation</h3>
            <p className="text-muted-foreground mb-4">
              {error || 'Unable to load presentation data'}
            </p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Presentations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Minimal Header with Back Link */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <Button
          onClick={handleBack}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Presentations</span>
        </Button>
        {outline && (
          <div className="text-sm text-muted-foreground truncate max-w-md">
            Editing: {outline.title}
          </div>
        )}
      </div>

      {/* Editor - Takes full remaining space */}
      <div className="flex-1 overflow-hidden">
        {outline && fileId && (
          <PowerPointEditor
            fileId={fileId}
            initialOutline={outline}
            onSave={handleSave}
            onDownload={handleDownload}
          />
        )}
      </div>
    </div>
  );
}
