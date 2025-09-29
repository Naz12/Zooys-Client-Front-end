"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Plus } from "lucide-react";

const diagrams = [
  { title: "Flowchart", img: "/diagrams/flowchart.png" },
  { title: "Sequence Diagram", img: "/diagrams/sequence.png" },
  { title: "Class Diagram", img: "/diagrams/class.png" },
  { title: "Pie Chart", img: "/diagrams/pie.png" },
  { title: "Quadrant Chart", img: "/diagrams/quadrant.png" },
  { title: "ER Diagram", img: "/diagrams/er.png" },
];

export default function DiagramCard() {
  return (
    <Card className="bg-card border border-border rounded-xl shadow-md">
      <CardContent className="p-6 space-y-6">
        {/* Header with create button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI Diagram Templates</h2>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2">
            <Plus size={16} /> Create Diagram
          </Button>
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {diagrams.map((d, idx) => (
            <div
              key={idx}
              className="relative rounded-lg overflow-hidden border border-border bg-background shadow-sm hover:shadow-md transition cursor-pointer"
            >
              {/* Preview image */}
              <img
                src={d.img}
                alt={d.title}
                className="w-full aspect-square object-cover"
              />

              {/* Title overlay */}
              <div className="absolute bottom-0 w-full bg-black/60 text-white text-center py-2 text-sm font-medium">
                {d.title}
              </div>

              {/* External link icon */}
              <span className="absolute top-2 right-2 bg-black/60 p-1 rounded">
                <ExternalLink size={14} className="text-white" />
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
