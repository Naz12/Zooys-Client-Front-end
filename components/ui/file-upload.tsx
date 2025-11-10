"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fileApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  Check, 
  Loader2,
  AlertCircle 
} from "lucide-react";

export interface FileUploadItem {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "completed" | "error";
  file?: File;
  uploadId?: number;
}

interface FileUploadProps {
  accept: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  onFilesChange: (files: FileUploadItem[]) => void;
  onUploadIdsChange?: (uploadIds: number[]) => void;
  files: FileUploadItem[];
  title?: string;
  description?: string;
  className?: string;
}

export default function FileUpload({
  accept,
  maxSize = 50,
  multiple = true,
  onFilesChange,
  onUploadIdsChange,
  files,
  title = "Upload Files",
  description = "Drag and drop files here or click to browse",
  className = "",
}: FileUploadProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    return null;
  };

  const handleFiles = async (fileList: FileList) => {
    if (!user) {
      showError("Error", "Please log in to upload files");
      return;
    }

    const newFiles: FileUploadItem[] = [];
    const uploadIds: number[] = [];
    
    for (const file of Array.from(fileList)) {
      const error = validateFile(file);
      const newFile: FileUploadItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: error ? "error" : "uploading",
        file,
      };
      newFiles.push(newFile);
    }

    onFilesChange([...(files || []), ...newFiles]);

    // Upload files to API (standard files service)
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (file.status === "uploading" && file.file) {
        try {
          const response = await fileApi.upload({
            file: file.file,
            metadata: { tool_type: 'summarize' }
          });
          
          // Handle different response structures
          const uploadId = (response as any).file_upload?.id || (response as any).id || (response as any).data?.id;
          
          if (uploadId) {
            uploadIds.push(uploadId);
            
            // Update file status
            onFilesChange(prev => 
              (prev || []).map(f => f.id === file.id ? { 
                ...f, 
                status: "completed" as const,
                uploadId: uploadId
              } : f)
            );
          } else {
            throw new Error('Invalid upload response structure');
          }
          
          showSuccess("Success", `${file.name} uploaded successfully!`);
        } catch (error) {
          console.error("Upload error:", error);
          showError("Error", `Failed to upload ${file.name}`);
          
          // Update file status to error
          onFilesChange(prev => 
            (prev || []).map(f => f.id === file.id ? { 
              ...f, 
              status: "error" as const 
            } : f)
          );
        }
      }
    }

    // Update upload IDs
    if (onUploadIdsChange && uploadIds.length > 0) {
      onUploadIdsChange([...uploadIds]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  };

  const removeFile = (fileId: string) => {
    onFilesChange((files || []).filter(f => f.id !== fileId));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type === 'application/pdf') return FileText;
    return File;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
        return <Loader2 size={16} className="animate-spin text-indigo-500" />;
      case "completed":
        return <Check size={16} className="text-green-500" />;
      case "error":
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver 
            ? "border-indigo-400 bg-indigo-50/50" 
            : "border-indigo-500/50 hover:border-indigo-400"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-3">
          <Upload size={32} className="text-indigo-500" />
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            <p className="text-xs text-muted-foreground">
              Max {maxSize}MB per file
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            className="hidden"
            onChange={handleFileInput}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Choose Files
          </Button>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files ({files.length})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <Card key={file.id} className="bg-background border border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <FileIcon size={20} className="text-indigo-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(file.status)}
                              <span className="text-xs capitalize">{file.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="flex-shrink-0 h-8 w-8 p-0"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
