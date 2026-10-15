"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { Transaction } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useDebtPaymentStore } from "@/stores/use-debt-payment-store";
import ReprintButton from "./reprint-button";
import { Icon } from "@/lib/icon-map";

interface Props {
  customerId: string;
}

export default function TransactionHistory({ customerId }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const transactions = useTransactionStore(
    useShallow((s) => s.getTransactionsByCustomer(customerId))
  );
  const payments = useDebtPaymentStore(
    useShallow((s) => s.getPaymentsByCustomer(customerId))
  );

  const events: {
    date: string;
    type: "debt" | "payment";
    description: string;
    amount: number;
    transaction?: Transaction;
  }[] = [
    ...transactions.map((t) => ({
      date: t.date,
      type: "debt" as const,
      description: `Pembelian ${t.items.map((i) => i.name).join(", ")}`,
      amount: t.totalAmount,
      transaction: t,
    })),
    ...payments.map((p) => ({
      date: p.paymentDate,
      type: "payment" as const,
      description: p.notes || "Pembayaran hutang",
      amount: -p.amount,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-on-surface-variant/50">
        <p>Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, i) => {
        const isExpanded = expandedId === i;
        return (
          <div key={i}>
            <div
              onClick={() => event.transaction && setExpandedId(isExpanded ? null : i)}
              className={`flex justify-between items-start py-3 border-b border-border-standard/50 cursor-pointer ${
                event.transaction ? "active:opacity-70" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-body-md truncate">{event.description}</p>
                <p className="text-xs text-outline">{formatDateTime(event.date)}</p>
                {event.transaction?.receiptNumber && (
                  <p className="text-xs text-secondary font-mono mt-0.5">
                    {event.transaction.receiptNumber}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0 ml-3 flex items-center gap-2">
                <p
                  className={`font-bold ${
                    event.type === "debt" ? "text-danger-alert" : "text-success-paid"
                  }`}
                >
                  {event.type === "debt" ? "+" : "-"}
                  {formatCurrency(Math.abs(event.amount))}
                </p>
                {event.transaction && (
                  <Icon
                    name="chevron_right"
                    size={16}
                    className={`text-outline transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                )}
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && event.transaction && (
              <TransactionDetail transaction={event.transaction} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TransactionDetail({ transaction }: { transaction: Transaction }) {
  return (
    <div className="bg-surface-container-low rounded-lg mx-4 mb-3 p-4 space-y-3 text-sm">
      {/* Items */}
      {transaction.items.map((item, i) => (
        <div key={i} className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{item.name}</p>
            <p className="text-xs text-outline">{item.quantity} x {formatCurrency(item.sellPrice)}</p>
          </div>
          <p className="font-medium shrink-0 ml-3">{formatCurrency(item.subtotal)}</p>
        </div>
      ))}

      {/* Payment summary */}
      <div className="border-t border-border-standard pt-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-outline">Subtotal</span>
          <span className="font-medium">{formatCurrency(transaction.totalAmount)}</span>
        </div>
        {transaction.paymentMethod === "cash" && transaction.amountPaid > 0 && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-outline">Bayar</span>
              <span>{formatCurrency(transaction.amountPaid)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-outline">Kembali</span>
              <span className="text-success-paid font-medium">{formatCurrency(transaction.change)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between items-center pt-1 border-t border-border-standard">
          <span className="font-bold">
            {transaction.paymentMethod === "kasbon" ? "Total Hutang" : "Total"}
          </span>
          <span className="font-bold text-secondary">{formatCurrency(transaction.totalAmount)}</span>
        </div>
      </div>

      {/* Reprint */}
      <div className="pt-2 flex justify-end border-t border-border-standard">
        <ReprintButton transaction={transaction} />
      </div>
    </div>
  );
}
