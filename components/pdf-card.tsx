"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Trash2 } from "lucide-react";

type PdfDoc = {
  id: number;
  title: string;
  date: string;
};

export default function PdfCard() {
  const [activeTab, setActiveTab] = useState("chat");
  const [pdfs, setPdfs] = useState<PdfDoc[]>([]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newPdf: PdfDoc = {
      id: Date.now(),
      title: file.name,
      date: new Date().toLocaleDateString(),
    };

    setPdfs([newPdf, ...pdfs]);
  };

  const handleDelete = (id: number) => {
    setPdfs(pdfs.filter((pdf) => pdf.id !== id));
  };

  return (
    <Card className="bg-card border border-border rounded-2xl shadow-lg transition hover:shadow-xl">
      <CardContent className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <FileText size={20} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold">
            AI PDF –{" "}
            <span className="text-indigo-500">Smart PDF Assistant</span>
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 justify-center">
          {["chat", "translate", "convert"].map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={activeTab === tab ? "default" : "outline"}
              className={`rounded-full text-sm px-5 ${
                activeTab === tab
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                  : "border border-border hover:bg-muted/30"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "chat" && "💬 Chat & Summarize"}
              {tab === "translate" && "🌍 Translate"}
              {tab === "convert" && "🔄 Convert"}
            </Button>
          ))}
        </div>

        {/* Upload area */}
        <div className="border-2 border-dashed border-indigo-500/50 rounded-xl p-10 text-center space-y-4 hover:border-indigo-400 transition">
          <FileText size={42} className="mx-auto text-red-500" />
          <p className="text-sm text-muted-foreground">
            Upload or drag your PDF here.
          </p>
          <p className="text-xs text-muted-foreground">Max 50MB</p>

          {/* Hidden file input */}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            id="pdfUpload"
            onChange={handleFileUpload}
          />
          <label htmlFor="pdfUpload">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 py-2">
              📂 Upload PDF
            </Button>
          </label>
        </div>

        {/* Recent PDFs */}
        {pdfs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Recent Uploads
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {pdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="relative bg-background border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col space-y-2"
                >
                  <div className="flex items-center gap-2 text-red-500">
                    <FileText size={18} />
                    <span className="text-xs font-medium text-blue-400">
                      Uploaded
                    </span>
                  </div>
                  <p className="text-sm font-medium line-clamp-2">
                    {pdf.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{pdf.date}</p>
                  <button
                    onClick={() => handleDelete(pdf.id)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
