"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Presentation, 
  FileText, 
  Palette, 
  Download,
  CheckCircle,
  Circle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useWorkflow } from '@/lib/presentation-workflow-context';
import { InputStep } from './steps/InputStep';
import { OutlineStep } from './steps/OutlineStep';
import { ContentStep } from './steps/ContentStep';
import { TemplateStep } from './steps/TemplateStep';
import { GenerationStep } from './steps/GenerationStep';
import { useNotifications } from '@/lib/notifications';

const steps = [
  {
    id: 1,
    title: 'Input & Configuration',
    description: 'Provide your presentation topic and preferences',
    icon: FileText,
    color: 'bg-blue-500',
  },
  {
    id: 2,
    title: 'Review Outline',
    description: 'Review and edit the AI-generated outline',
    icon: Presentation,
    color: 'bg-green-500',
  },
  {
    id: 3,
    title: 'Review Content',
    description: 'Review and edit the generated content',
    icon: FileText,
    color: 'bg-teal-500',
  },
  {
    id: 4,
    title: 'Choose Template',
    description: 'Select a design template for your presentation',
    icon: Palette,
    color: 'bg-purple-500',
  },
  {
    id: 5,
    title: 'Generate & Download',
    description: 'Generate PowerPoint and download your presentation',
    icon: Download,
    color: 'bg-orange-500',
  },
];

export function PresentationWorkflow() {
  const { state, dispatch, getStepStatus, canProceedToStep } = useWorkflow();
  const { showError } = useNotifications();

  const handleStepChange = (step: number) => {
    if (canProceedToStep(step)) {
      dispatch({ type: 'SET_STEP', payload: step });
    } else {
      showError('Please complete the current step before proceeding');
    }
  };

  const handlePrevious = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };

  const handleNext = () => {
    if (canProceedToStep(state.currentStep + 1)) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 1:
        return <InputStep />;
      case 2:
        return <OutlineStep />;
      case 3:
        return <ContentStep />;
      case 4:
        return <TemplateStep />;
      case 5:
        return <GenerationStep />;
      default:
        return <InputStep />;
    }
  };

  const getProgressPercentage = () => {
    return (state.currentStep / steps.length) * 100;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                Step {state.currentStep} of {steps.length}
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              const isClickable = canProceedToStep(step.id) || status === 'completed';
              
              return (
                <div
                  key={step.id}
                  className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    status === 'current'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                      : status === 'completed'
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : isClickable
                      ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 opacity-50'
                  }`}
                  onClick={() => isClickable && handleStepChange(step.id)}
                >
                  {/* Step Number */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        status === 'current'
                          ? 'bg-purple-500'
                          : status === 'completed'
                          ? 'bg-green-500'
                          : isClickable
                          ? 'bg-gray-400'
                          : 'bg-gray-300'
                      }`}
                    >
                      {status === 'completed' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>
                    {status === 'current' && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>

                  {/* Step Icon */}
                  <div className="flex justify-center mb-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        status === 'current'
                          ? 'bg-purple-100 dark:bg-purple-900'
                          : status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          status === 'current'
                            ? 'text-purple-600 dark:text-purple-400'
                            : status === 'completed'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="text-center">
                    <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>

                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gray-200 dark:bg-gray-700 transform -translate-y-1/2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[state.currentStep - 1].icon, {
              className: "h-5 w-5 text-purple-500"
            })}
            {steps[state.currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={state.currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {state.isGenerating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
              Processing...
            </div>
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={!canProceedToStep(state.currentStep + 1) || state.isGenerating}
          className="flex items-center gap-2"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Display */}
      {state.error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Circle className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">Error: {state.error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
