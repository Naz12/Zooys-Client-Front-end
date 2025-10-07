"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Presentation, 
  FileText, 
  Image, 
  Video, 
  Download, 
  Play, 
  Settings,
  Sparkles,
  Target,
  Clock,
  Users,
  Lightbulb
} from "lucide-react";
import { useNotifications } from "@/lib/notifications";

interface PresentationSlide {
  id: string;
  title: string;
  content: string;
  type: 'title' | 'content' | 'image' | 'chart' | 'conclusion';
  notes?: string;
}

interface PresentationData {
  title: string;
  description: string;
  slides: PresentationSlide[];
  theme: string;
  duration: number;
  targetAudience: string;
}

export default function PresentationPage() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState("");
  const [style, setStyle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const { showSuccess, showError } = useNotifications();

  const presentationStyles = [
    { value: "professional", label: "Professional", description: "Clean, corporate style" },
    { value: "creative", label: "Creative", description: "Colorful, engaging design" },
    { value: "minimalist", label: "Minimalist", description: "Simple, focused content" },
    { value: "academic", label: "Academic", description: "Research-focused, detailed" },
    { value: "marketing", label: "Marketing", description: "Persuasive, sales-oriented" },
  ];

  const handleGeneratePresentation = async () => {
    if (!topic.trim()) {
      showError("Please enter a presentation topic");
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockPresentation: PresentationData = {
        title: topic,
        description: `A comprehensive presentation about ${topic}`,
        slides: [
          {
            id: "1",
            title: "Introduction",
            content: `Welcome to our presentation on ${topic}. Today we'll explore the key concepts and insights.`,
            type: "title",
            notes: "Start with a strong hook to engage the audience"
          },
          {
            id: "2",
            title: "Overview",
            content: `Let's begin with an overview of ${topic} and its importance in today's world.`,
            type: "content",
            notes: "Provide context and background information"
          },
          {
            id: "3",
            title: "Key Points",
            content: `Here are the main points we'll cover:\n\n• Point 1: Important aspect\n• Point 2: Critical factor\n• Point 3: Key consideration`,
            type: "content",
            notes: "Use bullet points for clarity"
          },
          {
            id: "4",
            title: "Visual Analysis",
            content: "This slide would contain charts, graphs, or images to support our discussion.",
            type: "chart",
            notes: "Include relevant data visualization"
          },
          {
            id: "5",
            title: "Conclusion",
            content: `In conclusion, ${topic} represents a significant opportunity for growth and development.`,
            type: "conclusion",
            notes: "Summarize key takeaways and next steps"
          }
        ],
        theme: style || "professional",
        duration: parseInt(duration) || 10,
        targetAudience: audience || "General audience"
      };

      setPresentation(mockPresentation);
      showSuccess("Presentation generated successfully!");
    } catch (error) {
      showError("Failed to generate presentation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPresentation = () => {
    if (!presentation) return;
    
    // Simulate export functionality
    showSuccess("Presentation exported successfully!");
  };

  const handleStartPresentation = () => {
    setIsPresenting(true);
    setCurrentSlide(0);
  };

  const handleStopPresentation = () => {
    setIsPresenting(false);
  };

  const nextSlide = () => {
    if (presentation && currentSlide < presentation.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  if (isPresenting && presentation) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Presentation Header */}
        <div className="flex justify-between items-center p-4 bg-gray-900">
          <div>
            <h1 className="text-xl font-bold">{presentation.title}</h1>
            <p className="text-sm text-gray-400">Slide {currentSlide + 1} of {presentation.slides.length}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStopPresentation}
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Exit Presentation
          </Button>
        </div>

        {/* Slide Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-4xl w-full text-center">
            <h2 className="text-4xl font-bold mb-8">
              {presentation.slides[currentSlide].title}
            </h2>
            <div className="text-xl leading-relaxed whitespace-pre-line">
              {presentation.slides[currentSlide].content}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center p-4 bg-gray-900">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Previous
          </Button>
          <div className="flex space-x-2">
            {presentation.slides.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentSlide ? 'bg-white' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentSlide === presentation.slides.length - 1}
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Presentation className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold">AI Presentation Generator</h1>
        </div>
        <p className="text-muted-foreground">
          Create professional presentations with AI-powered content generation
        </p>
      </div>

      {!presentation ? (
        /* Input Form */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Presentation Details
            </CardTitle>
            <CardDescription>
              Provide details about your presentation and let AI create the content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Presentation Topic *</label>
                <Input
                  placeholder="e.g., Artificial Intelligence in Healthcare"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Audience</label>
                <Input
                  placeholder="e.g., Business executives, Students, General public"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  placeholder="10"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Presentation Style</label>
                <select
                  className="w-full p-2 border border-input rounded-md bg-background"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  <option value="">Select a style</option>
                  {presentationStyles.map((styleOption) => (
                    <option key={styleOption.value} value={styleOption.value}>
                      {styleOption.label} - {styleOption.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              variant="gradient"
              onClick={handleGeneratePresentation}
              disabled={isGenerating || !topic.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Presentation...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Presentation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Presentation Preview */
        <div className="space-y-6">
          {/* Presentation Info */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Presentation className="h-5 w-5 text-purple-500" />
                    {presentation.title}
                  </CardTitle>
                  <CardDescription>{presentation.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartPresentation}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPresentation}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {presentation.targetAudience}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {presentation.duration} minutes
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {presentation.slides.length} slides
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  {presentation.theme}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Slides Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presentation.slides.map((slide, index) => (
              <Card
                key={slide.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  currentSlide === index ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setCurrentSlide(index)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {slide.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>
                  <CardTitle className="text-sm">{slide.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {slide.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Current Slide Details */}
          {presentation.slides[currentSlide] && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Slide {currentSlide + 1}: {presentation.slides[currentSlide].title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Content:</h4>
                  <div className="bg-muted p-4 rounded-lg whitespace-pre-line">
                    {presentation.slides[currentSlide].content}
                  </div>
                </div>
                {presentation.slides[currentSlide].notes && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Speaker Notes:
                    </h4>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-sm">
                      {presentation.slides[currentSlide].notes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setPresentation(null)}
            >
              Create New Presentation
            </Button>
            <Button
              variant="gradient"
              onClick={handleStartPresentation}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Presentation
            </Button>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">AI-Powered Content</h3>
            <p className="text-sm text-muted-foreground">
              Generate engaging presentation content using advanced AI
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Presentation className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Professional Templates</h3>
            <p className="text-sm text-muted-foreground">
              Choose from various professional presentation styles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Download className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Export & Share</h3>
            <p className="text-sm text-muted-foreground">
              Export presentations in multiple formats for easy sharing
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
