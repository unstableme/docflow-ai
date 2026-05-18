"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Calendar, Tag, DollarSign, PenLine, Percent, Plus, Trash2, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createManualDocument } from "@/lib/api";
import type { ExpenseMetadata, ExpenseItem } from "@/types";

export default function ManualEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ExpenseMetadata>>({
    vendor_name: "",
    transaction_date: "",
    total_amount: undefined,
    currency: "USD",
    category: "",
    tax_amount: undefined,
    line_items: [],
    confidence_score: 1.0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const doc = await createManualDocument(formData as ExpenseMetadata);
      router.push(`/documents/${doc.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create document");
      setLoading(false);
    }
  };

  const handleNumChange = (field: keyof ExpenseMetadata, val: string) => {
    if (val === "") {
      setFormData(prev => ({ ...prev, [field]: undefined }));
      return;
    }
    const num = parseFloat(val);
    setFormData(prev => ({ ...prev, [field]: isNaN(num) ? undefined : num }));
  };

  const addLineItem = () => {
    const newItem: Partial<ExpenseItem> = {
      description: "",
      quantity: 1,
      unit_price: undefined,
      total_price: undefined
    };
    setFormData(prev => ({
      ...prev,
      line_items: [...(prev.line_items || []), newItem as ExpenseItem]
    }));
  };

  const removeLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items?.filter((_, i) => i !== index)
    }));
  };

  const updateLineItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    setFormData(prev => {
      const newItems = [...(prev.line_items || [])];
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
      
      return { ...prev, line_items: newItems };
    });
  };

  const syncTotalFromItems = () => {
    const total = formData.line_items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
    setFormData(prev => ({ ...prev, total_amount: total }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 border border-primary/20 shadow-sm">
                <PenLine className="h-6 w-6" />
            </div>
            Manual Data Entry
        </h2>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          Enter document details manually. This entry bypasses the document OCR pipeline and will be saved directly into the database as an approved document.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2.5">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Building2 className="h-4 w-4 text-muted-foreground" /> Vendor Name
              </label>
              <Input 
                required 
                placeholder="e.g. Acme Corp" 
                value={formData.vendor_name || ""} 
                onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                className="h-10 bg-muted/30"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" /> Transaction Date
              </label>
              <Input 
                required 
                type="date"
                value={formData.transaction_date || ""} 
                onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                className="h-10 bg-muted/30"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Tag className="h-4 w-4 text-muted-foreground" /> Category
              </label>
              <Input 
                required
                placeholder="e.g. Software Subscriptions" 
                value={formData.category || ""} 
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="h-10 bg-muted/30"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" /> Currency
              </label>
              <Input 
                required
                placeholder="USD" 
                value={formData.currency || "USD"} 
                onChange={(e) => setFormData({...formData, currency: e.target.value.toUpperCase()})}
                className="h-10 bg-muted/30"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" /> Total Amount
              </label>
              <Input 
                required 
                type="number" 
                step="0.01"
                min="0"
                value={formData.total_amount ?? ""} 
                onChange={(e) => handleNumChange('total_amount', e.target.value)}
                className="h-10 bg-muted/30"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Percent className="h-4 w-4 text-muted-foreground" /> Tax Amount
              </label>
              <Input 
                type="number" 
                step="0.01"
                min="0"
                value={formData.tax_amount ?? ""} 
                onChange={(e) => handleNumChange('tax_amount', e.target.value)}
                className="h-10 bg-muted/30"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <label className="text-sm font-bold flex items-center gap-2 text-foreground">
                <ListTree className="h-4 w-4 text-primary" /> Line Items
              </label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={addLineItem}
                className="text-xs text-primary hover:text-primary/80 hover:bg-primary/5 gap-1.5 h-8 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {formData.line_items?.map((item, index) => (
                <div key={index} className="relative rounded-xl border border-border bg-muted/10 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Description</label>
                      <Input
                        placeholder="Item name or service"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="h-9 bg-card text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Qty</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity ?? ""}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        className="h-9 bg-card text-sm"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Total Price</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.total_price ?? ""}
                          onChange={(e) => updateLineItem(index, 'total_price', e.target.value)}
                          className="h-9 bg-card text-sm font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {formData.line_items?.length === 0 && (
                <div className="text-center py-8 rounded-xl border border-dashed border-border/50 bg-muted/5">
                  <p className="text-xs text-muted-foreground">No line items added yet.</p>
                </div>
              )}

              {formData.line_items && formData.line_items.length > 0 && (
                <div className="flex justify-end">
                   <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    onClick={syncTotalFromItems}
                    className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase h-6 px-0"
                  >
                    Use items sum for total amount
                  </Button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 mt-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl font-medium flex items-center gap-2">
              {error}
            </div>
          )}

          <div className="pt-6 mt-6 border-t border-border flex flex-col sm:flex-row justify-end gap-3">
            <Button 
                type="button" 
                variant="outline"
                className="h-11"
                onClick={() => router.push('/')}
                disabled={loading}
            >
              Cancel
            </Button>
            <Button 
                type="submit" 
                disabled={loading} 
                className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 shadow-md shadow-primary/20"
            >
              {loading ? "Saving..." : "Approve & Enter"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
