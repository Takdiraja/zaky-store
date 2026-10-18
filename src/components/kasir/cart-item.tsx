"use client";

import type { CartItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import QuantityControl from "./quantity-control";
import { useCartStore } from "@/stores/use-cart-store";
import { useProductStore } from "@/stores/use-product-store";

interface Props {
  item: CartItem;
}

export default function CartItemRow({ item }: Props) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const products = useProductStore((s) => s.products);
  const product = products.find((p) => p.id === item.productId);
  const maxStock = product ? product.stock : undefined;

  return (
    <div className="space-y-2 py-2">
      {/* Row 1: name + subtotal */}
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 break-words text-body-md font-semibold leading-snug text-on-surface">
          {item.name}
        </p>
        <p className="shrink-0 font-bold text-on-surface">{formatCurrency(item.subtotal)}</p>
      </div>
      {/* Row 2: unit price + quantity control + delete */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-caption text-on-surface-variant">{formatCurrency(item.sellPrice)}</p>
        <div className="flex items-center gap-2">
          <QuantityControl
            quantity={item.quantity}
            maxStock={maxStock}
            onDecrement={() => updateQuantity(item.productId, item.quantity - 1)}
            onIncrement={() => updateQuantity(item.productId, item.quantity + 1)}
          />
          <button
            onClick={() => removeFromCart(item.productId)}
            className="flex size-11 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10 active:scale-90"
            aria-label={`Hapus ${item.name}`}
          >
            <Icon name="delete" size={18} />
          </button>
        </div>
      </div>
      {/* Quick quantity chips */}
      <div className="flex items-center gap-1.5 pl-1">
        <span className="text-caption text-on-surface-variant">Cepat:</span>
        {[1, 2, 5].map((qty) => {
          const disabled = maxStock !== undefined && qty > maxStock;
          const active = item.quantity === qty;
          return (
            <button
              key={qty}
              onClick={() => updateQuantity(item.productId, qty)}
              disabled={disabled}
              className={`h-7 min-w-9 rounded-md border px-2 text-caption font-semibold transition-all active:scale-95 disabled:opacity-40 ${
                active
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-border-standard bg-card text-on-surface-variant"
              }`}
              aria-label={`Set jumlah ${qty}`}
            >
              ×{qty}
            </button>
          );
        })}
      </div>
    </div>
  );
}
