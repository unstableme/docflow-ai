"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, FileText, Calendar, DollarSign,
  Tag, Building2, Percent, ExternalLink, ShieldCheck, Edit2, Save, X, PenLine, Plus, Trash2, ListTree
} from "lucide-react";
import { StatusBadge, TypeBadge } from "@/components/documents/DocumentBadge";
import { RadialProgress } from "@/components/documents/RadialProgress";
import { formatCurrency, formatDate } from "@/lib/format";
import { getDocument, updateDocument } from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import type { Document, ExpenseMetadata, ExpenseItem } from "@/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const BACK_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const searchParams = useSearchParams();
  
  const [doc, setDoc]     = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ExpenseMetadata | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const addEditLineItem = () => {
    if (!editData) return;
    const newItem: ExpenseItem = {
      description: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    setEditData({
      ...editData,
      line_items: [...(editData.line_items || []), newItem]
    });
  };

  const removeEditLineItem = (index: number) => {
    if (!editData) return;
    setEditData({
      ...editData,
      line_items: editData.line_items?.filter((_, i) => i !== index)
    });
  };

  const updateEditLineItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    if (!editData) return;
    const newItems = [...(editData.line_items || [])];
    let val = value;
    
    if (field === 'quantity' || field === 'unit_price' || field === 'total_price') {
      if (value === "") {
        val = undefined as any;
      } else {
        val = parseFloat(value as string);
        if (isNaN(val as number)) val = undefined as any;
      }
    }
    
    newItems[index] = { ...newItems[index], [field]: val };
    
    // Auto-calc total price if quantity and unit_price are valid numbers
    if ((field === 'quantity' || field === 'unit_price') && 
        newItems[index].quantity != null && 
        newItems[index].unit_price != null) {
      newItems[index].total_price = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
    }
    
    setEditData({ ...editData, line_items: newItems });
  };

  useEffect(() => {
    getDocument(id)
      .then((d) => {
        setDoc(d);
        setEditData(d.metadata as ExpenseMetadata); // cast to avoid nullable typing issue if it's null on fetch, we'll handle gracefully
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (searchParams.get("edit") === "true") {
      setIsEditing(true);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-6 w-40 rounded bg-muted/60" />
        <div className="h-48 rounded-2xl bg-muted/40" />
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 h-96 rounded-2xl bg-muted/40" />
          <div className="col-span-2 h-96 rounded-2xl bg-muted/40" />
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <FileText className="h-16 w-16 text-muted-foreground/20" />
        <p className="text-muted-foreground font-medium">Document not found</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-primary hover:text-primary/80 font-medium"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const handleApprove = async () => {
    if (!doc || !editData) return;
    setIsApproving(true);
    try {
      const updated = await updateDocument(doc.id, { status: "approved", metadata: editData });
      setDoc(updated);
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to approve document:", e);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!doc || !editData) return;
    setIsSaving(true);
    try {
      const updated = await updateDocument(doc.id, { metadata: editData });
      setDoc(updated);
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save edits:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const m = isEditing ? editData : doc.metadata;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Back + title */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 pr-4">
            <h2 className="text-xl font-bold text-foreground truncate leading-tight">
              {doc.metadata?.vendor_name ?? doc.filename}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="truncate max-w-[200px]">{doc.filename}</span>
              <span>•</span>
              <span className="font-mono">{doc.id}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {doc.status !== "approved" && (
            <button 
              onClick={handleApprove}
              disabled={isApproving}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isApproving ? "Approving..." : "Approve Draft"}
            </button>
          )}
          {doc.status === "approved" && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/20 text-emerald-600 px-4 py-2 text-xs font-semibold border border-emerald-500/30">
              <ShieldCheck className="h-4 w-4" />
              Approved
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-32 h-32 text-primary" />
        </div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            {m && <RadialProgress value={m.confidence_score} size={90} strokeWidth={10} />}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={doc.status} />
                <TypeBadge type={doc.document_type} />
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Document processed with <span className="text-foreground font-semibold">{m ? Math.round(m.confidence_score * 100) : 0}% confidence</span>. 
                {doc.status === "approved" ? " Finalized and locked for reporting." : " Requires manual review and approval."}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:items-end">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Total Amount</p>
            <h3 className="text-4xl font-bold text-foreground tracking-tight">
              {m?.total_amount != null 
                ? formatCurrency(m.total_amount, m.currency) 
                : <span className="text-muted-foreground opacity-50">—</span>
              }
            </h3>
            {m?.tax_amount != null && (
              <p className="text-sm text-muted-foreground mt-1">
                Tax: {formatCurrency(m.tax_amount, m.currency)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column — 3 cols */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-foreground">Extracted Metadata</p>
                {!isEditing && (doc.status !== "approved" || doc.filename?.startsWith("manual_entry")) && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" /> Edit Mode
                  </button>
                )}
                {isEditing && (
                  <button 
                    onClick={() => {
                      setEditData(doc.metadata as ExpenseMetadata);
                      setIsEditing(false);
                    }}
                    className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Cancel
                  </button>
                )}
              </div>
              <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                AI Confidence High
              </span>
            </div>

            {!m ? (
              <div className="flex flex-col items-center py-12 gap-3 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Extraction in progress…</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                {[
                  { icon: Building2, label: "Merchant/Vendor", value: m.vendor_name, key: "vendor_name" },
                  { icon: Calendar,  label: "Billing Date",    value: m.transaction_date ? formatDate(m.transaction_date) : null, key: "transaction_date", type: "date" },
                  { icon: Tag,       label: "Category",       value: m.category, key: "category" },
                  { icon: DollarSign,label: "Currency",       value: m.currency, key: "currency" },
                  { icon: Percent,   label: "Tax Rate (Est)",  value: m.tax_amount && m.total_amount ? `${Math.round((m.tax_amount / m.total_amount) * 100)}%` : null, readonly: true },
                  { icon: Calendar,  label: "Upload Date",    value: formatDate(doc.uploaded_at), readonly: true },
                ].map(({ icon: Icon, label, value, key, type, readonly }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </div>
                    {isEditing && !readonly && key ? (
                      <Input
                        type={type || "text"}
                        value={(editData as any)?.[key] || ""}
                        onChange={(e) => setEditData({ ...editData, [key]: e.target.value } as ExpenseMetadata)}
                        className="h-8 text-sm bg-muted/20"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-foreground pl-5.5">{value ?? "—"}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {isEditing && (
              <div className="mt-8 pt-4 border-t border-border/50 flex justify-end">
                 <button 
                  onClick={handleSaveEdits}
                  disabled={isSaving}
                  className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          {/* Line items */}
          {m && (m.line_items?.length > 0 || isEditing) && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ListTree className="h-4 w-4 text-primary" /> Line Item Breakdown
                </p>
                {isEditing && (
                  <button 
                    onClick={addEditLineItem}
                    className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                )}
              </div>
              <div className="divide-y divide-border">
                {(isEditing ? editData?.line_items : m.line_items)?.map((item, i) => (
                  <div key={i} className={cn(
                    "relative group px-6 py-4 text-sm transition-colors",
                    isEditing ? "bg-muted/5 hover:bg-muted/10" : "hover:bg-muted/10"
                  )}>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Item #{i + 1}</span>
                           <button 
                            onClick={() => removeEditLineItem(i)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors bg-muted/20 rounded-md"
                            title="Remove line item"
                           >
                            <Trash2 className="h-3.5 w-3.5" />
                           </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-4">
                          <div className="md:col-span-7 space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Description</label>
                            <Input 
                              placeholder="Item name or service..."
                              value={item.description}
                              onChange={(e) => updateEditLineItem(i, 'description', e.target.value)}
                              className="h-9 text-xs bg-card"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Qty</label>
                            <Input 
                              type="number"
                              min="1"
                              value={item.quantity ?? ""}
                              onChange={(e) => updateEditLineItem(i, 'quantity', e.target.value)}
                              className="h-9 text-xs bg-card text-center"
                            />
                          </div>
                          <div className="md:col-span-3 space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 text-right block">Total Price</label>
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.total_price ?? ""}
                              onChange={(e) => updateEditLineItem(i, 'total_price', e.target.value)}
                              className="h-9 text-xs bg-card font-bold text-right"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-[1fr_auto_auto] gap-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground font-medium">{item.description}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">Description</span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 min-w-[60px]">
                          <span className="text-foreground">{item.quantity}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">Qty</span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 min-w-[100px]">
                          <span className="text-foreground font-bold">{formatCurrency(item.total_price, m.currency)}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">Total</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isEditing && (editData?.line_items?.length === 0) && (
                   <div className="px-6 py-12 text-center">
                    <p className="text-xs text-muted-foreground italic">No line items currently attached. Click "Add Item" to begin.</p>
                   </div>
                )}
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-primary/5">
                <span className="text-sm font-bold text-foreground">Final Extracted Total</span>
                <span className="text-lg font-black text-primary tracking-tight">
                  {formatCurrency(m.total_amount ?? 0, m.currency)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* File preview - Flip Card effect */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">Original Document</p>
            
            {doc.filename?.startsWith("manual_entry") ? (
              <div className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border shadow-sm">
                      <PenLine className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div>
                      <p className="text-sm font-bold text-foreground">Manual Entry</p>
                      <p className="text-xs text-muted-foreground/80 mt-2 max-w-[200px] leading-relaxed mx-auto">
                          This document was entered manually. There is no original source file available for preview.
                      </p>
                  </div>
              </div>
            ) : (
              <div className="perspective-1000 w-full aspect-[3/4]">
                <div 
                className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : 'cursor-pointer group'}`}
                onClick={() => !isFlipped && setIsFlipped(true)}
              >
                {/* Front */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-2xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-4 text-center p-8 transition-all hover:bg-muted/30">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border shadow-sm group-hover:scale-110 transition-transform">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-muted-foreground">Original Document</p>
                    <p className="text-xs text-muted-foreground/60 mt-2 leading-relaxed">
                      Click to flip and see the original document.
                    </p>
                  </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border border-border bg-white overflow-hidden shadow-lg flex flex-col">
                  <div className="flex items-center justify-between p-2 border-b border-border bg-zinc-100">
                    <span className="text-xs font-semibold text-zinc-800 px-2 flex items-center gap-2">
                       <FileText className="h-3 w-3" /> {doc.filename}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                      className="text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-800 px-2 py-1 bg-zinc-200/50 rounded hover:bg-zinc-200 transition-colors"
                    >
                      Close Flip
                    </button>
                  </div>
                  <div className="flex-1 w-full bg-zinc-100/50">
                    {/* Embedded file preview using iframe */}
                    <iframe 
                      src={`${BACK_URL}/documents/${doc.id}/file`} 
                      className="w-full h-full border-0"
                      title="Document Preview"
                    />
                  </div>
                  </div>
                </div>
              </div>
            )}
            </div>

          {/* Raw JSON */}
          {m && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-foreground">Raw Data Output</p>
                <button 
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(m, null, 2))}
                  className="text-[10px] font-bold text-primary uppercase hover:underline"
                >
                  Copy JSON
                </button>
              </div>
              <pre className="text-[10px] text-muted-foreground overflow-auto scrollbar-thin max-h-[300px] leading-relaxed rounded-xl bg-zinc-950/50 border border-border p-4 font-mono">
                {JSON.stringify(m, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
