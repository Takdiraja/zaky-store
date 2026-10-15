"use client";

import { DIGITAL_SERVICES, type DigitalServiceConfig } from "@/lib/digital-services";
import { Icon } from "@/lib/icon-map";

interface Props {
  selectedId: string | null;
  onSelect: (service: DigitalServiceConfig) => void;
}

/**
 * Grid of selectable digital services. Clicking a card selects the service
 * and reveals the transaction form.
 */
export default function ServiceCardGrid({ selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-5">
      {DIGITAL_SERVICES.map((service) => {
        const isSelected = selectedId === service.id;
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service)}
            className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all active:scale-[0.97] ${
              isSelected
                ? "border-secondary bg-secondary/10 ring-2 ring-secondary/30"
                : "border-border-standard bg-card hover:bg-surface-container-low"
            }`}
          >
            <span
              className={`flex size-10 items-center justify-center rounded-md ${
                isSelected
                  ? "bg-secondary text-white"
                  : "bg-secondary/10 text-secondary"
              }`}
            >
              <Icon name={service.icon} size={20} />
            </span>
            <span
              className={`text-center text-[11px] leading-tight font-medium ${
                isSelected ? "text-secondary" : "text-on-surface-variant"
              }`}
            >
              {service.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
