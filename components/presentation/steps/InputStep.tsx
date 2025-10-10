"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Link, 
  Youtube, 
  Upload, 
  Sparkles,
  Lightbulb,
  Target
} from 'lucide-react';
import { useWorkflow } from '@/lib/presentation-workflow-context';
import { presentationApi, GenerateOutlineRequest } from '@/lib/presentation-api-client';
import { useNotifications } from '@/lib/notifications';

const quickStartExamples = [
  {
    title: "Business Pitch",
    description: "Create a compelling business pitch presentation",
    topic: "Revolutionary AI-powered customer service platform that reduces response time by 80% and increases customer satisfaction by 40%",
    tone: "Professional",
    length: "Medium"
  },
  {
    title: "Educational Content",
    description: "Develop educational material for students",
    topic: "Introduction to Machine Learning: Concepts, Applications, and Future Trends",
    tone: "Academic",
    length: "Long"
  },
  {
    title: "Marketing Campaign",
    description: "Design a marketing presentation for new product launch",
    topic: "Launch of EcoSmart Home Automation System - Sustainable Living Made Simple",
    tone: "Creative",
    length: "Medium"
  },
  {
    title: "Project Report",
    description: "Create a comprehensive project status report",
    topic: "Q4 2024 Digital Transformation Initiative: Progress, Challenges, and Next Steps",
    tone: "Formal",
    length: "Long"
  }
];

export function InputStep() {
  const { state, dispatch } = useWorkflow();
  const { showSuccess, showError } = useNotifications();
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  const handleInputTypeChange = (inputType: 'text' | 'file' | 'url' | 'youtube') => {
    dispatch({
      type: 'SET_INPUT_DATA',
      payload: { 
        inputType,
        file: null,
        url: '',
        youtubeUrl: '',
        topic: inputType === 'text' ? state.inputData.topic : ''
      }
    });
    setFileUploadError(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setFileUploadError('Please upload a valid document file (PDF, DOC, DOCX, PPT, PPTX, or TXT)');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setFileUploadError('File size must be less than 10MB');
        return;
      }

      dispatch({
        type: 'SET_INPUT_DATA',
        payload: { file }
      });
      setFileUploadError(null);
    }
  };

  const handleQuickStart = (example: (typeof quickStartExamples)[0]) => {
    dispatch({
      type: 'SET_INPUT_DATA',
      payload: {
        inputType: 'text',
        topic: example.topic,
        tone: example.tone,
        length: example.length,
        file: null,
        url: '',
        youtubeUrl: ''
      }
    });
  };

  const handleGenerateOutline = async () => {
    if (!state.inputData.topic.trim() && state.inputData.inputType === 'text') {
      showError('Please enter a presentation topic');
      return;
    }

    if (state.inputData.inputType === 'file' && !state.inputData.file) {
      showError('Please upload a file');
      return;
    }

    if (state.inputData.inputType === 'url' && !state.inputData.url.trim()) {
      showError('Please enter a URL');
      return;
    }

    if (state.inputData.inputType === 'youtube' && !state.inputData.youtubeUrl.trim()) {
      showError('Please enter a YouTube URL');
      return;
    }

    setIsGenerating(true);
    dispatch({ type: 'SET_GENERATING', payload: true });

    try {
      const request: GenerateOutlineRequest = {
        input_type: state.inputData.inputType,
        topic: state.inputData.topic,
        language: state.inputData.language as 'English' | 'Spanish' | 'French' | 'German' | 'Italian' | 'Portuguese' | 'Chinese' | 'Japanese',
        tone: state.inputData.tone as 'Professional' | 'Casual' | 'Academic' | 'Creative' | 'Formal',
        length: state.inputData.length as 'Short' | 'Medium' | 'Long',
        model: state.inputData.model as 'Basic Model' | 'Advanced Model' | 'Premium Model',
        file: state.inputData.file || undefined,
        url: state.inputData.url || undefined,
        youtube_url: state.inputData.youtubeUrl || undefined,
      };

      const response = await presentationApi.generateOutline(request);
      
      if (response.success) {
        dispatch({
          type: 'SET_OUTLINE',
          payload: {
            outline: response.data.outline,
            aiResultId: response.data.ai_result_id
          }
        });
        showSuccess('Outline generated successfully!');
      } else {
        throw new Error('Failed to generate outline');
      }
    } catch (error) {
      console.error('Error generating outline:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate outline';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showError(errorMessage);
    } finally {
      setIsGenerating(false);
      dispatch({ type: 'SET_GENERATING', payload: false });
    }
  };

  const getCharacterCount = () => {
    return state.inputData.topic.length;
  };

  const isTopicValid = () => {
    return state.inputData.topic.length > 0 && state.inputData.topic.length <= 5000;
  };

  return (
    <div className="space-y-6">
      {/* Input Method Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Input Method</Label>
        <Tabs 
          value={state.inputData.inputType} 
          onValueChange={(value) => handleInputTypeChange(value as 'text' | 'file' | 'url' | 'youtube')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              YouTube
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Presentation Topic *</Label>
              <Textarea
                id="topic"
                placeholder="Describe your presentation topic in detail..."
                value={state.inputData.topic}
                onChange={(e) => dispatch({
                  type: 'SET_INPUT_DATA',
                  payload: { topic: e.target.value }
                })}
                className="min-h-[120px]"
                maxLength={5000}
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Be specific about your topic, audience, and key points</span>
                <span className={getCharacterCount() > 5000 ? 'text-red-500' : ''}>
                  {getCharacterCount()}/5000
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Upload Document</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, PPT, PPTX, TXT (max 10MB)
                  </p>
                </label>
              </div>
              {state.inputData.file && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    {state.inputData.file.name} ({(state.inputData.file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
              {fileUploadError && (
                <p className="text-sm text-red-500">{fileUploadError}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/article"
                value={state.inputData.url}
                onChange={(e) => dispatch({
                  type: 'SET_INPUT_DATA',
                  payload: { url: e.target.value }
                })}
              />
              <p className="text-sm text-muted-foreground">
                Enter a URL to extract content for your presentation
              </p>
            </div>
          </TabsContent>

          <TabsContent value="youtube" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube URL</Label>
              <Input
                id="youtube"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={state.inputData.youtubeUrl}
                onChange={(e) => dispatch({
                  type: 'SET_INPUT_DATA',
                  payload: { youtubeUrl: e.target.value }
                })}
              />
              <p className="text-sm text-muted-foreground">
                Enter a YouTube video URL to create a presentation from the content
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Configuration Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select
            value={state.inputData.language}
            onValueChange={(value) => dispatch({
              type: 'SET_INPUT_DATA',
              payload: { language: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="German">German</SelectItem>
              <SelectItem value="Italian">Italian</SelectItem>
              <SelectItem value="Portuguese">Portuguese</SelectItem>
              <SelectItem value="Chinese">Chinese</SelectItem>
              <SelectItem value="Japanese">Japanese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone">Tone</Label>
          <Select
            value={state.inputData.tone}
            onValueChange={(value) => dispatch({
              type: 'SET_INPUT_DATA',
              payload: { tone: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Professional">Professional</SelectItem>
              <SelectItem value="Casual">Casual</SelectItem>
              <SelectItem value="Academic">Academic</SelectItem>
              <SelectItem value="Creative">Creative</SelectItem>
              <SelectItem value="Formal">Formal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="length">Length</Label>
          <Select
            value={state.inputData.length}
            onValueChange={(value) => dispatch({
              type: 'SET_INPUT_DATA',
              payload: { length: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Short">Short (5-10 slides)</SelectItem>
              <SelectItem value="Medium">Medium (10-20 slides)</SelectItem>
              <SelectItem value="Long">Long (20+ slides)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">AI Model</Label>
          <Select
            value={state.inputData.model}
            onValueChange={(value) => dispatch({
              type: 'SET_INPUT_DATA',
              payload: { model: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Basic Model">Basic Model</SelectItem>
              <SelectItem value="Advanced Model">Advanced Model</SelectItem>
              <SelectItem value="Premium Model">Premium Model</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Start Examples */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <Label className="text-base font-semibold">Quick Start Examples</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickStartExamples.map((example, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleQuickStart(example)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {example.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  {example.description}
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {example.tone}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {example.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleGenerateOutline}
          disabled={isGenerating || !isTopicValid()}
          size="lg"
          className="px-8"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Generating Outline...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Outline
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
