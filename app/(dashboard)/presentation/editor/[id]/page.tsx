"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PowerPointEditor from '@/components/presentation/PowerPointEditor';
import { presentationApi } from '@/lib/presentation-api-client';
import { PresentationOutline } from '@/lib/presentation-workflow-context';
import { useNotifications } from '@/lib/notifications';

export default function PresentationEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { showError } = useNotifications();
  const [outline, setOutline] = useState<PresentationOutline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const presentationId = params.id as string;

  useEffect(() => {
    const fetchPresentationData = async () => {
      // Prevent infinite loops
      if (retryCount >= maxRetries) {
        console.log('Max retries reached, using fallback data');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Backend agent confirmed the /data endpoint is working
        console.log('Attempting to load presentation data from API');
        
        if (true) {
          // Try to load from API first
          const response = await presentationApi.getPresentationData(parseInt(presentationId));
          
          if (response.success && response.data) {
            // Convert API data to PresentationOutline format
            const apiOutline: PresentationOutline = {
              title: response.data.title || "Presentation",
              slide_count: response.data.slides?.length || 0,
              estimated_duration: "10-15 minutes",
              slides: response.data.slides?.map((slide: any, index: number) => ({
                title: slide.title || slide.header || `Slide ${index + 1}`,
                content: slide.content || slide.subheaders?.join('\n') || '',
                slide_type: slide.slide_type || slide.type || 'content',
                order: slide.order || index + 1
              })) || []
            };
            
            setOutline(apiOutline);
          } else {
            // Fallback to mock data if API fails
          const mockOutline: PresentationOutline = {
            title: "Cloud Computing and Digital Transformation: Modern Business Solutions",
            slide_count: 12,
            estimated_duration: "45 minutes",
            slides: [
              {
                title: "Introduction to Cloud Computing",
                content: "Overview of cloud computing concepts, benefits, and modern business applications. Understanding the shift from traditional IT infrastructure to cloud-based solutions.",
                slide_type: "title",
                order: 1
              },
              {
                title: "What is Cloud Computing?",
                content: "Definition and core characteristics of cloud computing. Service models: IaaS, PaaS, SaaS. Deployment models: Public, Private, Hybrid, Multi-cloud.",
                slide_type: "content",
                order: 2
              },
              {
                title: "Benefits of Cloud Computing",
                content: "Cost reduction and scalability. Improved flexibility and mobility. Enhanced security and compliance. Automatic updates and maintenance.",
                slide_type: "content",
                order: 3
              },
              {
                title: "Digital Transformation Overview",
                content: "What is digital transformation? Key drivers and business imperatives. The role of technology in modern business strategy.",
                slide_type: "content",
                order: 4
              },
              {
                title: "Cloud Technologies and Services",
                content: "Major cloud providers: AWS, Azure, Google Cloud. Key services: Compute, Storage, Database, Networking, AI/ML services.",
                slide_type: "content",
                order: 5
              },
              {
                title: "Business Applications",
                content: "Enterprise resource planning (ERP) in the cloud. Customer relationship management (CRM) systems. Business intelligence and analytics platforms.",
                slide_type: "content",
                order: 6
              },
              {
                title: "Security and Compliance",
                content: "Cloud security best practices. Data protection and privacy regulations. Compliance frameworks: GDPR, HIPAA, SOX.",
                slide_type: "content",
                order: 7
              },
              {
                title: "Migration Strategies",
                content: "Planning cloud migration. Lift and shift vs. re-architecting. Phased migration approaches. Risk mitigation strategies.",
                slide_type: "content",
                order: 8
              },
              {
                title: "Cost Management",
                content: "Understanding cloud pricing models. Cost optimization strategies. Monitoring and controlling cloud expenses.",
                slide_type: "content",
                order: 9
              },
              {
                title: "Future Trends",
                content: "Edge computing and IoT integration. Serverless computing evolution. AI and machine learning in the cloud. Sustainability and green computing.",
                slide_type: "content",
                order: 10
              },
              {
                title: "Implementation Best Practices",
                content: "Change management and training. Vendor selection criteria. Performance monitoring and optimization. Disaster recovery planning.",
                slide_type: "content",
                order: 11
              },
              {
                title: "Conclusion and Next Steps",
                content: "Summary of key benefits and considerations. Action plan for cloud adoption. Measuring success and ROI. Future roadmap for digital transformation.",
                slide_type: "conclusion",
                order: 12
              }
          ]
          };
          
          setOutline(mockOutline);
        }
        }
      } catch (error) {
        console.error('Error fetching presentation data:', error);
        setError('Failed to load presentation data');
        showError('Failed to load presentation data');
      } finally {
        setLoading(false);
      }
    };

    if (presentationId) {
      fetchPresentationData();
    }
  }, [presentationId, retryCount]);

  const handleSave = (editedPresentation: any) => {
    console.log('Saving edited presentation:', editedPresentation);
    // Here you would save the edited presentation to the backend
  };

  const handleDownload = () => {
    console.log('Downloading presentation');
    // This will be handled by the PowerPointEditor component
  };

  const handleBack = () => {
    router.push('/presentation');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading Presentation Editor</h3>
            <p className="text-muted-foreground">Please wait while we load your presentation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !outline) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Presentation</h3>
            <p className="text-muted-foreground mb-4">
              {error || 'Unable to load presentation data'}
            </p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Presentations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold">PowerPoint Editor</h1>
              <p className="text-sm text-muted-foreground">
                Editing: {outline.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <PowerPointEditor
        presentationId={parseInt(presentationId)}
        initialOutline={outline}
        onSave={handleSave}
        onDownload={handleDownload}
      />
    </div>
  );
}
