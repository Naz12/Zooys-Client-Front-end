"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, ArrowRight, Download, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ConvertFileCard() {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-indigo-200">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-fit group-hover:scale-110 transition-transform duration-300">
          <FileUp className="h-8 w-8 text-indigo-600" />
        </div>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          File Converter
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Convert files between different formats and extract content from documents
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>PDF, DOC, PPT, XLS, Images</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Download className="h-4 w-4" />
            <span>Multiple output formats</span>
          </div>
        </div>

        <div className="pt-4">
          <Link href="/convert-file">
            <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white group-hover:shadow-lg transition-all duration-300">
              <FileUp className="mr-2 h-4 w-4" />
              Convert Files
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Supports document conversion and content extraction
        </div>
      </CardContent>
    </Card>
  );
}



