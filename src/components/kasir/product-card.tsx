"use client";

import { useState, useRef } from "react";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useCartStore } from "@/stores/use-cart-store";
import { useFlyingBallStore } from "@/stores/use-flying-ball-store";
import { Icon } from "@/lib/icon-map";
import StatusBadge from "@/components/shared/status-badge";

export default function ProductCard({ product }: { product: Product }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const throwBall = useFlyingBallStore((s) => s.throwBall);
  const [animating, setAnimating] = useState(false);
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleAdd = () => {
    const fromRect = cardRef.current?.getBoundingClientRect();

    // Tablet → cart panel; Mobile → cart icon
    const isTablet = window.innerWidth >= 768;
    const target = isTablet
      ? (document.querySelector("[data-cart-target]") as HTMLElement | null)
      : (document.querySelector("[data-cart-icon]") as HTMLElement | null);

    let toX = window.innerWidth - 40;
    let toY = 80;
    if (target) {
      const targetRect = target.getBoundingClientRect();
      toX = targetRect.left + targetRect.width / 2;
      toY = targetRect.top + targetRect.height / 2;
    }

    if (fromRect) {
      throwBall(fromRect.left + fromRect.width / 2, fromRect.top + fromRect.height / 2, toX, toY, product.name);
    }

    setAnimating(true);
    addToCart(product);
    setTimeout(() => setAnimating(false), 300);
  };

  const showImage = product.image_url && !imgError;

  const stockLabel =
    product.stock === 0
      ? { text: "Habis", variant: "danger" as const }
      : product.stock <= product.minStock
      ? { text: "Stok Tipis", variant: "warning" as const }
      : null;

  return (
    <div
      ref={cardRef}
      onClick={handleAdd}
      className={`flex cursor-pointer flex-col gap-2 rounded-lg border border-border-standard bg-card p-3 shadow-card transition-all hover:shadow-card-hover ${
        animating ? "animate-product-pop border-secondary" : "active:scale-[0.98]"
      }`}
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md bg-surface-container">
        {animating ? (
          <div className="flex h-full w-full items-center justify-center bg-secondary/10">
            <Icon name="check_circle" size={40} className="animate-badge-pulse text-secondary" />
          </div>
        ) : showImage ? (
          <img
            src={product.image_url!}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Icon name="inventory_2" size={40} className="text-outline" />
        )}
        {product.is_favorite && (
          <div className="absolute left-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-warning shadow-sm">
            <Icon name="star" size={14} fill="currentColor" className="text-white" />
          </div>
        )}
        {stockLabel && (
          <div className="absolute bottom-1.5 right-1.5">
            <StatusBadge label={stockLabel.text} variant={stockLabel.variant} />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-caption text-on-surface-variant">{product.category}</span>
        <h3 className="line-clamp-2 min-h-[40px] text-body-md font-semibold leading-snug text-on-surface">
          {product.name}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <span className="min-w-0 truncate text-label-xl font-bold text-on-surface">
            {formatCurrency(product.sellPrice)}
          </span>
          <span className="shrink-0 text-caption font-medium text-on-surface-variant">
            Stok: {product.stock}
          </span>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); handleAdd(); }}
        className="mt-1 flex h-11 w-full items-center justify-center gap-1 rounded-md bg-secondary text-label-md font-semibold text-white transition-all hover:bg-secondary/90 active:opacity-80"
      >
        <Icon name="add" size={16} />
        Tambah
      </button>
    </div>
  );
}
