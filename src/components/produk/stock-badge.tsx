"use client";

interface Props {
  stock: number;
  minStock: number;
}

export default function StockBadge({ stock, minStock }: Props) {
  if (stock === 0) {
    return (
      <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-label-md font-medium">
        Habis
      </span>
    );
  }
  if (stock <= minStock) {
    return (
      <span className="bg-warning-debt/10 text-warning-debt px-3 py-1 rounded-full text-label-md font-medium">
        Stok Tipis
      </span>
    );
  }
  return (
    <span className="bg-success-paid/10 text-success-paid px-3 py-1 rounded-full text-label-md font-medium">
      Tersedia
    </span>
  );
}
