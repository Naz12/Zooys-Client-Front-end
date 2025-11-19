"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Upload, 
  Edit3, 
  Merge, 
  Scissors, 
  Loader2,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  MessageSquare,
  Image,
  Minimize2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';
import { uploadApi } from '@/lib/api/upload-api';
import type { UploadedFile } from '@/lib/types/api';

type Operation = 
  | 'edit' 
  | 'compress' 
  | 'page-numbers' 
  | 'watermark' 
  | 'protect' 
  | 'unlock' 
  | 'annotate' 
  | 'merge' 
  | 'split';

interface OperationInfo {
  id: Operation;
  name: string;
  description: string;
  icon: React.ReactNode;
  supportsMultiple: boolean;
  minFiles: number;
  maxFiles?: number;
}

const operations: OperationInfo[] = [
  {
    id: 'edit',
    name: 'Edit PDF',
    description: 'Edit, reorder, and modify pages',
    icon: <Edit3 size={24} />,
    supportsMultiple: false,
    minFiles: 1,
  },
  {
    id: 'compress',
    name: 'Compress PDF',
    description: 'Reduce file size while maintaining quality',
    icon: <Minimize2 size={24} />,
    supportsMultiple: false,
    minFiles: 1,
  },
  {
    id: 'page-numbers',
    name: 'Add Page Numbers',
    description: 'Add page numbers to your PDF',
    icon: <CheckCircle2 size={24} />,
    supportsMultiple: false,
    minFiles: 1,
  },
  {
    id: 'watermark',
    name: 'Watermark',
    description: 'Add text or image watermarks',
    icon: <Image size={24} />,
    supportsMultiple: false,
    minFiles: 1,
  },
  {
    id: 'protect',
    name: 'Protect PDF',
    description: 'Add password protection and permissions',
    icon: <ShieldCheck size={24} />,
    supportsMultiple: false,
    minFiles: 1,
  },
  {
    id: 'unlock',
    name: 'Unlock PDF',
    description: 'Remove password protection',
    icon: <Unlock size={24} />,
    supportsMultiple: false,
    minFiles: 1,
  },
  {
    id: 'annotate',
    name: 'Annotate PDF',
    description: 'Add annotations and comments',
    icon: <MessageSquare size={24} />,
    supportsMultiple: false,
    minFiles: 1,
  },
  {
    id: 'merge',
    name: 'Merge PDFs',
    description: 'Combine multiple PDFs into one',
    icon: <Merge size={24} />,
    supportsMultiple: true,
    minFiles: 2,
  },
  {
    id: 'split',
    name: 'Split PDF',
    description: 'Split PDF into multiple files',
    icon: <Scissors size={24} />,
    supportsMultiple: false,
    minFiles: 1,
  },
];

export default function PDFEditorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileUploadRef = useRef<HTMLDivElement>(null);

  const selectedOpInfo = selectedOperation 
    ? operations.find(op => op.id === selectedOperation)
    : null;

  // Scroll to file upload section when operation is selected
  useEffect(() => {
    if (selectedOperation && fileUploadRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        fileUploadRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [selectedOperation]);

  // Handle file upload to backend
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (!selectedOperation) {
      toast.error('Please select an operation first');
      return;
    }

    const opInfo = operations.find(op => op.id === selectedOperation);
    if (!opInfo) return;

    // Validate file count
    const filesArray = Array.from(files);
    if (filesArray.length < opInfo.minFiles) {
      toast.error(`${opInfo.name} requires at least ${opInfo.minFiles} file(s)`);
      return;
    }
    if (!opInfo.supportsMultiple && filesArray.length > 1) {
      toast.error(`${opInfo.name} only supports a single file`);
      return;
    }
    if (opInfo.maxFiles && filesArray.length > opInfo.maxFiles) {
      toast.error(`${opInfo.name} supports maximum ${opInfo.maxFiles} files`);
      return;
    }

    setIsUploading(true);
    
    try {
      // Validate all files first
      const validFiles: File[] = [];
      for (const file of filesArray) {
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
          toast.error(`File ${file.name} is not a PDF`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 10MB)`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        setIsUploading(false);
        return;
      }

      const uploadProgressId = `upload-${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [uploadProgressId]: 0 }));

      let newFiles: UploadedFile[] = [];

      if (validFiles.length === 1) {
        // Single file upload
        try {
          const uploadResponse = await uploadApi.uploadSingleFile(
            validFiles[0],
            (progress) => {
              setUploadProgress(prev => ({ ...prev, [uploadProgressId]: progress }));
            }
          );

          // Log response for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('📤 Upload response:', {
              hasResponse: !!uploadResponse,
              responseKeys: uploadResponse ? Object.keys(uploadResponse) : [],
              hasData: !!(uploadResponse as any).data,
              hasFileUpload: !!(uploadResponse as any).file_upload,
              response: uploadResponse,
            });
          }

          let fileId: string | null = null;
          let filename: string = validFiles[0].name;
          let fileSize: number = validFiles[0].size;
          let fileType: string = validFiles[0].type || 'application/pdf';
          let uploadedAt: string = new Date().toISOString();

          // Try multiple response structures
          const response = uploadResponse as any;
          
          // Check for file_upload structure (most common backend response)
          if (response.file_upload) {
            const fileData = response.file_upload;
            fileId = fileData.id?.toString() || null;
            filename = fileData.original_name || fileData.original_filename || filename;
            fileSize = fileData.file_size || fileSize;
            fileType = fileData.file_type || fileData.mime_type || fileType;
            uploadedAt = fileData.created_at || uploadedAt;
          } 
          // Check for data structure (expected by SingleFileUploadResponse)
          else if (response.data) {
            const fileData = response.data;
            fileId = fileData.id?.toString() || null;
            filename = fileData.original_filename || fileData.original_name || filename;
            fileSize = fileData.file_size || fileSize;
            fileType = fileData.file_type || fileData.mime_type || fileType;
            uploadedAt = fileData.created_at || uploadedAt;
          } 
          // Check if response itself has the file data
          else if (response.id) {
            fileId = response.id?.toString() || null;
            filename = response.original_filename || response.original_name || filename;
            fileSize = response.file_size || fileSize;
            fileType = response.file_type || response.mime_type || fileType;
            uploadedAt = response.created_at || uploadedAt;
          }

          if (!fileId) {
            console.error('❌ Invalid upload response structure:', uploadResponse);
            throw new Error(`Invalid upload response: missing file ID. Response structure: ${JSON.stringify(uploadResponse)}`);
          }

          newFiles.push({
            file_id: fileId,
            filename,
            size: fileSize,
            file_type: fileType,
            uploaded_at: uploadedAt,
          });
        } catch (uploadError: any) {
          console.error('Error uploading file:', uploadError);
          toast.error(`Failed to upload ${validFiles[0].name}: ${uploadError.message || 'Unknown error'}`);
        }
      } else {
        // Multiple file upload
        try {
          const uploadResponse = await uploadApi.uploadMultipleFiles(
            validFiles,
            (progress) => {
              setUploadProgress(prev => ({ ...prev, [uploadProgressId]: progress }));
            }
          );

          if (uploadResponse.file_uploads && uploadResponse.file_uploads.length > 0) {
            newFiles = uploadResponse.file_uploads.map((item) => ({
              file_id: item.file_upload.id.toString(),
              filename: item.file_upload.original_name,
              size: item.file_upload.file_size,
              file_type: item.file_upload.file_type,
              uploaded_at: item.file_upload.created_at,
            }));
          }

          if (uploadResponse.error_count > 0) {
            toast.error(`${uploadResponse.error_count} file(s) failed to upload`);
          }
        } catch (uploadError: any) {
          console.error('Error uploading multiple files:', uploadError);
          toast.error(`Failed to upload files: ${uploadError.message || 'Unknown error'}`);
        }
      }

      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[uploadProgressId];
        return updated;
      });

      if (newFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...newFiles]);
        toast.success(`${newFiles.length} file(s) uploaded successfully`);
      }
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Error uploading files');
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  }, [selectedOperation]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.file_id !== fileId));
  }, []);

  // Proceed to operation page
  const handleProceed = useCallback(() => {
    if (!selectedOperation) {
      toast.error('Please select an operation');
      return;
    }

    const opInfo = operations.find(op => op.id === selectedOperation);
    if (!opInfo) return;

    if (uploadedFiles.length < opInfo.minFiles) {
      toast.error(`Please upload at least ${opInfo.minFiles} file(s) for ${opInfo.name}`);
      return;
    }

    // Store files based on operation type
    if (selectedOperation === 'merge') {
      // Multiple files for merge
      const fileIds = uploadedFiles.map(f => f.file_id);
      localStorage.setItem('pdfMergeFileIds', JSON.stringify(fileIds));
      localStorage.setItem('pdfMergeFiles', JSON.stringify(uploadedFiles));
      router.push('/pdf-editor/edit?operation=merge');
    } else {
      // Single file operations
      const file = uploadedFiles[0];
      localStorage.setItem('pdfEditorFileId', file.file_id);
      localStorage.setItem('pdfEditorFileName', file.filename);
      router.push(`/pdf-editor/edit?operation=${selectedOperation}`);
    }
  }, [selectedOperation, uploadedFiles, router]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            PDF Editor
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
            Choose an operation, then upload your PDF file(s)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Left: Operation Selection */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>1. Choose Operation</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select the PDF operation you want to perform
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {operations.map((op) => (
                    <Button
                      key={op.id}
                      variant={selectedOperation === op.id ? "default" : "outline"}
                      className={`h-auto min-h-[100px] p-4 flex flex-col items-start gap-2 overflow-hidden ${
                        selectedOperation === op.id
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedOperation(op.id);
                        setUploadedFiles([]); // Clear files when changing operation
                      }}
                    >
                      <div className="flex items-center gap-2 w-full min-w-0">
                        <div className="flex-shrink-0">{op.icon}</div>
                        <span className="font-semibold text-left flex-1 min-w-0 truncate">{op.name}</span>
                      </div>
                      <p className="text-xs opacity-80 text-left w-full break-words overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4',
                        maxHeight: '2.8em'
                      }}>{op.description}</p>
                      <p className="text-xs opacity-60 text-left w-full truncate">
                        {op.supportsMultiple ? 'Multiple files' : 'Single file'}
                      </p>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: File Upload */}
          <div ref={fileUploadRef} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  2. {selectedOperation ? `Upload ${selectedOpInfo?.supportsMultiple ? 'Files' : 'File'}` : 'Select Operation First'}
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedOperation
                    ? selectedOpInfo?.supportsMultiple
                      ? `Upload at least ${selectedOpInfo.minFiles} PDF files`
                      : 'Upload a single PDF file'
                    : 'Please select an operation from the left'}
                </p>
              </CardHeader>
              <CardContent>
                {selectedOperation ? (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center">
                      <Upload size={48} className="mx-auto text-indigo-500 mb-4" />
                      <Label 
                        htmlFor="file-upload" 
                        className="text-lg font-medium cursor-pointer"
                      >
                        {selectedOpInfo?.supportsMultiple 
                          ? 'Upload PDFs' 
                          : 'Upload PDF'}
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf,application/pdf"
                        multiple={selectedOpInfo?.supportsMultiple}
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <p className="text-sm text-slate-500 mt-2">
                        {selectedOpInfo?.supportsMultiple
                          ? 'Select multiple PDF files to upload'
                          : 'Drag and drop your PDF file here or click to browse'}
                      </p>
                      {selectedOpInfo && (
                        <p className="text-xs text-slate-400 mt-1">
                          Requires {selectedOpInfo.minFiles} file{selectedOpInfo.minFiles > 1 ? 's' : ''}
                          {selectedOpInfo.maxFiles && ` (max ${selectedOpInfo.maxFiles})`}
                        </p>
                      )}
                    </div>

                    {/* Upload Progress */}
                    {Object.keys(uploadProgress).length > 0 && (
                      <div className="space-y-2">
                        {Object.entries(uploadProgress).map(([tempId, progress]) => (
                          <div key={tempId} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">Uploading...</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Uploaded Files */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <h3 className="font-medium">
                            Uploaded Files ({uploadedFiles.length}):
                          </h3>
                          {uploadedFiles.length >= (selectedOpInfo?.minFiles || 1) && (
                            <Button
                              onClick={handleProceed}
                              className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
                            >
                              Proceed to {selectedOpInfo?.name}
                            </Button>
                          )}
                        </div>
                        {uploadedFiles.map((file, index) => (
                          <div key={file.file_id} className="flex items-center justify-between gap-3 p-4 border rounded-lg bg-white dark:bg-slate-800">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {selectedOpInfo?.supportsMultiple && (
                                <span className="text-sm font-medium text-slate-500 flex-shrink-0">#{index + 1}</span>
                              )}
                              <FileText size={20} className="text-red-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{file.filename}</p>
                                <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => removeFile(file.file_id)}
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {isUploading && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Uploading files...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-12 border-2 border-dashed border-slate-300 rounded-lg">
                    <FileText size={48} className="mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      Please select an operation first
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
