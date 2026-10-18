"use client";

import { useEffect, useState, useCallback } from "react";
import { getLocalDB, startSync, onSyncStatus, type SyncStatus } from "@/lib/pouchdb";

interface TestDoc {
  _id: string;
  _rev?: string;
  name: string;
  createdAt: string;
}

/**
 * Halaman spike PouchDB — untuk verifikasi create/read/sync offline-online.
 * Hapus setelah migrasi penuh selesai.
 */
export default function PouchTestPage() {
  const [docs, setDocs] = useState<TestDoc[]>([]);
  const [sync, setSync] = useState<SyncStatus>({ state: "idle" });
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLog((l) => [`${new Date().toLocaleTimeString()} ${msg}`, ...l].slice(0, 20));

  const refresh = useCallback(async () => {
    const db = getLocalDB("spike");
    const res = await db.allDocs<TestDoc>({ include_docs: true });
    setDocs(res.rows.map((r: PouchDB.Core.AllDocsResponse<TestDoc>["rows"][number]) => r.doc!).filter(Boolean));
  }, []);

  useEffect(() => {
    startSync("spike");
    const off = onSyncStatus((s) => {
      setSync(s);
      addLog(`sync: ${s.state}${s.lastError ? ` (${s.lastError.slice(0, 60)})` : ""}`);
    });
    refresh();
    const db = getLocalDB("spike");
    const changes = db.changes({ live: true, since: "now" }).on("change", refresh);
    return () => {
      off();
      changes.cancel();
    };
  }, [refresh]);

  const addDoc = async () => {
    const db = getLocalDB("spike");
    const id = `tes-${Date.now()}`;
    await db.put({ _id: id, name: `Produk Tes ${id.slice(-4)}`, createdAt: new Date().toISOString() });
    addLog(`tambah: ${id}`);
    refresh();
  };

  const clearDocs = async () => {
    const db = getLocalDB("spike");
    const res = await db.allDocs();
    await Promise.all(res.rows.map((r: { id: string; value: { rev: string } }) => db.remove(r.id, r.value.rev)));
    addLog("semua dokumen dihapus (lokal)");
    refresh();
  };

  return (
    <div className="p-4 space-y-4 max-w-[600px] mx-auto">
      <h1 className="text-xl font-bold">Tes PouchDB (Spike)</h1>

      <div className="rounded-xl border border-border-standard bg-card p-4">
        <p className="text-sm font-semibold">Status Sync</p>
        <p className="text-2xl">{sync.state === "idle" ? "✅ idle" : sync.state === "syncing" ? "🔄 syncing" : sync.state === "offline" ? "📴 offline" : "❌ error"}</p>
        {sync.lastError && <p className="text-xs text-danger-alert mt-1">{sync.lastError.slice(0, 120)}</p>}
        <p className="text-xs text-on-surface-variant mt-2">Remote: https://couchdb.zbo.my.id/zaky-store-spike</p>
      </div>

      <div className="flex gap-2">
        <button onClick={addDoc} className="flex-1 h-12 rounded-xl bg-primary text-white font-semibold">
          + Tambah Data Tes
        </button>
        <button onClick={clearDocs} className="h-12 px-4 rounded-xl border border-border-standard font-semibold">
          Hapus Semua
        </button>
      </div>

      <div className="rounded-xl border border-border-standard bg-card p-4">
        <p className="text-sm font-semibold mb-2">Data Lokal ({docs.length})</p>
        {docs.length === 0 && <p className="text-sm text-on-surface-variant">Kosong — tambah data tes dulu.</p>}
        <ul className="space-y-1">
          {docs.map((d) => (
            <li key={d._id} className="text-sm border-b border-border-standard py-1">
              {d.name} <span className="text-xs text-on-surface-variant">{d._id}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border-standard bg-card p-4">
        <p className="text-sm font-semibold mb-2">Log</p>
        <ul className="space-y-1 max-h-48 overflow-y-auto">
          {log.map((l, i) => (
            <li key={i} className="text-xs text-on-surface-variant">{l}</li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-on-surface-variant">
        Cara tes: 1) Tambah data → cek muncul di daftar. 2) Buka https://couchdb.zbo.my.id/zaky-store-spike/_all_docs di browser — data harus ada di server. 3) Matikan internet HP → tambah data → tetap kesimpen lokal → nyalakan internet → otomatis kesync.
      </p>
    </div>
  );
}
