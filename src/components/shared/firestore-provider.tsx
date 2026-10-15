"use client";

import { useEffect, useRef } from "react";
import { useProductStore } from "@/stores/use-product-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useDebtPaymentStore } from "@/stores/use-debt-payment-store";
import { useDraftStore } from "@/stores/use-draft-store";
import { useExpenseStore } from "@/stores/use-expense-store";
import { useCapitalStore } from "@/stores/use-capital-store";
import { useDigitalServiceStore } from "@/stores/use-digital-service-store";

export default function FirestoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const unsubProducts = useProductStore.getState().loadProducts();
    const unsubTransactions = useTransactionStore.getState().loadTransactions();
    const unsubCustomers = useCustomerStore.getState().loadCustomers();
    const unsubPayments = useDebtPaymentStore.getState().loadPayments();
    const unsubDrafts = useDraftStore.getState().loadDrafts();
    const unsubExpenses = useExpenseStore.getState().loadExpenses();
    const unsubCapital = useCapitalStore.getState().loadCapitalTransactions();
    const unsubDigitalServices = useDigitalServiceStore.getState().loadTransactions();

    return () => {
      unsubProducts();
      unsubTransactions();
      unsubCustomers();
      unsubPayments();
      unsubDrafts();
      unsubExpenses();
      unsubCapital();
      unsubDigitalServices();
    };
  }, []);

  return <>{children}</>;
}
