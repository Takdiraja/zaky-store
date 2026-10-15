import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type AuditAction = "create" | "update" | "delete";
export type AuditEntity = "product" | "transaction" | "debt" | "customer" | "expense" | "capital" | "digital_service";

export async function createAuditLog(params: {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  description: string;
  details?: Record<string, unknown>;
}) {
  try {
    await addDoc(collection(db, "audit_logs"), {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      description: params.description,
      createdAt: serverTimestamp(),
      ...(params.details ? { details: params.details } : {}),
    });
  } catch {
    // Silent fail — audit log tidak boleh mengganggu operasi utama
  }
}
