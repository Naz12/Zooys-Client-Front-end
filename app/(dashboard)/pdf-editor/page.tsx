"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, Edit3, Merge, Scissors, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';
import type { PDFDocument } from '@/lib/types/api';

export default function PDFEditorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<PDFDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'merge' | 'split'>('edit');

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const newFiles: PDFDocument[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
          toast.error(`File ${file.name} is not a PDF`);
          continue;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        const pdfDoc: PDFDocument = {
          id: `${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          pageCount: 0, // Will be updated when PDF is loaded
          pages: [],
          file: file,
          url: URL.createObjectURL(file)
        };

        newFiles.push(pdfDoc);
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      if (newFiles.length > 0) {
        toast.success(`${newFiles.length} file(s) uploaded successfully`);
      }
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Error uploading files');
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.url) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  // Start editing
  const startEditing = useCallback((file: PDFDocument) => {
    // Store file data for the editor
    localStorage.setItem('pdfEditorData', JSON.stringify({
      id: file.id,
      name: file.name,
      url: file.url,
      file: file.file
    }));
    
    router.push('/pdf-editor/edit');
  }, [router]);

  // Start merging
  const startMerging = useCallback(() => {
    if (uploadedFiles.length < 2) {
      toast.error('Please upload at least 2 files to merge');
      return;
    }
    
    // Store files data for the merge wizard
    localStorage.setItem('pdfMergeData', JSON.stringify(
      uploadedFiles.map(file => ({
        id: file.id,
        name: file.name,
        url: file.url,
        file: file.file
      }))
    ));
    
    router.push('/pdf-editor/merge');
  }, [uploadedFiles, router]);

  // Start splitting
  const startSplitting = useCallback((file: PDFDocument) => {
    // Store file data for the split tool
    localStorage.setItem('pdfSplitData', JSON.stringify({
      id: file.id,
      name: file.name,
      url: file.url,
      file: file.file
    }));
    
    router.push('/pdf-editor/split');
  }, [router]);

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            PDF Editor
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Edit, merge, and split your PDF documents with powerful tools
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 size={16} />
              Edit PDF
            </TabsTrigger>
            <TabsTrigger value="merge" className="flex items-center gap-2">
              <Merge size={16} />
              Merge PDFs
            </TabsTrigger>
            <TabsTrigger value="split" className="flex items-center gap-2">
              <Scissors size={16} />
              Split PDF
            </TabsTrigger>
          </TabsList>

          {/* Edit PDF Tab */}
          <TabsContent value="edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 size={20} />
                  Edit Single PDF
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center">
                    <Upload size={48} className="mx-auto text-indigo-500 mb-4" />
                    <Label htmlFor="edit-file-upload" className="text-lg font-medium cursor-pointer">
                      Upload PDF to Edit
                    </Label>
                    <Input
                      id="edit-file-upload"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-slate-500 mt-2">
                      Drag and drop your PDF file here or click to browse
                    </p>
                  </div>

                  {/* Uploaded Files */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium">Uploaded Files:</h3>
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-800">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-red-500" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => startEditing(file)}
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700"
                            >
                              <Edit3 size={16} className="mr-1" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => removeFile(file.id)}
                              variant="outline"
                              size="sm"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Merge PDFs Tab */}
          <TabsContent value="merge" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Merge size={20} />
                  Merge Multiple PDFs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center">
                    <Upload size={48} className="mx-auto text-purple-500 mb-4" />
                    <Label htmlFor="merge-file-upload" className="text-lg font-medium cursor-pointer">
                      Upload PDFs to Merge
                    </Label>
                    <Input
                      id="merge-file-upload"
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-slate-500 mt-2">
                      Select multiple PDF files to merge together
                    </p>
                  </div>

                  {/* Uploaded Files for Merge */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Files to Merge ({uploadedFiles.length}):</h3>
                        {uploadedFiles.length >= 2 && (
                            <div className="flex gap-2">
                              <Button
                                onClick={startMerging}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Merge size={16} className="mr-1" />
                                Simple Merge
                              </Button>
                              <Button
                                onClick={() => router.push('/pdf-editor/merge-advanced')}
                                variant="outline"
                                className="border-purple-300 text-purple-600 hover:bg-purple-50"
                              >
                                <Merge size={16} className="mr-1" />
                                Advanced Merge
                              </Button>
                            </div>
                        )}
                      </div>
                      {uploadedFiles.map((file, index) => (
                        <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-800">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-500">#{index + 1}</span>
                            <FileText size={20} className="text-red-500" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => removeFile(file.id)}
                            variant="outline"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Split PDF Tab */}
          <TabsContent value="split" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors size={20} />
                  Split PDF into Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center">
                    <Upload size={48} className="mx-auto text-green-500 mb-4" />
                    <Label htmlFor="split-file-upload" className="text-lg font-medium cursor-pointer">
                      Upload PDF to Split
                    </Label>
                    <Input
                      id="split-file-upload"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-slate-500 mt-2">
                      Select a PDF file to split into individual pages
                    </p>
                  </div>

                  {/* Uploaded Files for Split */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium">File to Split:</h3>
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-800">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-red-500" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => startSplitting(file)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Scissors size={16} className="mr-1" />
                              Split
                            </Button>
                            <Button
                              onClick={() => removeFile(file.id)}
                              variant="outline"
                              size="sm"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Features Overview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Edit3 size={48} className="mx-auto text-indigo-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Edit PDFs</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Delete, rotate, duplicate, and reorder pages with drag-and-drop interface
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Merge size={48} className="mx-auto text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Merge PDFs</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Combine multiple PDFs or any document types into a single PDF
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Scissors size={48} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Split PDFs</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Split PDFs into individual pages or custom page ranges
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
