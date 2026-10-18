"use client";

import { useEffect, useState } from "react";
import { onSyncStatus } from "@/lib/pouchdb";
import { WifiOff, RefreshCw, CloudCheck } from "lucide-react";

type SyncStatus = "synced" | "syncing" | "offline" | "error";

/**
 * Floating sync indicator: shows when offline/syncing/error.
 * Renders nothing when everything is healthy.
 */
export default function SyncStatus() {
  const [status, setStatus] = useState<SyncStatus>("synced");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsub = onSyncStatus((s) => {
      if (s.state === "idle") {
        setStatus("synced");
        setLastSync(new Date());
      } else if (s.state === "syncing") {
        setStatus("syncing");
      } else if (s.state === "offline") {
        setStatus("offline");
        setWasOffline(true);
      } else {
        setStatus("error");
        setWasOffline(true);
      }
    });

    const handleOnline = () => {
      setStatus("synced");
      setWasOffline(true);
    };
    const handleOffline = () => {
      setStatus("offline");
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Re-assert offline while disconnected.
    const interval = setInterval(() => {
      if (navigator.onLine === false) setStatus("offline");
    }, 3000);

    return () => {
      unsub();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (status === "synced" && !wasOffline) return null;

  const offline = status === "offline" || status === "error";

  return (
    <button
      onClick={() => {
        setStatus("synced");
        setWasOffline(false);
        if (navigator.onLine) window.dispatchEvent(new Event("online"));
      }}
      className={`fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full px-3 py-1.5 text-label-md shadow-dialog transition-all ${
        offline ? "bg-danger text-white" : status === "syncing" ? "bg-warning text-white" : "bg-success text-white"
      }`}
      aria-label={offline ? "Coba sambungkan kembali" : "Tersinkron"}
    >
      {offline ? <WifiOff className="size-4" /> : status === "syncing" ? <RefreshCw className="size-4 animate-spin" /> : <CloudCheck className="size-4" />}
      <span>
        {offline
          ? "Offline — ketuk untuk mencoba lagi"
          : status === "syncing"
          ? "Menyinkron..."
          : lastSync
          ? `Tersinkron ${lastSync.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
          : "Tersinkron"}
      </span>
      {offline && <RefreshCw className="size-3.5" />}
    </button>
  );
}
