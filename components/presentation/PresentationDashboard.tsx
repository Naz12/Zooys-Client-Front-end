"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Presentation, 
  Calendar,
  Download,
  Edit,
  MoreVertical,
  FileText,
  Clock,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { presentationApi } from '@/lib/presentation-api-client';
import { useNotifications } from '@/lib/notifications';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface PresentationItem {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  tool_type: string;
  slide_count?: number; // Add slide count field
}

export function PresentationDashboard() {
  const router = useRouter();
  const { showError, showSuccess } = useNotifications();
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  useEffect(() => {
    fetchPresentations();
  }, []);

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      const response = await presentationApi.getPresentations(20);
      if (response.success) {
        const presentationsWithSlideCount = await Promise.all(
          response.data.presentations.map(async (presentation) => {
            try {
              // Try to get presentation data to count slides
              const dataResponse = await presentationApi.getPresentationData(presentation.id);
              if (dataResponse.success && dataResponse.data?.slides) {
                return {
                  ...presentation,
                  slide_count: dataResponse.data.slides.length
                };
              }
            } catch (error) {
              console.warn(`Could not fetch slide count for presentation ${presentation.id}:`, error);
            }
            // Fallback: return presentation without slide count
            return {
              ...presentation,
              slide_count: 0
            };
          })
        );
        setPresentations(presentationsWithSlideCount);
      } else {
        showError('Failed to load presentations');
      }
    } catch (error) {
      console.error('Error fetching presentations:', error);
      showError('Failed to load presentations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePresentation = () => {
    router.push('/presentation/create');
  };

  const handleEditPresentation = (id: number) => {
    router.push(`/presentation/editor/${id}`);
  };

  const handleDeletePresentation = (id: number, title: string) => {
    showConfirmation({
      title: 'Delete Presentation',
      description: `Are you sure you want to delete "${title}"? This action cannot be undone and will permanently remove the presentation.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const response = await presentationApi.deletePresentation(id);
          if (response.success) {
            showSuccess('Presentation deleted successfully');
            // Remove the presentation from the local state
            setPresentations(prev => prev.filter(p => p.id !== id));
          } else {
            showError('Failed to delete presentation');
          }
        } catch (error) {
          console.error('Error deleting presentation:', error);
          showError('Failed to delete presentation');
        }
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 -m-4 sm:-m-6 md:-m-10">
      {/* Custom Confirmation Dialog */}
      {ConfirmationDialog}
      
      {/* Fixed Header - Extended to fill gap */}
      <div className="sticky top-0 z-50 bg-background/100 border-b shadow-sm">
        <div className="flex items-center justify-between py-6 px-4 sm:px-6 md:px-10">
          <div>
            <h1 className="text-3xl font-bold">AI Presentation</h1>
            <p className="text-muted-foreground">
              Create and manage AI-generated presentations
            </p>
          </div>
          <Button onClick={handleCreatePresentation} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Presentation</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 sm:px-6 md:px-10">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Presentation className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Presentations</p>
                <p className="text-xl font-bold">{presentations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">
                  {presentations.filter(p => p.status.toLowerCase() === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold">
                  {presentations.filter(p => p.status.toLowerCase() === 'processing').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-purple-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Slides</p>
                <p className="text-xl font-bold">
                  {presentations.reduce((total, p) => total + (p.slide_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Presentations List */}
      <div className="px-4 sm:px-6 md:px-10">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Recent Presentations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : presentations.length === 0 ? (
            <div className="text-center py-8">
              <Presentation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No presentations yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first AI-generated presentation to get started
              </p>
              <Button onClick={handleCreatePresentation}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Presentation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {presentations.map((presentation) => (
                <div
                  key={presentation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Presentation className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{presentation.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {presentation.description || 'AI-generated presentation'}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(presentation.created_at)}</span>
                        </div>
                        {presentation.slide_count !== undefined && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>{presentation.slide_count} slides</span>
                          </div>
                        )}
                        <Badge className={getStatusColor(presentation.status)}>
                          {presentation.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPresentation(presentation.id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePresentation(presentation.id, presentation.title)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
