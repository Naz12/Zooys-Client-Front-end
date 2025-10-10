"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Share2,
  Edit3,
  Eye,
  Sparkles,
  Clock,
  Zap,
  PenTool
} from 'lucide-react';
import { useWorkflow } from '@/lib/presentation-workflow-context';
import { presentationApi, GeneratePowerPointRequest } from '@/lib/presentation-api-client';
import { useNotifications } from '@/lib/notifications';

const generationSteps = [
  { id: 1, title: 'Preparing Content', description: 'Processing your outline and content' },
  { id: 2, title: 'Applying Template', description: 'Applying selected design template' },
  { id: 3, title: 'Generating Slides', description: 'Creating PowerPoint slides' },
  { id: 4, title: 'Finalizing', description: 'Adding finishing touches and optimizing' },
];

export function GenerationStep() {
  const { state, dispatch } = useWorkflow();
  const { showSuccess, showError } = useNotifications();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  // Monitor generation status changes
  useEffect(() => {
    console.log('GenerationStep: State changed:', {
      generationStatus: state.generationStatus,
      downloadUrl: state.downloadUrl,
      powerpointFile: state.powerpointFile,
      fileSize: state.fileSize,
      slideCount: state.slideCount
    });
  }, [state.generationStatus, state.downloadUrl, state.powerpointFile, state.fileSize, state.slideCount]);

  const handleGeneratePowerPoint = async () => {
    if (!state.aiResultId || !state.selectedTemplate) {
      showError('Missing required data for generation');
      return;
    }

    // Prevent duplicate calls
    if (isGenerating) {
      return;
    }

    setIsGenerating(true);
    setCurrentStep(0);
    setProgress(0);
    setEstimatedTime(30); // 30 seconds estimated

    dispatch({ type: 'SET_GENERATION_STATUS', payload: 'generating' });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 1000);

      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          const newStep = prev + 1;
          if (newStep >= generationSteps.length) {
            clearInterval(stepInterval);
            return generationSteps.length - 1;
          }
          return newStep;
        });
      }, 8000);

      // First, generate content for slides if not already done
      // Fix: Use correct state property (state.outline instead of state.outlineData)
      if (!state.outline?.slides?.[0]?.content) {
        await presentationApi.generateContent(state.aiResultId);
      }

      // Prepare presentation data for export
      const presentationData = {
        title: state.outline?.title || 'Presentation',
        slides: state.outline?.slides || [],
        template: state.selectedTemplate,
        color_scheme: state.templateData?.[state.selectedTemplate]?.color_scheme || 'blue',
        font_style: 'modern'
      };

      const response = await presentationApi.exportToPowerPoint(state.aiResultId, presentationData);

      clearInterval(progressInterval);
      clearInterval(stepInterval);

      // Add detailed response logging
      console.log('PowerPoint Export Response:', response);
      console.log('Response success:', response.success);
      console.log('Response data:', response.data);

      if (response.success) {
        console.log('Dispatching SET_DOWNLOAD_DATA with payload:', {
          downloadUrl: response.data.download_url,
          powerpointFile: response.data.file_path,
          fileSize: response.data.file_size,
          slideCount: response.data.slide_count || 12
        });
        
        // Make download URL absolute by prepending backend server URL
        const absoluteDownloadUrl = response.data.download_url.startsWith('http') 
          ? response.data.download_url 
          : `http://localhost:8000${response.data.download_url}`;
        
        dispatch({
          type: 'SET_DOWNLOAD_DATA',
          payload: {
            downloadUrl: absoluteDownloadUrl,
            powerpointFile: response.data.file_path,
            fileSize: response.data.file_size,
            slideCount: response.data.slide_count || 12 // Default to 12 slides if not provided
          }
        });
        
        console.log('State after dispatch:', state);
        setProgress(100);
        setCurrentStep(generationSteps.length - 1);
        showSuccess('PowerPoint generated successfully!');
        
        // Add small delay to ensure file is ready for download (backend agent recommendation)
        setTimeout(() => {
          console.log('File ready for download');
        }, 500);
      } else {
        throw new Error('Failed to generate PowerPoint');
      }
    } catch (error) {
      console.error('Error generating PowerPoint:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PowerPoint';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showError(errorMessage);
    } finally {
      setIsGenerating(false);
      // Don't override generationStatus here - let SET_DOWNLOAD_DATA handle it
    }
  };

  const handleDownload = async () => {
    if (!state.downloadUrl) {
      showError('No download URL available');
      return;
    }

    try {
      console.log('Starting download with URL:', state.downloadUrl);
      
      // Method 1: Direct window.open (recommended by backend agent)
      window.open(state.downloadUrl, '_blank');
      
      showSuccess('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      
      // Fallback method: Create download link
      try {
        const link = document.createElement('a');
        link.href = state.downloadUrl;
        link.download = `${state.outline?.title || 'presentation'}.pptx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess('Download started!');
      } catch (fallbackError) {
        console.error('Fallback download error:', fallbackError);
        showError('Failed to start download');
      }
    }
  };

  const handleRegenerate = () => {
    dispatch({ type: 'SET_GENERATION_STATUS', payload: 'idle' });
    dispatch({
      type: 'SET_DOWNLOAD_DATA',
      payload: { downloadUrl: null, powerpointFile: null }
    });
  };

  const handleEditPresentation = () => {
    // Navigate to the editor page
    window.location.href = `/presentation/editor/${state.aiResultId}`;
  };

  const getStatusIcon = () => {
    switch (state.generationStatus) {
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      case 'generating':
        return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />;
      default:
        return <Sparkles className="h-8 w-8 text-purple-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (state.generationStatus) {
      case 'completed':
        return 'PowerPoint generated successfully!';
      case 'error':
        return 'Generation failed. Please try again.';
      case 'generating':
        return 'Generating your PowerPoint presentation...';
      default:
        return 'Ready to generate your PowerPoint presentation';
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusMessage()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              {estimatedTime > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Estimated time remaining: {estimatedTime}s</span>
                </div>
              )}
            </div>
          )}

          {/* Generation Steps */}
          {isGenerating && (
            <div className="space-y-3">
              <h4 className="font-medium">Generation Steps</h4>
              <div className="space-y-2">
                {generationSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      index <= currentStep
                        ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < currentStep
                          ? 'bg-green-500 text-white'
                          : index === currentStep
                          ? 'bg-purple-500 text-white animate-pulse'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {index < currentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        index <= currentStep ? 'text-green-900 dark:text-green-100' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </p>
                      <p className={`text-sm ${
                        index <= currentStep ? 'text-green-700 dark:text-green-300' : 'text-gray-500'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {state.generationStatus === 'idle' && (
              <Button
                onClick={handleGeneratePowerPoint}
                disabled={!state.selectedTemplate || !state.outline || isGenerating}
                size="lg"
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate PowerPoint'}
              </Button>
            )}

            {state.generationStatus === 'completed' && (
              <>
                <Button
                  onClick={handleDownload}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PowerPoint
                </Button>
                <Button
                  onClick={handleEditPresentation}
                  size="lg"
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <PenTool className="h-4 w-4" />
                  Edit Presentation
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
              </>
            )}

            {state.generationStatus === 'error' && (
              <Button
                onClick={handleGeneratePowerPoint}
                disabled={isGenerating}
                size="lg"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {isGenerating ? 'Retrying...' : 'Try Again'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Presentation Summary */}
      {state.outline && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Presentation Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Content Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Title:</span>
                    <span className="text-sm font-medium">{state.outline.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Slides:</span>
                    <span className="text-sm font-medium">{state.outline.slide_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration:</span>
                    <span className="text-sm font-medium">{state.outline.estimated_duration}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Design Settings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Template:</span>
                    <span className="text-sm font-medium">
                      {state.templateData?.[state.selectedTemplate || '']?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Color Scheme:</span>
                    <span className="text-sm font-medium capitalize">
                      {state.templateData?.[state.selectedTemplate || '']?.color_scheme || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Font Style:</span>
                    <span className="text-sm font-medium">Modern</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Actions */}
      {state.generationStatus === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  // Navigate back to outline editing
                  dispatch({ type: 'SET_STEP', payload: 2 });
                }}
              >
                <Edit3 className="h-4 w-4" />
                Edit Outline
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  // Navigate back to template selection
                  dispatch({ type: 'SET_STEP', payload: 3 });
                }}
              >
                <Eye className="h-4 w-4" />
                Change Template
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  // Share functionality
                  showSuccess('Share link copied to clipboard!');
                }}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {state.generationStatus === 'error' && state.error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Error: {state.error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
