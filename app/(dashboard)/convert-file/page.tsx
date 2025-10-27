"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Download, 
  FileText, 
  Image, 
  File, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  Info,
  FileUp,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { fileConversionApi, fileConversionApiHelpers } from '@/lib/file-conversion-api';
import { apiClient } from '@/lib/api-client';
import type { 
  FileUploadResponse, 
  ConversionResult, 
  ConversionCapabilities
} from '@/lib/file-conversion-api';

interface ProcessingState {
  isUploading: boolean;
  isConverting: boolean;
  isExtracting: boolean;
  uploadProgress: number;
  conversionProgress: number;
  extractionProgress: number;
}

interface Results {
  uploadResult?: FileUploadResponse;
  conversionResult?: ConversionResult;
  summarizationResult?: any;
}

export default function ConvertFilePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [enableSummarization, setEnableSummarization] = useState<boolean>(false);
  const [summarizationOptions, setSummarizationOptions] = useState({
    language: 'en',
    format: 'detailed',
    focus: 'summary',
    include_formatting: true,
    max_pages: 10
  });
  const [processing, setProcessing] = useState<ProcessingState>({
    isUploading: false,
    isConverting: false,
    isExtracting: false,
    uploadProgress: 0,
    conversionProgress: 0,
    extractionProgress: 0
  });
  const [results, setResults] = useState<Results>({});
  const [error, setError] = useState<string>('');
  const [capabilities, setCapabilities] = useState<{
    conversion?: ConversionCapabilities;
  }>({});
  const [capabilitiesLoading, setCapabilitiesLoading] = useState<boolean>(true);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load capabilities on component mount
  const loadCapabilities = useCallback(async () => {
    setCapabilitiesLoading(true);
    try {
      // Try to get capabilities from API, but fallback to hardcoded values
      const conversionCaps = await fileConversionApiHelpers.getSupportedFormats().catch(() => null);
      
      // Use API response if available, otherwise use fallback based on your backend support
      setCapabilities({ 
        conversion: conversionCaps || {
          success: true,
          data: {
            supported_formats: {
              input: ['html', 'htm', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'jpg', 'jpeg', 'png', 'bmp', 'gif', 'pdf'],
              output: ['pdf', 'jpg', 'jpeg', 'png']
            },
            conversion_options: {
              quality: ['low', 'medium', 'high'],
              page_range: '1-10',
              include_metadata: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to load capabilities:', error);
      // Set fallback capabilities based on your backend support
      setCapabilities({
        conversion: {
          success: true,
          data: {
            supported_formats: {
              input: ['html', 'htm', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'jpg', 'jpeg', 'png', 'bmp', 'gif', 'pdf'],
              output: ['pdf', 'jpg', 'jpeg', 'png']
            },
            conversion_options: {
              quality: ['low', 'medium', 'high'],
              page_range: '1-10',
              include_metadata: true
            }
          }
        }
      });
    } finally {
      setCapabilitiesLoading(false);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file);
    if (file) {
      setSelectedFile(file);
      setError('');
      console.log('Selected file set:', file.name);
      // Auto-detect target format based on file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && capabilities.conversion?.data?.supported_formats?.input?.includes(fileExtension)) {
        // Set a default target format
        if (fileExtension === 'docx' || fileExtension === 'doc') {
          setTargetFormat('pdf');
        } else if (fileExtension === 'pptx' || fileExtension === 'ppt') {
          setTargetFormat('pdf');
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          setTargetFormat('pdf');
        }
      }
    }
  }, [capabilities]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setError('');
      // Auto-detect target format based on file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && capabilities.conversion?.data?.supported_formats?.input?.includes(fileExtension)) {
        if (fileExtension === 'docx' || fileExtension === 'doc') {
          setTargetFormat('pdf');
        } else if (fileExtension === 'pptx' || fileExtension === 'ppt') {
          setTargetFormat('pdf');
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          setTargetFormat('pdf');
        }
      }
    }
  }, [capabilities]);

  // Handle file processing
  const handleProcessFile = useCallback(async () => {
    if (!selectedFile) return;

    setError('');
    setResults({});
    setProcessing({
      isUploading: true,
      isConverting: false,
      isExtracting: false,
      uploadProgress: 0,
      conversionProgress: 0,
      extractionProgress: 0
    });

    try {
      // Upload file
      setProcessing(prev => ({ ...prev, uploadProgress: 50 }));
      const uploadResult = await fileConversionApi.uploadFile(selectedFile);
      setResults(prev => ({ ...prev, uploadResult }));
      setProcessing(prev => ({ ...prev, uploadProgress: 100, isUploading: false }));

      const fileId = uploadResult.file_upload.id;

       // Convert file if target format is selected and not a loading/error state
       if (targetFormat && targetFormat !== 'loading' && targetFormat !== 'no-formats') {
         setProcessing(prev => ({ ...prev, isConverting: true, conversionProgress: 0 }));
         
         const convertResponse = await fileConversionApi.convertDocument({
           file_id: fileId.toString(),
           target_format: targetFormat,
           options: {
             quality: 'high',
             include_metadata: true
           }
         });

         // Poll for conversion completion
         const conversionResult = await fileConversionApi.pollJobCompletion(convertResponse.job_id);
         setResults(prev => ({ ...prev, conversionResult }));
         setProcessing(prev => ({ ...prev, isConverting: false, conversionProgress: 100 }));
       }

       // Summarize file if enabled
       if (enableSummarization) {
         setProcessing(prev => ({ ...prev, isExtracting: true, extractionProgress: 0 }));
         
         const summarizeResponse = await apiClient.post('/summarize/async/file', {
           file_id: fileId.toString(),
           options: summarizationOptions
         });

         // Poll for summarization completion
         const summarizationResult = await fileConversionApi.pollJobCompletion(summarizeResponse.job_id);
         setResults(prev => ({ ...prev, summarizationResult }));
         setProcessing(prev => ({ ...prev, isExtracting: false, extractionProgress: 100 }));
       }


    } catch (error) {
      console.error('Processing failed:', error);
      setError(error instanceof Error ? error.message : 'Processing failed');
      setProcessing({
        isUploading: false,
        isConverting: false,
        isExtracting: false,
        uploadProgress: 0,
        conversionProgress: 0,
        extractionProgress: 0
      });
    }
  }, [selectedFile, targetFormat, enableSummarization, summarizationOptions]);

  // Download converted file
  const handleDownloadConverted = useCallback(() => {
    if (results.conversionResult?.data?.converted_file?.url) {
      window.open(results.conversionResult.data.converted_file.url, '_blank');
    }
  }, [results.conversionResult]);


  // Load capabilities on mount
  React.useEffect(() => {
    loadCapabilities();
  }, [loadCapabilities]);

  // Clear target format when capabilities are loading
  React.useEffect(() => {
    if (capabilitiesLoading) {
      setTargetFormat('');
    }
  }, [capabilitiesLoading]);

  const isProcessing = processing.isUploading || processing.isConverting;
  const hasResults = results.uploadResult || results.conversionResult || results.summarizationResult;
  
  // Debug logging
  console.log('Selected file:', selectedFile);
  console.log('Target format:', targetFormat);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mb-6">
            <FileUp className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            File Processor
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Convert files between formats and extract AI-powered summaries from your documents. 
            Support for documents, images, and more.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Upload Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              {/* File Upload Area */}
              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
                    ${isDragOver 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' 
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-indigo-500 dark:hover:bg-slate-800/50'
                    }
                  `}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.html,.jpg,.jpeg,.png,.bmp,.gif"
                    className="hidden"
                  />
                  
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {isDragOver ? 'Drop your file here' : 'Drag & drop your file here'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        or click to browse files
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">PDF</Badge>
                        <Badge variant="outline">DOC</Badge>
                        <Badge variant="outline">PPT</Badge>
                        <Badge variant="outline">XLS</Badge>
                        <Badge variant="outline">JPG</Badge>
                        <Badge variant="outline">PNG</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-green-400 bg-green-50 dark:bg-green-950/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                          File Ready!
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <File className="h-4 w-4" />
                          <span className="font-medium">{selectedFile.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setTargetFormat('');
                        setEnableSummarization(false);
                        setResults({});
                        setError('');
                      }}
                    >
                      Change File
                    </Button>
                  </div>
                </div>
              )}

              {/* Conversion Options */}
              {(selectedFile || true) && (
                <div className="mt-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold">Conversion Settings</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="target-format" className="text-sm font-medium">
                        Convert to format
                      </Label>
                      <Select value={targetFormat} onValueChange={setTargetFormat}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Choose output format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              PDF Document
                            </div>
                          </SelectItem>
                          <SelectItem value="jpg">
                            <div className="flex items-center gap-2">
                              <Image className="h-4 w-4" />
                              JPG Image
                            </div>
                          </SelectItem>
                          <SelectItem value="jpeg">
                            <div className="flex items-center gap-2">
                              <Image className="h-4 w-4" />
                              JPEG Image
                            </div>
                          </SelectItem>
                          <SelectItem value="png">
                            <div className="flex items-center gap-2">
                              <Image className="h-4 w-4" />
                              PNG Image
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Quick Actions</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setTargetFormat('pdf')}
                          className={targetFormat === 'pdf' ? 'bg-indigo-50 border-indigo-200' : ''}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setTargetFormat('jpg')}
                          className={targetFormat === 'jpg' ? 'bg-indigo-50 border-indigo-200' : ''}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          JPG
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setTargetFormat('png')}
                          className={targetFormat === 'png' ? 'bg-indigo-50 border-indigo-200' : ''}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          PNG
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Summarization Options */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold">AI Summarization</h3>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="enable-summarization"
                        checked={enableSummarization}
                        onChange={(e) => setEnableSummarization(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="enable-summarization" className="text-sm font-medium">
                        Enable AI summarization
                      </Label>
                    </div>

                    {enableSummarization && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Language</Label>
                          <Select 
                            value={summarizationOptions.language} 
                            onValueChange={(value) => setSummarizationOptions(prev => ({ ...prev, language: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Format</Label>
                          <Select 
                            value={summarizationOptions.format} 
                            onValueChange={(value) => setSummarizationOptions(prev => ({ ...prev, format: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="detailed">Detailed</SelectItem>
                              <SelectItem value="brief">Brief</SelectItem>
                              <SelectItem value="bullet">Bullet Points</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Focus</Label>
                          <Select 
                            value={summarizationOptions.focus} 
                            onValueChange={(value) => setSummarizationOptions(prev => ({ ...prev, focus: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="summary">Summary</SelectItem>
                              <SelectItem value="key_points">Key Points</SelectItem>
                              <SelectItem value="insights">Insights</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Max Pages</Label>
                          <Input
                            type="number"
                            value={summarizationOptions.max_pages}
                            onChange={(e) => setSummarizationOptions(prev => ({ ...prev, max_pages: Number(e.target.value) }))}
                            min="1"
                            max="100"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleProcessFile} 
                    disabled={!selectedFile || isProcessing || (!targetFormat && !enableSummarization)}
                    className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        {targetFormat && enableSummarization ? 'Convert & Summarize' : 
                         targetFormat ? 'Convert File' : 
                         enableSummarization ? 'Summarize File' : 'Process File'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {processing.isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading file...</span>
                  <span>{processing.uploadProgress}%</span>
                </div>
                <Progress value={processing.uploadProgress} />
              </div>
            )}

            {processing.isConverting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Converting file...</span>
                  <span>{processing.conversionProgress}%</span>
                </div>
                <Progress value={processing.conversionProgress} />
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="mt-2 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

          {/* Results */}
          {hasResults && (
            <div className="space-y-6">
              {/* Upload Result */}
              {results.uploadResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      File Uploaded
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">File Name</Label>
                        <p className="text-sm text-muted-foreground">
                          {results.uploadResult.file_upload?.original_name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">File Size</Label>
                        <p className="text-sm text-muted-foreground">
                          {results.uploadResult.file_upload?.file_size 
                            ? `${(results.uploadResult.file_upload.file_size / 1024 / 1024).toFixed(2)} MB`
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">File Type</Label>
                        <p className="text-sm text-muted-foreground">
                          {results.uploadResult.file_upload?.file_type?.toUpperCase() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Upload Time</Label>
                        <p className="text-sm text-muted-foreground">
                          {results.uploadResult.file_upload?.created_at 
                            ? new Date(results.uploadResult.file_upload.created_at).toLocaleString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conversion Result */}
              {results.conversionResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Conversion Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Converted File</Label>
                        <p className="text-sm text-muted-foreground">
                          {results.conversionResult.data?.converted_file?.filename || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Original File Size</Label>
                        <p className="text-sm text-muted-foreground">
                          {results.conversionResult.data?.original_file?.size 
                            ? `${(results.conversionResult.data.original_file.size / 1024 / 1024).toFixed(2)} MB`
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Job Status</Label>
                        <p className="text-sm text-muted-foreground">
                          {results.conversionResult.data?.conversion_result?.status?.toUpperCase() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Processing Time</Label>
                        <p className="text-sm text-muted-foreground">
                          {results.conversionResult.data?.conversion_result?.completed_at && results.conversionResult.data?.conversion_result?.started_at
                            ? `${((results.conversionResult.data.conversion_result.completed_at - results.conversionResult.data.conversion_result.started_at) * 1000).toFixed(0)}ms`
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleDownloadConverted} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Converted File
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Summarization Result */}
              {results.summarizationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      AI Summary Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {results.summarizationResult.result && (
                      <div className="space-y-4">
                        {results.summarizationResult.result.summary && (
                          <div>
                            <Label className="text-sm font-medium">Summary</Label>
                            <div className="mt-2 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                {results.summarizationResult.result.summary}
                              </p>
                            </div>
                          </div>
                        )}

                        {results.summarizationResult.result.key_points && results.summarizationResult.result.key_points.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Key Points</Label>
                            <ul className="mt-2 space-y-1">
                              {results.summarizationResult.result.key_points.map((point: string, index: number) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-purple-500 mt-1">•</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {results.summarizationResult.result.insights && results.summarizationResult.result.insights.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Insights</Label>
                            <ul className="mt-2 space-y-1">
                              {results.summarizationResult.result.insights.map((insight: string, index: number) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-purple-500 mt-1">💡</span>
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {results.summarizationResult.result.metadata && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                              <Label className="text-sm font-medium">Original Length</Label>
                              <p className="text-sm text-muted-foreground">
                                {results.summarizationResult.result.metadata.original_length || 'N/A'} characters
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Summary Length</Label>
                              <p className="text-sm text-muted-foreground">
                                {results.summarizationResult.result.metadata.summary_length || 'N/A'} characters
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Compression Ratio</Label>
                              <p className="text-sm text-muted-foreground">
                                {results.summarizationResult.result.metadata.compression_ratio 
                                  ? `${(results.summarizationResult.result.metadata.compression_ratio * 100).toFixed(1)}%`
                                  : 'N/A'
                                }
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Confidence Score</Label>
                              <p className="text-sm text-muted-foreground">
                                {results.summarizationResult.result.metadata.confidence_score 
                                  ? `${(results.summarizationResult.result.metadata.confidence_score * 100).toFixed(1)}%`
                                  : 'N/A'
                                }
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

      {/* Capabilities Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Supported Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium">File Conversion</Label>
              <div className="mt-2 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Input Formats</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['HTML', 'HTM', 'DOCX', 'DOC', 'PPTX', 'PPT', 'XLSX', 'XLS', 'TXT', 'JPG', 'JPEG', 'PNG', 'BMP', 'GIF', 'PDF'].map((format) => (
                      <Badge key={format} variant="outline" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Output Formats</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['PDF', 'JPG', 'JPEG', 'PNG'].map((format) => (
                      <Badge key={format} variant="outline" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">AI Summarization</Label>
              <div className="mt-2 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Supported Documents</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['PDF', 'DOCX', 'DOC', 'TXT', 'HTML', 'PPTX', 'PPT'].map((format) => (
                      <Badge key={format} variant="outline" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Features</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['Summary', 'Key Points', 'Insights', 'Metadata'].map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
