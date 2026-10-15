"use client";

import { useEffect, useState } from "react";
import { onSnapshotsInSync } from "firebase/firestore";
import { WifiOff, RefreshCw, CloudCheck } from "lucide-react";
import { db } from "@/lib/firebase";

type SyncStatus = "synced" | "offline";

/**
 * Floating sync indicator: shows when offline (with a reconnect retry) or
 * when back online after being offline (brief "tersinkron" confirmation).
 * Renders nothing when everything is healthy.
 */
export default function SyncStatus() {
  const [status, setStatus] = useState<SyncStatus>("synced");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsub = onSnapshotsInSync(db, () => {
      setStatus("synced");
      setLastSync(new Date());
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

  const offline = status === "offline";

  return (
    <button
      onClick={() => {
        setStatus("synced");
        setWasOffline(false);
        if (navigator.onLine) window.dispatchEvent(new Event("online"));
      }}
      className={`fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full px-3 py-1.5 text-label-md shadow-dialog transition-all ${
        offline ? "bg-danger text-white" : "bg-success text-white"
      }`}
      aria-label={offline ? "Coba sambungkan kembali" : "Tersinkron"}
    >
      {offline ? <WifiOff className="size-4" /> : <CloudCheck className="size-4" />}
      <span>
        {offline
          ? "Offline — ketuk untuk mencoba lagi"
          : lastSync
          ? `Tersinkron ${lastSync.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
          : "Tersinkron"}
      </span>
      {offline && <RefreshCw className="size-3.5" />}
    </button>
  );
}
