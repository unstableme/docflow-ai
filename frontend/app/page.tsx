"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FileText, CheckCircle2, AlertTriangle, DollarSign,
  Upload, Bot, ArrowRight, TrendingUp, Zap, PenLine,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentUploads } from "@/components/dashboard/RecentUploads";
import { getDashboardStats, listDocuments } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { DashboardStats, Document } from "@/types";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      listDocuments({ sort: "date_desc" }),
    ]).then(([s, docs]) => {
      setStats(s);
      setRecent(docs.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-8">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 mb-3">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold text-primary">AI Finance Intelligence</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {getGreeting()} 👋
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Here&apos;s what&apos;s happening with your financial documents today.
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-3 shrink-0">
            <Link
              href="/upload"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Link>
            <Link
              href="/manual"
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <PenLine className="h-4 w-4" />
              Manual Entry
            </Link>
            <Link
              href="/ai"
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <Bot className="h-4 w-4" />
              Ask AI
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          className="animate-fade-in stagger-1"
          title="Total Documents"
          value={loading ? "—" : stats?.totalDocuments ?? 0}
          subtitle="All uploaded files"
          icon={FileText}
          accent="indigo"
        />
        <StatsCard
          className="animate-fade-in stagger-2"
          title="Approved"
          value={loading ? "—" : stats?.processedDocuments ?? 0}
          subtitle="Ready for reporting"
          icon={CheckCircle2}
          accent="green"
          trend={stats ? { value: `${Math.round(stats.totalDocuments ? (stats.processedDocuments / stats.totalDocuments) * 100 : 0)}% finalized`, positive: true } : undefined}
        />
        <StatsCard
          className="animate-fade-in stagger-3"
          title="Flagged"
          value={loading ? "—" : stats?.flaggedDocuments ?? 0}
          subtitle="Needs review"
          icon={AlertTriangle}
          accent="amber"
        />
        <StatsCard
          className="animate-fade-in stagger-4"
          title="Total Billed"
          value={loading ? "—" : stats ? formatCurrency(stats.totalBilledAmount, stats.currency) : "$0"}
          subtitle="Sum of extracted amounts"
          icon={DollarSign}
          accent="indigo"
        />
      </div>

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent uploads */}
          <div className="animate-fade-in">
            <RecentUploads documents={recent} />
          </div>
        </div>

        {/* Right Column — 1 col */}
        <div className="space-y-6 animate-fade-in stagger-3">
          {/* Quick links */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold text-foreground px-1">Quick Navigation</p>
            {[
              { href: "/upload",    label: "Upload new documents",     icon: Upload,    desc: "PDF, JPG, PNG up to 20MB" },
              { href: "/manual",    label: "Manual data entry",        icon: PenLine,   desc: "Type information yourself" },
              { href: "/documents", label: "Browse all documents",     icon: FileText,  desc: "Search, filter, sort" },
              { href: "/ai",        label: "AI Query assistant",       icon: Bot,       desc: "Ask natural language questions" },
            ].map(({ href, label, icon: Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3.5 hover:bg-accent hover:border-primary/30 transition-all group"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>

          {/* Status breakdown */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">AI Processing Efficiency</p>
            </div>
            <div className="space-y-4">
              {[
                { label: "Approved",  value: stats?.processedDocuments ?? 0, total: stats?.totalDocuments ?? 1, color: "bg-green-500", glow: "shadow-[0_0_10px_rgba(34,197,94,0.3)]" },
                { label: "Flagged",    value: stats?.flaggedDocuments ?? 0,   total: stats?.totalDocuments ?? 1, color: "bg-amber-500", glow: "shadow-[0_0_10px_rgba(245,158,11,0.3)]" },
                { label: "Pending",    value: (stats?.totalDocuments ?? 0) - (stats?.processedDocuments ?? 0) - (stats?.flaggedDocuments ?? 0), total: stats?.totalDocuments ?? 1, color: "bg-indigo-500", glow: "shadow-[0_0_10px_rgba(99,102,241,0.3)]" },
              ].map(({ label, value, total, color, glow }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium">{label}</span>
                    <span className="font-bold text-foreground">{value} <span className="text-[10px] text-muted-foreground font-normal">({Math.round(total ? (value / total) * 100 : 0)}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${color} ${glow}`}
                      style={{ width: `${total ? (value / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                DocFlow AI automatically flags documents with confidence scores below 75% for manual review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

