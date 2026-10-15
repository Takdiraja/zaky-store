"use client";

import { useEffect, useImperativeHandle, useMemo, useState, type Ref } from "react";
import type { DigitalServiceTransaction } from "@/types";
import {
  DIGITAL_SERVICE_PAYMENTS,
  getServiceConfig,
  type DigitalServiceOption,
} from "@/lib/digital-services";
import { formatCurrency, withCurrentTime, withDate } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import CurrencyInput from "@/components/shared/currency-input";

export interface DigitalServiceFormValues {
  serviceType: string;
  customerIdentifier: string;
  subService: string | null;
  tokenCode: string | null;
  customerName: string | null;
  nominalAmount: number;
  serviceFee: number;
  paymentMethod: "cash" | "qris";
  transactionDate: string;
  notes: string | null;
}

/** Internal form state — optional text fields are strings while editing. */
type FormFields = Pick<
  DigitalServiceFormValues,
  | "customerIdentifier"
  | "tokenCode"
  | "customerName"
  | "nominalAmount"
  | "serviceFee"
  | "notes"
> & {
  tokenCode: string;
  customerName: string;
  notes: string;
};

interface Props {
  initial?: DigitalServiceTransaction | null;
  /** Service type preselected before the form opens (new transactions). */
  defaultService?: string | null;
  onSubmit: (values: DigitalServiceFormValues) => Promise<void> | void;
  /** Reports whether the form is valid enough to submit (drives footer button). */
  onValidChange?: (valid: boolean) => void;
  /** Imperative submit exposed so the DialogFooter lives outside this body. */
  ref?: Ref<{ submit: () => void }>;
}

const EMPTY_FIELDS: FormFields = {
  customerIdentifier: "",
  tokenCode: "",
  customerName: "",
  nominalAmount: 0,
  serviceFee: 0,
  notes: "",
};

const inputClass =
  "h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15";

function ProviderCombobox({
  options,
  value,
  onValueChange,
}: {
  options: DigitalServiceOption[];
  /** Seeds the initial input only; the field is a free-text combobox. */
  value: string;
  onValueChange: (v: string) => void;
}) {
  const optionByLabel = useMemo(
    () => new Map(options.map((o) => [o.label, o])),
    [options],
  );

  return (
    <Combobox
      items={options.map((o) => o.label)}
      value={value}
      onValueChange={(label) => {
        if (label !== null) onValueChange(label);
      }}
      onInputValueChange={(text) => onValueChange(text)}
      autoHighlight
    >
      <ComboboxInput
        placeholder="Pilih atau ketik baru…"
        aria-label="Pilih provider"
      />
      <ComboboxContent>
        <ComboboxEmpty>Tidak ada hasil</ComboboxEmpty>
        <ComboboxList>
          {(label: string) => {
            const opt = optionByLabel.get(label);
            return (
              <ComboboxItem key={label} value={label}>
                {opt && <Icon name={opt.icon} size={16} />}
                {label}
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * Reusable digital-service transaction form. Handles both new transactions
 * (service preselected via prop) and edits (populated from an existing record).
 */
export default function DigitalServiceForm({
  initial = null,
  defaultService = null,
  onSubmit,
  onValidChange,
  ref,
}: Props) {
  const serviceType = initial?.serviceType ?? defaultService ?? "";
  // When editing, a stored sub-option that isn't a known option of the
  // service is a custom typed name → prefill the "Lainnya" input.
  const initialSubService =
    initial?.subService ?? null;
  const initialIsCustom =
    !!initialSubService &&
    !getServiceConfig(serviceType).options?.some((o) => o.id === initialSubService);
  // Free-text provider: seeded from the known option's label (edits of a known
  // option) or the stored custom name.
  const [providerText, setProviderText] = useState(() => {
    if (!initialSubService) return "";
    if (initialIsCustom) return initialSubService;
    return (
      getServiceConfig(serviceType).options?.find((o) => o.id === initialSubService)
        ?.label ?? ""
    );
  });
  const [fields, setFields] = useState(() =>
    initial
      ? {
          customerIdentifier: initial.customerIdentifier ?? "",
          tokenCode: initial.tokenCode ?? "",
          customerName: initial.customerName ?? "",
          nominalAmount: initial.nominalAmount,
          serviceFee: initial.serviceFee,
          notes: initial.notes ?? "",
        }
      : EMPTY_FIELDS,
  );
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">(
    initial?.paymentMethod ?? "cash",
  );
  const [transactionDate, setTransactionDate] = useState(
    initial?.transactionDate
      ? initial.transactionDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );

  const service = serviceType ? getServiceConfig(serviceType) : null;
  const total = fields.nominalAmount + fields.serviceFee;

  const canSubmit =
    !!serviceType &&
    !!fields.customerIdentifier.trim() &&
    fields.nominalAmount > 0 &&
    ((service?.options?.length ?? 0) === 0 || providerText.trim() !== "") &&
    (!service?.tokenLabel || !!fields.tokenCode.trim());

  useEffect(() => {
    onValidChange?.(canSubmit);
  }, [onValidChange, canSubmit]);

  const handleSubmit = () => {
    if (!serviceType || !fields.customerIdentifier.trim() || !(fields.nominalAmount > 0)) {
      return;
    }
    const requiresSub = (getServiceConfig(serviceType).options?.length ?? 0) > 0;
    const provider = providerText.trim();
    if (requiresSub && !provider) return;
    const isTokenService = !!getServiceConfig(serviceType).tokenLabel;
    if (isTokenService && !fields.tokenCode.trim()) {
      return;
    }
    // A provider matching a known option is stored by id; otherwise the typed
    // free-text name is stored directly so the whole stack (receipts, detail,
    // reports) renders it without any special case.
    const providerOption =
      getServiceConfig(serviceType).options?.find(
        (o) => o.label.toLowerCase() === provider.toLowerCase(),
      ) ?? null;
    const resolvedSubService = providerOption ? providerOption.id : provider || null;
    onSubmit({
      serviceType,
      customerIdentifier: fields.customerIdentifier.trim(),
      subService: resolvedSubService,
      tokenCode: fields.tokenCode.trim() || null,
      customerName: fields.customerName.trim() || null,
      nominalAmount: fields.nominalAmount,
      serviceFee: fields.serviceFee,
      paymentMethod,
      // New transactions carry the current clock time; edits keep the
      // original time-of-day and only update the chosen date.
      transactionDate: initial
        ? withDate(initial.transactionDate, transactionDate)
        : withCurrentTime(transactionDate),
      notes: fields.notes.trim() || null,
    });
  };

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  return (
    <div className="space-y-4">
      {service && service.options && service.options.length > 0 && (
        <div className="space-y-1">
          <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
            {service.optionsLabel ?? "Pilih Opsi"} <span className="text-danger">*</span>
          </label>
          <ProviderCombobox
            options={service.options}
            value={providerText}
            onValueChange={setProviderText}
          />
          <p className="text-caption text-on-surface-variant">
            Ketik untuk mencari atau masukkan nama{" "}
            {(service.optionsLabel ?? "Opsi").replace(/^Pilih\s*/i, "").toLowerCase()} baru.
          </p>
        </div>
      )}

      {service && (
        <>
          {/* Customer identifier */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              {service.identifierLabel} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              inputMode={service.identifierInputMode ?? "text"}
              value={fields.customerIdentifier}
              onChange={(e) =>
                setFields((f) => ({ ...f, customerIdentifier: e.target.value }))
              }
              placeholder={service.identifierPlaceholder}
              className={inputClass}
            />
          </div>

          {/* Customer name */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Nama Pelanggan{" "}
              <span className="font-normal text-on-surface-variant/60">(opsional)</span>
            </label>
            <input
              type="text"
              value={fields.customerName}
              onChange={(e) => setFields((f) => ({ ...f, customerName: e.target.value }))}
              placeholder="Nama pemilik akun"
              className={inputClass}
            />
          </div>

          {/* Nominal */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Nominal <span className="text-danger">*</span>
            </label>
            <CurrencyInput
              value={fields.nominalAmount}
              onChange={(v) => setFields((f) => ({ ...f, nominalAmount: v }))}
              placeholder="0"
            />
          </div>

          {/* Service fee */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Biaya Layanan <span className="text-on-surface-variant/60">(opsional)</span>
            </label>
            <CurrencyInput
              value={fields.serviceFee}
              onChange={(v) => setFields((f) => ({ ...f, serviceFee: v }))}
              placeholder="0"
            />
            {fields.serviceFee === 0 && service.defaultFee > 0 && (
              <p className="mt-1 text-caption text-on-surface-variant">
                Disarankan: {formatCurrency(service.defaultFee)}
              </p>
            )}
          </div>

          {/* Payment method */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIGITAL_SERVICE_PAYMENTS.map((pm) => {
                const isActive = paymentMethod === pm.value;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`flex h-12 items-center justify-center gap-1.5 rounded-md border font-semibold transition-all active:scale-[0.98] ${
                      isActive
                        ? "border-secondary bg-secondary/5 text-secondary"
                        : "border-border-standard bg-card text-on-surface-variant"
                    }`}
                  >
                    <Icon name={pm.icon} size={18} />
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Tanggal
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Catatan <span className="text-on-surface-variant/60">(opsional)</span>
            </label>
            <textarea
              value={fields.notes}
              onChange={(e) => setFields((f) => ({ ...f, notes: e.target.value }))}
              className="w-full resize-none rounded-md border border-border-standard bg-card px-4 py-3 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
              rows={2}
              placeholder="Catatan transaksi..."
            />
          </div>

          {/* Token code — large, emphasized input for PLN prepaid */}
          {service.tokenLabel && (
            <div>
              <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
                {service.tokenLabel} <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                inputMode="text"
                value={fields.tokenCode}
                onChange={(e) =>
                  setFields((f) => ({ ...f, tokenCode: e.target.value }))
                }
                placeholder="Contoh: 1234-5678-9012-3456"
                className="h-16 w-full rounded-md border-2 border-secondary bg-card px-4 text-center text-xl font-bold tracking-[0.2em] text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 placeholder:tracking-normal focus:ring-4 focus:ring-secondary/20"
              />
              <p className="mt-1.5 text-caption text-on-surface-variant">
                Masukkan kode token PLN yang ditampilkan setelah pembayaran.
              </p>
            </div>
          )}

          {/* Total */}
          <div className="rounded-md bg-surface-container p-4">
            <div className="flex items-center justify-between">
              <span className="text-label-md text-on-surface-variant">Total</span>
              <span className="text-headline-md font-extrabold text-secondary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
