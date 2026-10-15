"use client";

import { useCartStore } from "@/stores/use-cart-store";
import { Banknote, BookOpen, QrCode } from "lucide-react";

export default function PaymentMethod() {
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod);

  const options = [
    { id: "cash" as const, label: "Tunai", icon: Banknote },
    { id: "kasbon" as const, label: "Kasbon", icon: BookOpen },
    { id: "qris" as const, label: "QRIS", icon: QrCode },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-label-md text-on-surface-variant">Metode Pembayaran</label>
      <div className="grid grid-cols-3 gap-3">
        {options.map((opt) => {
          const isActive = paymentMethod === opt.id;
          const IconCmp = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => setPaymentMethod(opt.id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md border px-2 py-2.5 font-semibold transition-all active:scale-[0.98] ${
                isActive
                  ? "border-secondary bg-secondary/5 text-secondary"
                  : "border-border-standard bg-card text-on-surface-variant"
              }`}
            >
              <IconCmp className="size-5" />
              <span className="text-label-md">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
