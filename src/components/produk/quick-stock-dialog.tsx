"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProductStore } from "@/stores/use-product-store";
import type { Product } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export default function QuickStockDialog({ open, onOpenChange, product }: Props) {
  const [qty, setQty] = useState("1");
  const quickAddStock = useProductStore((s) => s.quickAddStock);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !qty) return;
    await quickAddStock(product.id, Number(qty));
    onOpenChange(false);
    setQty("1");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card rounded-xl max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-headline-md font-bold">
            Tambah Stok
          </DialogTitle>
          {product && (
            <DialogDescription className="text-on-surface-variant">
              {product.name} — Stok saat ini: {product.stock}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-label-md text-on-surface-variant block mb-1">
              Jumlah tambahan
            </label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
              placeholder="1"
              min="1"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full h-touch-target-min bg-secondary text-on-secondary rounded-xl font-bold text-body-lg"
          >
            Simpan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
