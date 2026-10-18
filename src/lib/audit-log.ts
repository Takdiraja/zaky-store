"use client";

import { getLocalDB } from "./pouchdb";
import { nowISO } from "./pouch-helpers";

export type AuditAction = "create" | "update" | "delete";
export type AuditEntity = "product" | "transaction" | "debt" | "customer" | "expense" | "capital" | "stock_in_receipt";

export async function createAuditLog(params: {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  description: string;
  details?: Record<string, unknown>;
}) {
  try {
    // Audit log hanya lokal (tidak di-sync) — diagnostik perangkat.
    const db = getLocalDB("audit_logs");
    await db.put({
      _id: crypto.randomUUID(),
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      description: params.description,
      createdAt: nowISO(),
      ...(params.details ? { details: params.details } : {}),
    } as PouchDB.Core.PutDocument<{}>);
  } catch {
    // Silent fail — audit log tidak boleh mengganggu operasi utama
  }
}
