"use client";

import { useState } from "react";
import { Icon } from "@/lib/icon-map";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useDebtPaymentStore } from "@/stores/use-debt-payment-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useToast } from "@/components/shared/toast-provider";
import ConfirmDialog from "@/components/shared/confirm-dialog";

interface Props {
  customerId: string;
}

export default function PaymentInput({ customerId }: Props) {
  const [amount, setAmount] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const updateDebt = useCustomerStore((s) => s.updateDebt);
  const addPayment = useDebtPaymentStore((s) => s.addPayment);
  const customer = useCustomerStore((s) => s.getCustomerById(customerId));
  const { toast } = useToast();
  const currentDebt = customer?.currentDebt ?? 0;

  const QUICK_NOMINALS = [50000, 100000, 200000];

  const handleSetNominal = (value: number | "full") => {
    if (value === "full") {
      setAmount(String(currentDebt));
    } else {
      setAmount(String(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) return;
    if (paymentAmount > currentDebt) {
      toast("Jumlah pembayaran melebihi hutang.", "error");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmPayment = async () => {
    const paymentAmount = Number(amount);
    setConfirmOpen(false);
    if (saving) return;
    setSaving(true);
    try {
      await addPayment({
        customerId,
        amount: paymentAmount,
        paymentDate: new Date().toISOString(),
        notes: "Pembayaran hutang",
      });

      await updateDebt(customerId, -paymentAmount);

      // Jika hutang lunas, tandai semua transaksi kasbon yang belum lunas
      // Hitung sisa hutang dari nilai yang diketahui (snapshot mungkin belum ter-update).
      const updatedCustomer = useCustomerStore.getState().getCustomerById(customerId);
      const remainingDebt = Math.max(0, (updatedCustomer?.currentDebt ?? 0) - paymentAmount);
      if (remainingDebt <= 0) {
        const debtTxns = useTransactionStore
          .getState()
          .getTransactionsByCustomer(customerId)
          .filter((t) => t.paymentMethod === "kasbon" && t.status === "debt");
        for (const txn of debtTxns) {
          await useTransactionStore.getState().updateTransactionStatus(txn.id, "paid");
        }
      }

      setAmount("");
      toast("Pembayaran berhasil!");
    } catch {
      toast("Gagal menyimpan pembayaran.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container p-6 rounded-2xl">
      <h4 className="text-label-md font-bold mb-4 flex items-center gap-2">
        <Icon name="payments" size={16} />
        Input Pembayaran
      </h4>
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-outline">Rp</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-surface border border-border-standard rounded-xl text-numeric-display font-bold focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all"
          placeholder="0"
          min="0"
        />
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-2">
        {QUICK_NOMINALS.map((nominal) => (
          <button
            key={nominal}
            type="button"
            onClick={() => handleSetNominal(nominal)}
            className="px-4 py-2 bg-surface border border-border-standard rounded-full whitespace-nowrap text-xs font-bold hover:bg-secondary-fixed hover:border-secondary transition-colors"
          >
            {nominal.toLocaleString("id-ID")}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleSetNominal("full")}
          className="px-4 py-2 bg-surface border border-border-standard rounded-full whitespace-nowrap text-xs font-bold hover:bg-secondary-fixed hover:border-secondary transition-colors"
        >
          Bayar Lunas
        </button>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full h-touch-target-min bg-secondary text-on-secondary rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Icon name="save" />
        {saving ? "Menyimpan..." : "Simpan Pembayaran"}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Konfirmasi Pembayaran"
        description={`Bayar ${Number(amount).toLocaleString("id-ID")} dari total hutang ${currentDebt.toLocaleString("id-ID")}?`}
        confirmLabel={saving ? "Menyimpan..." : "Bayar"}
        confirmDisabled={saving}
        onConfirm={handleConfirmPayment}
      />
    </form>
  );
}
