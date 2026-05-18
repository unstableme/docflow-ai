"use client";

import { Bot, Sparkles, FileText, Zap } from "lucide-react";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { AI_SUGGESTION_CHIPS } from "@/lib/mock-data";

export default function AIPage() {
  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">AI Assistant</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Ask natural language questions about your uploaded financial documents.
          </p>
        </div>

        {/* Capability chips */}
        <div className="hidden sm:flex flex-col gap-1.5 shrink-0">
          {[
            { icon: FileText, text: "Queries documents" },
            { icon: Zap,      text: "AI-powered" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground"
            >
              <Icon className="h-3 w-3" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Chat panel — fills remaining space */}
      <div className="flex-1 rounded-2xl border border-border bg-card p-5 flex flex-col min-h-0" style={{ minHeight: "500px" }}>
        <ChatPanel />
      </div>


    </div>
  );
}
