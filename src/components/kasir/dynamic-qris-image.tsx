"use client";

import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { useSettingsStore } from "@/stores/use-settings-store";
import { makeDynamicQris, isValidQris, qrisMerchantName } from "@/lib/qris";

interface Props {
  amount: number;
  size?: number;
  className?: string;
}

/**
 * QR QRIS dinamis: nominal otomatis ter-encode di QR.
 * Kalau QRIS merchant belum diisi di Pengaturan, fallback ke gambar statis.
 */
export default function DynamicQrisImage({ amount, size = 300, className }: Props) {
  const qrisPayload = useSettingsStore((s) => s.qrisPayload);

  const valid = qrisPayload && isValidQris(qrisPayload);
  if (!valid) {
    return (
      <div className="text-center">
        <Image
          src="/images/QRIS.jpg"
          alt="QRIS"
          width={size}
          height={size}
          className={className ?? "h-auto w-full object-contain"}
          unoptimized
        />
        <p className="mt-1 text-caption text-warning">
          QRIS toko belum diisi — buka Pengaturan untuk ganti.
        </p>
      </div>
    );
  }

  const dynamic = makeDynamicQris(qrisPayload, amount);
  const merchant = qrisMerchantName(qrisPayload);

  return (
    <div className="text-center">
      <div className="mx-auto w-fit rounded-md bg-white p-3">
        <QRCodeSVG value={dynamic} size={size - 24} level="M" />
      </div>
      {merchant && (
        <p className="mt-1 text-caption text-on-surface-variant">{merchant}</p>
      )}
    </div>
  );
}
