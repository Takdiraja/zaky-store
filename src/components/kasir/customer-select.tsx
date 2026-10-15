"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "@/stores/use-cart-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useToast } from "@/components/shared/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/lib/icon-map";

export default function CustomerSelect() {
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const selectedCustomerId = useCartStore((s) => s.selectedCustomerId);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const { customers, addCustomer } = useCustomerStore(
    useShallow((s) => ({
      customers: s.customers,
      addCustomer: s.addCustomer,
    }))
  );
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (saving || !newName.trim()) return;
    setSaving(true);
    try {
      const id = await addCustomer({
        name: newName.trim(),
        phone: newPhone.trim() || "",
        currentDebt: 0,
      });
      setCustomer(id);
      setNewName("");
      setNewPhone("");
      setAddOpen(false);
      toast("Pelanggan berhasil ditambahkan.", "success");
    } catch {
      toast("Gagal menambahkan pelanggan.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-label-md block text-on-surface-variant">
        Pelanggan
      </label>
      <div className="flex gap-2">
        <select
          value={selectedCustomerId || ""}
          onChange={(e) => setCustomer(e.target.value || null)}
          className="flex-1 h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-card transition-all text-body-md"
        >
          <option value="">{paymentMethod === "kasbon" ? "Pilih pelanggan..." : "Tanpa pelanggan"}</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setAddOpen(true)}
          className="h-12 w-12 flex items-center justify-center border border-border-standard rounded-xl text-secondary active:bg-surface-container transition-colors shrink-0"
          aria-label="Tambah pelanggan baru"
        >
          <Icon name="add" size={20} />
        </button>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => !o && setAddOpen(false)}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-headline-md font-bold">Pelanggan Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">Nama</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
                placeholder="Nama pelanggan"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">
                Nomor WhatsApp <span className="text-on-surface-variant/60">(opsional)</span>
              </label>
              <div className="flex overflow-hidden rounded-md border border-border-standard bg-card transition-all focus-within:border-secondary focus-within:ring-4 focus-within:ring-secondary/15">
                <span className="flex shrink-0 items-center bg-surface-container px-3 text-body-md font-bold text-on-surface-variant">
                  +62
                </span>
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                  className="h-12 flex-1 px-3 text-base outline-none"
                  placeholder="81x-xxxx-xxxx"
                  inputMode="numeric"
                />
              </div>
              <p className="mt-1 text-caption text-on-surface-variant">
                Diperlukan untuk kirim nota via WhatsApp
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setAddOpen(false); setNewName(""); setNewPhone(""); }}
                className="h-12 flex-1 rounded-md border border-border-standard bg-card font-semibold text-on-surface-variant transition-colors active:bg-surface-container"
              >
                Batal
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newName.trim()}
                className="h-12 flex-1 rounded-md bg-secondary font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Tambah"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
