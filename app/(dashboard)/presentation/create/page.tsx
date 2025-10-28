"use client";

import { WorkflowProvider } from "@/lib/presentation-workflow-context";
import { PresentationWorkflow } from "@/components/presentation/PresentationWorkflow";

export default function CreatePresentationPage() {
  return (
    <WorkflowProvider>
      <PresentationWorkflow />
    </WorkflowProvider>
  );
}


























