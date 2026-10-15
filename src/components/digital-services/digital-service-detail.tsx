"use client";

import { useState } from "react";
import type { DigitalServiceTransaction } from "@/types";
import {
  getServiceConfig,
  getSubServiceLabel,
} from "@/lib/digital-services";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { APP_NAME } from "@/lib/constants";
import { buildDigitalServiceReceiptText } from "@/lib/digital-service-receipt-formatter";
import { formatPhoneToInternational, isValidPhone } from "@/utils/whatsapp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePrinterStore } from "@/stores/use-printer-store";
import { useDigitalServiceStore } from "@/stores/use-digital-service-store";
import { useToast } from "@/components/shared/toast-provider";
import { Icon } from "@/lib/icon-map";
import StatusBadge from "@/components/shared/status-badge";
import {
  PrintProgressDialog,
  printDigitalServiceJob,
  type PrintJobState,
  type PrintPhase,
} from "@/components/shared/print-progress-dialog";

interface Props {
  transaction: DigitalServiceTransaction;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Detail panel for a digital-service transaction with receipt reprint
 * (thermal) and WhatsApp sharing. Follows the same pattern as
 * kasbon/reprint-button.
 */
export default function DigitalServiceDetail({
  transaction,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const [printState, setPrintState] = useState<PrintJobState>({
    phase: "idle" as PrintPhase,
    error: null,
  });
  const [printOpen, setPrintOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [waPromptOpen, setWaPromptOpen] = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const { paperWidth } = usePrinterStore();
  const markPrinted = useDigitalServiceStore((s) => s.markPrinted);
  const { toast } = useToast();

  const service = getServiceConfig(transaction.serviceType);

  const receiptParams = {
    serviceType: transaction.serviceType,
    customerIdentifier: transaction.customerIdentifier,
    subService: getSubServiceLabel(
      transaction.serviceType,
      transaction.subService,
    ),
    tokenCode: transaction.tokenCode ?? null,
    customerName: transaction.customerName,
    nominalAmount: transaction.nominalAmount,
    serviceFee: transaction.serviceFee,
    totalAmount: transaction.totalAmount,
    paymentMethod: transaction.paymentMethod,
    receiptNumber: transaction.receiptNumber ?? transaction.transactionNumber,
    transactionNumber: transaction.transactionNumber,
    date: transaction.transactionDate,
    paperWidth,
    storeName: APP_NAME,
    notes: transaction.notes,
  };

  const handlePrint = async () => {
    setPrintOpen(true);
    setPrintState({ phase: "connecting", error: null });
    try {
      await printDigitalServiceJob(receiptParams, (phase) =>
        setPrintState({ phase, error: null }),
      );
      await markPrinted(transaction.id);
    } catch (err) {
      setPrintState({
        phase: "error",
        error: err instanceof Error ? err.message : "Gagal mencetak nota.",
      });
    }
  };

  const handleRetry = async () => {
    setPrintState({ phase: "connecting", error: null });
    try {
      await printDigitalServiceJob(receiptParams, (phase) =>
        setPrintState({ phase, error: null }),
      );
      await markPrinted(transaction.id);
    } catch (err) {
      setPrintState({
        phase: "error",
        error: err instanceof Error ? err.message : "Gagal mencetak nota.",
      });
    }
  };

  const buildWhatsAppUrl = (phone: string) => {
    setSharing(true);
    try {
      const text = buildDigitalServiceReceiptText({
        ...receiptParams,
        mode: "whatsapp",
      });
      return `https://wa.me/${formatPhoneToInternational(phone)}?text=${encodeURIComponent(text)}`;
    } finally {
      setSharing(false);
    }
  };

  const sendToPhone = (phone: string) => {
    if (!isValidPhone(phone)) {
      toast("Nomor pelanggan bukan nomor WhatsApp yang valid.", "error");
      return;
    }
    window.open(buildWhatsAppUrl(phone), "_blank");
  };

  const handleWhatsApp = () => {
    // For pulsa / data / e-wallet the identifier IS the phone number, so
    // send directly. For other services (BPJS, PLN meter, game user ID, ...)
    // ask the user for the WhatsApp number first.
    if (service.identifierIsPhone) {
      sendToPhone(transaction.customerIdentifier);
      return;
    }
    setWaPhone("");
    setWaPromptOpen(true);
  };

  const subServiceLabel = getSubServiceLabel(
    transaction.serviceType,
    transaction.subService,
  );

  const meta: { label: string; value: string }[] = [
    { label: "Jenis Layanan", value: service.label },
    ...(subServiceLabel
      ? [{ label: service.optionsLabel ?? "Opsi", value: subServiceLabel }]
      : []),
    { label: "No. Transaksi", value: transaction.transactionNumber },
    { label: service.identifierReceiptLabel, value: transaction.customerIdentifier },
    ...(transaction.tokenCode
      ? [
          {
            label: service.tokenLabel ?? "Kode Token",
            value: transaction.tokenCode,
          },
        ]
      : []),
    ...(transaction.customerName
      ? [{ label: "Nama Pelanggan", value: transaction.customerName }]
      : []),
    { label: "Tanggal", value: formatDate(transaction.transactionDate) },
    {
      label: "Metode",
      value: transaction.paymentMethod === "cash" ? "Tunai" : "QRIS",
    },
    ...(transaction.notes ? [{ label: "Catatan", value: transaction.notes }] : []),
  ];

  return (
    <>
      <div>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-md bg-secondary/10 text-secondary">
                <Icon name={service.icon} size={20} />
              </span>
              <span className="font-mono text-caption font-semibold text-on-surface-variant">
                {transaction.transactionNumber}
              </span>
            </div>
            <h2 className="text-headline-md font-bold text-on-surface">{service.label}</h2>
            <p className="text-label-xl font-bold text-secondary">
              {formatCurrency(transaction.totalAmount)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onDelete}
              className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-container active:scale-90"
              aria-label="Hapus transaksi"
            >
              <Icon name="delete" size={20} className="text-danger" />
            </button>
            <button
              onClick={onEdit}
              className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-container active:scale-90"
              aria-label="Edit transaksi"
            >
              <Icon name="edit" size={20} className="text-secondary" />
            </button>
            <button
              onClick={onClose}
              className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-container active:scale-90"
              aria-label="Tutup"
            >
              <Icon name="close" size={22} />
            </button>
          </div>
        </div>

        {/* Print status */}
        <div className="mb-4">
          <StatusBadge
            label={transaction.printed ? `Sudah dicetak (${transaction.printCount}x)` : "Belum dicetak"}
            variant={transaction.printed ? "success" : "warning"}
          />
        </div>

        {/* Meta rows */}
        <div className="space-y-2">
          {meta.map((m) => {
            const isToken = m.label === service.tokenLabel;
            return (
              <div
                key={m.label}
                className={`rounded-md border p-3 shadow-card ${
                  isToken
                    ? "border-secondary bg-secondary/5"
                    : "border-border-standard bg-card"
                }`}
              >
                <p className="mb-0.5 text-overline uppercase tracking-[0.08em] text-on-surface-variant">
                  {m.label}
                </p>
                <p
                  className={`whitespace-pre-wrap font-semibold text-on-surface ${
                    isToken
                      ? "text-lg tracking-[0.15em] text-secondary"
                      : "text-body-sm"
                  }`}
                >
                  {m.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Amount breakdown */}
        <div className="mt-4 space-y-1 rounded-md bg-surface-container-low p-3">
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant">Nominal</span>
            <span className="font-medium text-on-surface">{formatCurrency(transaction.nominalAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant">Biaya Layanan</span>
            <span className="font-medium text-on-surface">{formatCurrency(transaction.serviceFee)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border-standard pt-1">
            <span className="font-bold text-on-surface">Total</span>
            <span className="font-bold text-secondary">{formatCurrency(transaction.totalAmount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-2">
          <button
            onClick={handlePrint}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary font-semibold text-white shadow-fab transition-all active:scale-[0.98]"
          >
            <Icon name="print" size={20} />
            {transaction.printed ? "Cetak Ulang" : "Cetak Nota"}
          </button>
          <button
            onClick={handleWhatsApp}
            disabled={sharing}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-secondary bg-card font-semibold text-secondary transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Icon name="message_circle" size={20} />
            Kirim WhatsApp
          </button>
        </div>
      </div>

      {/* Print progress + retry */}
      <PrintProgressDialog
        open={printOpen}
        state={printState}
        onRetry={handleRetry}
        onClose={() => {
          setPrintOpen(false);
          setPrintState({ phase: "idle" as PrintPhase, error: null });
        }}
      />

      {/* WhatsApp number prompt (services whose identifier isn't a phone) */}
      <Dialog open={waPromptOpen} onOpenChange={setWaPromptOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[340px]"
          onKeyDownCapture={(e) => {
            if (e.key === "Escape") e.stopPropagation();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-headline-sm font-bold">
              Nomor WhatsApp Penerima
            </DialogTitle>
          </DialogHeader>
          <p className="text-body-sm text-on-surface-variant">
            Nomor ini digunakan untuk mengirim nota via WhatsApp.
          </p>
          <div className="flex overflow-hidden rounded-md border border-border-standard bg-card transition-all focus-within:border-secondary focus-within:ring-4 focus-within:ring-secondary/15">
            <span className="flex shrink-0 items-center bg-surface-container px-3 text-body-md font-bold text-on-surface-variant">
              +62
            </span>
            <input
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value.replace(/\D/g, ""))}
              className="h-12 flex-1 px-3 text-base outline-none"
              placeholder="81x-xxxx-xxxx"
              inputMode="numeric"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setWaPromptOpen(false)}
              className="h-11 flex-1 rounded-md border border-border-standard bg-card font-semibold text-on-surface-variant transition-colors active:bg-surface-container"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={sharing}
              onClick={() => {
                sendToPhone(waPhone);
                setWaPromptOpen(false);
              }}
              className="h-11 flex-1 rounded-md bg-secondary font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Kirim
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
