"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Lightbulb, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

const typeStyles: Record<ToastType, { card: string; icon: ReactNode }> = {
  success: { card: "bg-card text-on-surface border-l-4 border-l-success", icon: <CheckCircle2 className="size-5 text-success" /> },
  error: { card: "bg-card text-on-surface border-l-4 border-l-danger", icon: <AlertCircle className="size-5 text-danger" /> },
  info: { card: "bg-card text-on-surface border-l-4 border-l-info", icon: <Lightbulb className="size-5 text-info" /> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed right-4 top-4 z-[100] flex w-full max-w-[360px] flex-col gap-2">
        {toasts.map((t) => {
          const s = typeStyles[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                "flex items-start gap-3 rounded-md border border-border-standard px-4 py-3 shadow-dialog animate-in slide-in-from-right fade-in-0",
                s.card
              )}
            >
              <span className="mt-0.5 shrink-0">{s.icon}</span>
              <p className="flex-1 text-label-md font-medium leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Tutup notifikasi"
                className="mt-0.5 shrink-0 rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
