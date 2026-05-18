"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { queryAI } from "@/lib/api";
import { MOCK_AI_MESSAGES, AI_SUGGESTION_CHIPS } from "@/lib/mock-data";
import { localId } from "@/lib/format";
import ReactMarkdown from "react-markdown";
import type { AIMessage } from "@/types";

export function ChatPanel() {
  const [messages, setMessages] = useState<AIMessage[]>(MOCK_AI_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: AIMessage = {
      id: localId(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // TODO: This calls queryAI() in lib/api.ts — swap mock for real endpoint there
      const res = await queryAI(userMsg.content);
      const assistantMsg: AIMessage = {
        id: localId(),
        role: "assistant",
        content: res.answer,
        timestamp: res.timestamp,
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: localId(),
          role: "assistant",
          content: "Sorry, I couldn't reach the backend. Please check your connection.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Message thread */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 pb-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                msg.role === "assistant"
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "bg-muted/60 border-border text-muted-foreground"
              }`}
            >
              {msg.role === "assistant"
                ? <Bot className="h-4 w-4" />
                : <User className="h-4 w-4" />
              }
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-card border border-border text-foreground rounded-tl-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mt-1 [&>ul]:ml-4 [&>ul]:list-disc">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-primary/15 border-primary/30 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3">
              <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground">Analysing documents…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length <= 1 && !loading && (
        <div className="flex flex-wrap gap-2 py-3 border-t border-border">
          {AI_SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex gap-3 pt-3 border-t border-border mt-auto">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about your documents…"
          disabled={loading}
          className="flex-1 bg-muted/30 border-border focus-visible:ring-primary/60 text-sm"
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          size="icon"
          className="h-9 w-9 shrink-0 bg-primary hover:bg-primary/90"
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </Button>
      </div>
    </div>
  );
}
