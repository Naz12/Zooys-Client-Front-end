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
import { converterApi } from '@/lib/api';
import type { 
  FileUploadResponse, 
  ConversionResult, 
  ExtractionResult,
  ConversionCapabilities
} from '@/lib/file-conversion-api';
import {
  InputFileType,
  OutputFileType,
  getFileExtension,
  getAvailableOutputFormats,
  isConversionSupported,
  isSameFormatConversion,
  getFormatDisplayName,
  VALIDATION_RULES
} from '@/lib/types/conversion-types';

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
  extractionResult?: ExtractionResult;
}

export default function ConvertFilePage() {
  // Step management: 'upload' or 'result'
  const [currentStep, setCurrentStep] = useState<'upload' | 'result'>('upload');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<OutputFileType | ''>('');
  const [inputFormat, setInputFormat] = useState<InputFileType | null>(null);
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
      
      // Detect input format using the new helper
      const detectedFormat = getFileExtension(file.name);
      setInputFormat(detectedFormat);
      
      // Get available output formats for this input
      const availableFormats = getAvailableOutputFormats(detectedFormat);
      
      // Set a default target format (prefer PDF, then first available)
      if (availableFormats.length > 0) {
        const defaultFormat = availableFormats.includes('pdf') 
          ? 'pdf' 
          : availableFormats[0];
        setTargetFormat(defaultFormat);
      } else {
        setTargetFormat('');
      }
    }
  }, []);

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
      
      // Detect input format using the new helper
      const detectedFormat = getFileExtension(file.name);
      setInputFormat(detectedFormat);
      
      // Get available output formats for this input
      const availableFormats = getAvailableOutputFormats(detectedFormat);
      
      // Set a default target format (prefer PDF, then first available)
      if (availableFormats.length > 0) {
        const defaultFormat = availableFormats.includes('pdf') 
          ? 'pdf' 
          : availableFormats[0];
        setTargetFormat(defaultFormat);
      } else {
        setTargetFormat('');
      }
    }
  }, []);

  // Handle file processing
  const handleProcessFile = useCallback(async () => {
    if (!selectedFile || !targetFormat) return;

    // Validate conversion before processing
    const validation = VALIDATION_RULES.validateConversion(inputFormat, targetFormat as OutputFileType);
    if (!validation.valid) {
      setError(validation.error || 'Invalid conversion');
      return;
    }

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

      // Validate file ID
      if (!fileId || isNaN(Number(fileId))) {
        throw new Error('Invalid file ID received from upload. Please try again.');
      }

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

         // Poll for conversion completion with progress tracking
         const pollConversion = async () => {
           let attempts = 0;
           const maxAttempts = 120; // Increased to 4 minutes (120 * 2 seconds)
           let pendingStartTime = Date.now();
           const pendingTimeout = 30000; // 30 seconds timeout for pending status
           let lastStatus = 'pending';
           
           while (attempts < maxAttempts) {
             try {
             const status = await fileConversionApi.getConversionStatus(convertResponse.job_id);
               
               // Track status changes
               if (status.status !== lastStatus) {
                 lastStatus = status.status;
                 pendingStartTime = Date.now(); // Reset timer when status changes
               }
               
               // Check if stuck in pending for too long
               if (status.status === 'pending' && (Date.now() - pendingStartTime) > pendingTimeout) {
                 throw new Error('Conversion job is stuck in pending status. The backend may be processing other jobs. Please try again in a moment.');
               }
               
               // Update progress
               setProcessing(prev => ({ 
                 ...prev, 
                 conversionProgress: status.progress || 0
               }));
               
               // Log stage for debugging
               if (process.env.NODE_ENV === 'development') {
                 console.log('📊 Conversion status:', {
                   job_id: convertResponse.job_id,
                   status: status.status,
                   progress: status.progress,
                   stage: status.stage,
                   attempt: attempts + 1,
                   timeInPending: status.status === 'pending' ? Date.now() - pendingStartTime : 0,
                 });
               }
               
               // Check status
               if (status.status === 'completed') {
                 const conversionResult = await fileConversionApi.getConversionResult(convertResponse.job_id);
                 
                 // Debug logging
                 if (process.env.NODE_ENV === 'development') {
                   const data = conversionResult.data;
                   const dataKeys = data ? Object.keys(data) : [];
                   console.log('✅ Conversion result received:', {
                     fullResult: conversionResult,
                     fullResultStringified: JSON.stringify(conversionResult, null, 2),
                     resultKeys: conversionResult ? Object.keys(conversionResult) : [],
                     hasData: !!data,
                     dataKeys: dataKeys,
                     // Show each key and its value
                     dataStructure: dataKeys.reduce((acc, key) => {
                       acc[`data.${key}`] = data?.[key];
                       return acc;
                     }, {} as Record<string, any>),
                     originalFormat: data?.original_format,
                     targetFormat: data?.target_format,
                     fileSize: data?.file_size,
                     fileUrl: data?.file_url,
                     filePath: data?.file_path,
                     // Check for nested file object
                     hasFileObject: !!(data as any)?.file,
                     fileObjectKeys: (data as any)?.file ? Object.keys((data as any).file) : [],
                     fileObjectContent: (data as any)?.file,
                     // Check for alternative structures
                     hasFileUrlAtRoot: !!(conversionResult as any)?.file_url,
                     hasFilePathAtRoot: !!(conversionResult as any)?.file_path,
                     hasConvertedFile: !!(conversionResult as any)?.converted_file,
                   });
                 }
                 
                 setResults(prev => ({ ...prev, conversionResult }));
                 setProcessing(prev => ({ ...prev, isConverting: false, conversionProgress: 100 }));
                 // Move to result step
                 setCurrentStep('result');
               return;
               } else if (status.status === 'failed') {
                 // Get error message from status response
                 let errorMessage = 'Conversion failed';
                 
                 // Handle different error formats
                 if (status.error) {
                   if (typeof status.error === 'string') {
                     errorMessage = status.error;
                   } else if (typeof status.error === 'object') {
                     // Try to extract message from error object
                     errorMessage = (status.error as any)?.message || 
                                   (status.error as any)?.error || 
                                   JSON.stringify(status.error) || 
                                   'Conversion failed';
                   }
                 }
                 
                 console.error('❌ Conversion failed:', {
                   job_id: convertResponse.job_id,
                   status: status.status,
                   error: status.error,
                   errorType: typeof status.error,
                   errorStringified: JSON.stringify(status.error),
                   stage: status.stage,
                   fullStatus: status,
                 });
                 
                 throw new Error(errorMessage);
               }
               
               // Continue polling for pending/running status
               // Use shorter interval for pending, longer for running
               const pollInterval = status.status === 'pending' ? 2000 : 3000;
               await new Promise(resolve => setTimeout(resolve, pollInterval));
               attempts++;
             } catch (error) {
               // If it's a failed status error or pending timeout, re-throw it
               if (error instanceof Error && (
                 error.message.includes('Conversion failed') || 
                 error.message.includes('stuck in pending')
               )) {
                 throw error;
               }
               // For other errors, log and continue polling (might be temporary network issue)
               console.warn('⚠️ Error polling conversion status:', error);
             await new Promise(resolve => setTimeout(resolve, 2000));
             attempts++;
           }
           }
           throw new Error('Conversion timeout - the conversion is taking longer than expected (over 4 minutes). Please try again or contact support if the issue persists.');
         };
         
         await pollConversion();
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
  }, [selectedFile, targetFormat]);



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

  const isProcessing = processing.isUploading || processing.isConverting || processing.isExtracting;
  const hasResults = results.uploadResult || results.conversionResult || results.extractionResult;
  
  // Function to reset and go back to step 1
  const handleReset = useCallback(() => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setTargetFormat('');
    setInputFormat(null);
    setResults({});
    setError('');
    setProcessing({
      isUploading: false,
      isConverting: false,
      isExtracting: false,
      uploadProgress: 0,
      conversionProgress: 0,
      extractionProgress: 0
    });
  }, []);
  
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
            File Converter
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Convert files between different formats. Choose your file, select target format, and download the result.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: Upload and Convert */}
          {currentStep === 'upload' && (
          <Card className="border-0 shadow-xl bg-slate-800/50 dark:bg-slate-800/50 backdrop-blur-sm">
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
                      ? 'border-indigo-500 bg-indigo-950/30 dark:bg-indigo-950/30' 
                      : 'border-slate-600 hover:border-indigo-500 hover:bg-slate-700/30 dark:border-slate-600 dark:hover:border-indigo-500 dark:hover:bg-slate-700/30'
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
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="h-8 w-8 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-slate-100">
                        {isDragOver ? 'Drop your file here' : 'Drag & drop your file here'}
                      </h3>
                      <p className="text-slate-400 mb-4">
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
                <div className="border-2 border-green-500/50 bg-green-950/30 dark:bg-green-950/30 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-400">
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
              {selectedFile && (
                <div className="mt-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-slate-100">Conversion Settings</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="target-format" className="text-sm font-medium">
                        Convert to format
                      </Label>
                      <Select 
                        value={targetFormat} 
                        onValueChange={(value) => setTargetFormat(value as OutputFileType)}
                        disabled={!inputFormat}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={inputFormat ? "Choose output format" : "Select a file first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const availableFormats = getAvailableOutputFormats(inputFormat);
                            if (availableFormats.length === 0) {
                              return (
                                <SelectItem value="" disabled>
                                  No valid conversions available
                          </SelectItem>
                              );
                            }
                            return availableFormats.map((format) => (
                              <SelectItem key={format} value={format}>
                            <div className="flex items-center gap-2">
                                  {['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(format) ? (
                              <Image className="h-4 w-4" />
                                  ) : (
                                    <FileText className="h-4 w-4" />
                                  )}
                                  {getFormatDisplayName(format)}
                            </div>
                          </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Quick Actions</Label>
                      <div className="flex gap-2 flex-wrap">
                        {(() => {
                          const availableFormats = getAvailableOutputFormats(inputFormat);
                          const commonFormats: OutputFileType[] = ['pdf', 'jpg', 'png', 'docx', 'html'];
                          const quickFormats = commonFormats.filter(f => availableFormats.includes(f));
                          
                          return quickFormats.map((format) => (
                        <Button 
                              key={format}
                          variant="outline" 
                          size="sm"
                              onClick={() => setTargetFormat(format)}
                              className={targetFormat === format ? 'bg-indigo-950/50 border-indigo-500' : 'border-slate-600'}
                              disabled={!availableFormats.includes(format)}
                        >
                              {['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(format) ? (
                                <Image className="h-4 w-4 mr-1" />
                              ) : (
                          <FileText className="h-4 w-4 mr-1" />
                              )}
                              {format.toUpperCase()}
                        </Button>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleProcessFile} 
                    disabled={!selectedFile || !targetFormat || processing.isUploading || processing.isConverting || processing.isExtracting}
                    className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold"
                  >
                    {processing.isUploading || processing.isConverting || processing.isExtracting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Convert File
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Step 2: Result and Download */}
          {currentStep === 'result' && results.conversionResult && (
            <Card className="border-0 shadow-xl bg-slate-800/50 dark:bg-slate-800/50 backdrop-blur-sm">
              {/* Debug logging in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="hidden">
                  {(() => {
                    const data = results.conversionResult?.data;
                    const dataKeys = data ? Object.keys(data) : [];
                    console.log('🔍 Conversion Result Debug:', {
                      hasConversionResult: !!results.conversionResult,
                      conversionResultKeys: results.conversionResult ? Object.keys(results.conversionResult) : [],
                      hasData: !!data,
                      dataKeys: dataKeys,
                      dataValues: dataKeys.reduce((acc, key) => {
                        acc[key] = data?.[key];
                        return acc;
                      }, {} as Record<string, any>),
                      fileUrl: data?.file_url,
                      filePath: data?.file_path,
                      fullResultStringified: JSON.stringify(results.conversionResult, null, 2),
                    });
                    return null;
                  })()}
              </div>
            )}
                  <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    Conversion Complete
                    </CardTitle>
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    className="flex items-center gap-2"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Convert Another File
                  </Button>
                </div>
                  </CardHeader>
              <CardContent className="space-y-6">
                {/* File Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-lg">
                      <div>
                    <Label className="text-sm font-medium text-muted-foreground">Original Format</Label>
                    <p className="text-lg font-semibold text-slate-100">
                      {(() => {
                        const originalFile = (results.conversionResult.data as any)?.original_file;
                        const format = results.conversionResult.data?.original_format || 
                                      (selectedFile?.name?.split('.').pop()?.toUpperCase()) ||
                                      (originalFile?.filename?.split('.').pop()?.toUpperCase());
                        return format ? format.toUpperCase() : 'N/A';
                      })()}
                        </p>
                      </div>
                      <div>
                    <Label className="text-sm font-medium text-muted-foreground">Converted Format</Label>
                    <p className="text-lg font-semibold text-slate-100">
                      {(() => {
                        const convertedFile = (results.conversionResult.data as any)?.converted_file;
                        const format = results.conversionResult.data?.target_format || 
                                      convertedFile?.filename?.split('.').pop()?.toUpperCase() ||
                                      targetFormat?.toUpperCase();
                        return format ? format.toUpperCase() : 'N/A';
                      })()}
                        </p>
                      </div>
                      <div>
                    <Label className="text-sm font-medium text-muted-foreground">File Size</Label>
                    <p className="text-lg font-semibold text-slate-100">
                      {(() => {
                        const originalFile = (results.conversionResult.data as any)?.original_file;
                        const size = results.conversionResult.data?.file_size || 
                                    originalFile?.size || 
                                    selectedFile?.size;
                        return size ? `${(size / 1024 / 1024).toFixed(2)} MB` : 'N/A';
                      })()}
                        </p>
                      </div>
                  {results.conversionResult.data?.pages && (
                      <div>
                      <Label className="text-sm font-medium text-muted-foreground">Pages</Label>
                      <p className="text-lg font-semibold text-slate-100">
                        {results.conversionResult.data.pages}
                        </p>
                      </div>
                  )}
                </div>

                {/* Download Section */}
                <div className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
                        <Download className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100">Your file is ready!</h3>
                        <p className="text-sm text-muted-foreground">
                          Click the button below to download your converted file
                        </p>
                      </div>
                      </div>
                    <Button
                      onClick={async () => {
                        // Try multiple possible locations for the file URL
                        const conversionData = results.conversionResult?.data;
                        
                        // Log the actual structure to understand what we have
                        if (process.env.NODE_ENV === 'development') {
                          console.log('🔍 Download - Checking for file URL:', {
                            conversionDataKeys: conversionData ? Object.keys(conversionData) : [],
                            conversionDataFull: conversionData,
                            fullResult: results.conversionResult,
                            stringified: JSON.stringify(results.conversionResult, null, 2),
                          });
                        }
                        
                        // Try multiple possible locations for the file URL
                        // Based on actual API response structure:
                        // - data.converted_file.url (primary)
                        // - data.conversion_result.download_urls[0] (fallback)
                        const convertedFile = (conversionData as any)?.converted_file;
                        const conversionResult = (conversionData as any)?.conversion_result;
                        const downloadUrls = conversionResult?.download_urls;
                        
                        const fileUrl = 
                          convertedFile?.url ||
                          (Array.isArray(downloadUrls) && downloadUrls.length > 0 ? downloadUrls[0] : null) ||
                          convertedFile?.file_url ||
                          convertedFile?.file_path ||
                          convertedFile?.path ||
                          conversionData?.file_url || 
                          conversionData?.file_path ||
                          conversionData?.url ||
                          conversionData?.download_url ||
                          (results.conversionResult as any)?.file_url ||
                          (results.conversionResult as any)?.file_path ||
                          (results.conversionResult as any)?.url;
                        
                        if (!fileUrl) {
                          // Log full structure for debugging
                          console.error('❌ No file URL or file path available for download', {
                            fullConversionResult: results.conversionResult,
                            conversionResultKeys: results.conversionResult ? Object.keys(results.conversionResult) : [],
                            hasData: !!conversionData,
                            dataKeys: conversionData ? Object.keys(conversionData) : [],
                            dataContent: conversionData,
                            stringified: JSON.stringify(results.conversionResult, null, 2),
                          });
                          
                          // Try to construct URL from job_id if available
                          const jobId = results.conversionResult?.job_id;
                          if (jobId) {
                            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
                            const constructedUrl = `${API_BASE_URL}/file-processing/convert/download?job_id=${jobId}`;
                            console.log('🔧 Attempting constructed download URL:', constructedUrl);
                            
                            // Try the constructed URL
                            try {
                              const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                              const response = await fetch(constructedUrl, {
                                headers: token ? {
                                  'Authorization': `Bearer ${token}`,
                                  'Accept': 'application/octet-stream',
                                } : {
                                  'Accept': 'application/octet-stream',
                                },
                              });

                              if (response.ok) {
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `converted.${conversionData?.target_format || targetFormat || 'file'}`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                                return;
                              }
                            } catch (constructError) {
                              console.error('❌ Constructed URL download failed:', constructError);
                            }
                          }
                          
                          setError('File URL not available in conversion result. Please check the console for details and try converting again.');
                          return;
                        }
                        
                        if (process.env.NODE_ENV === 'development') {
                          console.log('📥 Download initiated:', {
                            fileUrl,
                            hasFileUrl: !!conversionData?.file_url,
                            hasFilePath: !!conversionData?.file_path,
                            conversionDataKeys: conversionData ? Object.keys(conversionData) : [],
                          });
                        }

                        try {
                          // Get auth token for authenticated requests
                          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                          
                          // Determine file extension for download filename
                          const convertedFile = (conversionData as any)?.converted_file;
                          const fileExtension = convertedFile?.filename?.split('.').pop() || 
                                                conversionData?.target_format || 
                                                targetFormat || 
                                                'file';
                          const downloadFilename = `converted.${fileExtension}`;
                          
                          // Check if URL is absolute or relative
                          if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
                            // For storage URLs, use direct link download (bypasses CORS)
                            if (fileUrl.includes('/storage/') || fileUrl.includes('/converted-files/')) {
                              // Storage URLs - use direct link download (bypasses CORS)
                              const link = document.createElement('a');
                              link.href = fileUrl;
                              link.download = downloadFilename;
                              link.target = '_blank';
                              link.rel = 'noopener noreferrer';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else if (fileUrl.includes('/api/') || fileUrl.includes('/v1/')) {
                              // API URLs - try fetch with auth, fallback to direct link if CORS fails
                              try {
                                const response = await fetch(fileUrl, {
                                  headers: token ? {
                                    'Authorization': `Bearer ${token}`,
                                    'Accept': 'application/octet-stream',
                                  } : {
                                    'Accept': 'application/octet-stream',
                                  },
                                });

                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = downloadFilename;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                } else {
                                  throw new Error(`Download failed: ${response.statusText}`);
                                }
                              } catch (fetchError) {
                                // If fetch fails (CORS or other), fallback to direct link
                                console.warn('⚠️ Fetch failed, using direct link:', fetchError);
                                const link = document.createElement('a');
                                link.href = fileUrl;
                                link.download = downloadFilename;
                                link.target = '_blank';
                                link.rel = 'noopener noreferrer';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            } else {
                              // Other absolute URLs - use direct link
                              const link = document.createElement('a');
                              link.href = fileUrl;
                              link.download = downloadFilename;
                              link.target = '_blank';
                              link.rel = 'noopener noreferrer';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          } else {
                            // Relative URL - construct full URL with base API URL
                            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
                            const fullUrl = fileUrl.startsWith('/') 
                              ? `${API_BASE_URL.replace('/api', '')}${fileUrl}`
                              : `${API_BASE_URL}/${fileUrl}`;
                            
                            // Try fetch first, fallback to direct link
                            try {
                              const response = await fetch(fullUrl, {
                                headers: token ? {
                                  'Authorization': `Bearer ${token}`,
                                  'Accept': 'application/octet-stream',
                                } : {
                                  'Accept': 'application/octet-stream',
                                },
                              });

                              if (response.ok) {
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = downloadFilename;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                              } else {
                                throw new Error(`Download failed: ${response.statusText}`);
                              }
                            } catch (fetchError) {
                              // Fallback to direct link
                              console.warn('⚠️ Fetch failed, using direct link:', fetchError);
                              const link = document.createElement('a');
                              link.href = fullUrl;
                              link.download = downloadFilename;
                              link.target = '_blank';
                              link.rel = 'noopener noreferrer';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }
                        } catch (error) {
                          console.error('❌ Download error:', error);
                          setError(error instanceof Error ? error.message : 'Failed to download file. Please try again.');
                        }
                      }}
                      disabled={!results.conversionResult || (!(results.conversionResult.data as any)?.converted_file?.url && !((results.conversionResult.data as any)?.conversion_result?.download_urls?.[0]))}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download File
                    </Button>
                      </div>
                    </div>

                {/* File URL (for copy) */}
                {(() => {
                  const convertedFile = (results.conversionResult.data as any)?.converted_file;
                  const conversionResult = (results.conversionResult.data as any)?.conversion_result;
                  const downloadUrls = conversionResult?.download_urls;
                  const fileUrl = convertedFile?.url || (Array.isArray(downloadUrls) && downloadUrls.length > 0 ? downloadUrls[0] : null);
                  
                  return fileUrl ? (
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <Label className="text-sm font-medium text-muted-foreground mb-2 block">File URL</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={fileUrl}
                          readOnly
                          className="bg-slate-800/50 text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(fileUrl);
                          }}
                        >
                          Copy
                    </Button>
                      </div>
                    </div>
                  ) : null;
                })()}
                  </CardContent>
                </Card>
              )}

          {/* Processing Progress - Show during conversion */}
          {isProcessing && currentStep === 'upload' && (
            <Card className="border-0 shadow-xl bg-slate-800/50 dark:bg-slate-800/50 backdrop-blur-sm">
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
            <Card className="border-destructive border-0 shadow-xl bg-slate-800/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                              </div>
                <p className="mt-2 text-sm">{error}</p>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="mt-4"
                >
                  Try Again
                </Button>
                  </CardContent>
                </Card>
          )}

          {/* Capabilities Info - Only show in upload step */}
          {currentStep === 'upload' && (
            <Card className="border-0 shadow-xl bg-slate-800/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
                  Supported Formats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                    <Label className="text-sm font-medium">Input Formats</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(['bmp', 'doc', 'docx', 'gif', 'htm', 'html', 'jpeg', 'jpg', 'md', 'pdf', 'png', 'ppt', 'pptx', 'txt', 'xls', 'xlsx'] as InputFileType[]).map((format) => (
                      <Badge key={format} variant="outline" className="text-xs">
                          {format.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                    <Label className="text-sm font-medium">Output Formats</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(['doc', 'docx', 'html', 'jpg', 'md', 'pdf', 'png', 'ppt', 'pptx', 'xls', 'xlsx'] as OutputFileType[]).map((format) => (
                      <Badge key={format} variant="outline" className="text-xs">
                          {format.toUpperCase()}
                      </Badge>
                    ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
          )}
        </div>
      </div>
    </div>
  );
}
