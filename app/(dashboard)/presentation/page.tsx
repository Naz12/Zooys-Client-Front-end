"use client";

import { WorkflowProvider } from "@/lib/presentation-workflow-context";
import { PresentationWorkflow } from "@/components/presentation/PresentationWorkflow";

export default function PresentationPage() {
  return (
    <WorkflowProvider>
      <PresentationWorkflow />
    </WorkflowProvider>
  );
}
