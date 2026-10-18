"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";
import { ToastProvider } from "./toast-provider";
import FirestoreProvider from "./firestore-provider";
import SyncStatus from "./sync-status";
import ErrorBoundary from "./error-boundary";
import ThemeProvider from "@/themes/ThemeProvider";
import { printerManager } from "@/lib/printer-manager";

export default function Providers({ children }: { children: ReactNode }) {
  // On every app mount / page reload, try to reconnect the saved Bluetooth
  // printer silently (no chooser). This avoids the "remove & re-add the
  // printer" dance after a browser reload. Errors are swallowed — the
  // printer can still be connected manually from Settings.
  useEffect(() => {
    void printerManager.warmReconnect();
  }, []);

  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <ToastProvider>
        <FirestoreProvider>
          <ErrorBoundary>
            <ThemeProvider />
            {children}
            <SyncStatus />
          </ErrorBoundary>
        </FirestoreProvider>
      </ToastProvider>
    </SerwistProvider>
  );
}
