import { Youtube, FileText, MessageCircle, PenTool, Calculator, BookOpen, Network, ArrowRight, Sparkles, Presentation, FileUp } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to AI Dashboard</h1>
        <p className="text-muted-foreground">
          Access powerful AI tools for content creation, analysis, and learning
        </p>
      </div>

      {/* AI Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Summarization Tools */}
        <Card className="bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <FileText size={20} className="text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Summarizer</h3>
                <p className="text-sm text-muted-foreground">Summarize any content</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Extract key insights from YouTube videos, PDFs, links, and text with AI-powered summarization.
            </p>
            <Link href="/summarizer">
              <Button variant="info" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Open Summarizer
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* YouTube Summarizer */}
        <Card className="bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Youtube size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">YouTube Summarizer</h3>
                <p className="text-sm text-muted-foreground">Extract video insights</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get instant summaries of YouTube videos with key points, timestamps, and transcripts.
            </p>
            <Link href="/youtube-summarizer">
              <Button variant="destructive" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Open YouTube Tool
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* PDF Summarizer */}
        <Card className="bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <FileText size={20} className="text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">PDF Summarizer</h3>
                <p className="text-sm text-muted-foreground">Document analysis</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze PDF documents with intelligent summarization and RAG-powered Q&A capabilities.
            </p>
            <Link href="/pdf-summarizer">
              <Button variant="success" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Open PDF Tool
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Chat */}
        <Card className="bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <MessageCircle size={20} className="text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Chat Assistant</h3>
                <p className="text-sm text-muted-foreground">Intelligent conversations</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Chat with our intelligent AI assistant for questions, explanations, and creative help.
            </p>
            <Link href="/chat">
              <Button variant="success" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Start Chatting
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Writer */}
        <Card className="bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <PenTool size={20} className="text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Writer Assistant</h3>
                <p className="text-sm text-muted-foreground">Content creation</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Generate high-quality content for blogs, emails, stories, and more with AI assistance.
            </p>
            <Link href="/writer">
              <Button variant="gradient" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Start Writing
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Math Solver */}
        <Card className="bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calculator size={20} className="text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Math Solver</h3>
                <p className="text-sm text-muted-foreground">Step-by-step solutions</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Solve complex math problems with detailed step-by-step explanations and solutions.
            </p>
            <Link href="/math-solver">
              <Button variant="info" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Solve Math
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Flashcards */}
        <Card className="bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <BookOpen size={20} className="text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Flashcard Creator</h3>
                <p className="text-sm text-muted-foreground">Study materials</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Generate interactive study flashcards for any topic to enhance your learning experience.
            </p>
            <Link href="/flashcards">
              <Button variant="warning" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Create Flashcards
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Diagram Generator */}
        <Card className="bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Network size={20} className="text-indigo-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Diagram Generator</h3>
                <p className="text-sm text-muted-foreground">Visual diagrams</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Create professional diagrams, flowcharts, and visual representations with AI assistance.
            </p>
            <Link href="/diagrams">
              <Button variant="secondary" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Generate Diagrams
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Presentation */}
        <Card className="bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Presentation size={20} className="text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Presentation</h3>
                <p className="text-sm text-muted-foreground">Create presentations</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Generate professional presentations with AI-powered content, slides, and speaker notes.
            </p>
            <Link href="/presentation">
              <Button variant="gradient" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Create Presentation
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* File Converter */}
        <Card className="bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <FileUp size={20} className="text-indigo-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">File Converter</h3>
                <p className="text-sm text-muted-foreground">Convert & extract</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Convert files between different formats and extract content from documents with AI assistance.
            </p>
            <Link href="/convert-file">
              <Button variant="secondary" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Convert Files
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Section */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-border rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Quick Access</h3>
              <p className="text-muted-foreground">
                Jump to your most used tools or explore new features
              </p>
            </div>
            <div className="flex space-x-2">
              <Link href="/summarizer">
                <Button variant="outline" size="sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  All Tools
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
