"use client";

import { Icon } from "@/lib/icon-map";
import Image from "next/image";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Fullscreen overlay that shows the QRIS image at full size for easy scanning. */
export default function QrisFullscreenDialog({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black flex flex-col">
      {/* Header with close */}
      <div className="flex items-center justify-between p-4 text-white shrink-0">
        <p className="text-label-md font-bold">QRIS</p>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-card/10 hover:bg-card/20 active:scale-90 transition-all"
          aria-label="Tutup"
        >
          <Icon name="close" size={24} />
        </button>
      </div>

      {/* Full image */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <Image
          src="/images/QRIS.jpg"
          alt="QRIS Fullscreen"
          width={800}
          height={800}
          className="w-full h-full object-contain"
          unoptimized
        />
      </div>

      {/* Hint */}
      <p className="text-white/60 text-center text-label-md pb-6 shrink-0">
        Ketuk di luar area untuk menutup
      </p>
    </div>
  );
}
