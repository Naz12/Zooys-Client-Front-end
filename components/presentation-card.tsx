"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Box, Infinity } from "lucide-react";

export default function PresentationCard() {
  return (
    <Card className="bg-card border border-border rounded-2xl shadow-lg transition hover:shadow-xl">
      <CardContent className="p-12 space-y-16 text-center">
        {/* Hero Section */}
        <div className="space-y-6">
          {/* Illustration placeholder */}
          <div className="flex justify-center">
            <div className="w-52 h-32 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-dashed border-indigo-400/40 rounded-xl flex items-center justify-center text-lg text-muted-foreground shadow-inner hover:shadow-md transition">
              🎨 Illustration
            </div>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight">
            AI-Powered Presentations
          </h2>

          <p className="text-base text-muted-foreground/90 max-w-lg mx-auto leading-relaxed">
            Start building stunning, AI-assisted presentations in just a few
            clicks. Save time, inspire creativity, and deliver impact with ease.
          </p>

          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-full shadow-lg transition hover:scale-[1.02]">
            ➕ Create Presentation
          </Button>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              icon: Bot,
              title: "Intelligent Content",
              desc: "Generate relevant slide content instantly from your input — no more blank slides.",
            },
            {
              icon: Box,
              title: "Template Library",
              desc: "Explore professional templates designed for business, education, and creative projects.",
            },
            {
              icon: Infinity,
              title: "Cloud Sharing",
              desc: "Store, edit, and share your presentations anywhere, anytime with seamless cloud access.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="group flex flex-col items-center text-center space-y-4 p-6 rounded-xl border border-border bg-background/40 hover:border-indigo-400/40 hover:shadow-lg transition duration-300 animate-fade-in-up"
              style={{
                animationDelay: `${idx * 0.15}s`,
                animationFillMode: "backwards",
              }}
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center shadow-md transform transition group-hover:scale-110">
                <item.icon className="text-white" size={26} />
              </div>
              <h4 className="font-semibold text-lg">{item.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
