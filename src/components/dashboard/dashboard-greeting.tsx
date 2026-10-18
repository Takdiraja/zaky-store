"use client";

import { useMemo } from "react";
import { APP_NAME } from "@/lib/constants";

/**
 * Greeting line under the top app bar — answers "what day is it and which
 * store am I running" at a glance. Hour-based Indonesian greeting.
 */
export default function DashboardGreeting() {
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 18) return "Selamat sore";
    return "Selamat malam";
  }, []);

  const dateLine = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    []
  );

  return (
    <div>
      <h2 className="text-headline-md font-bold text-on-surface">
        {greeting}, {APP_NAME}
      </h2>
      <p className="mt-0.5 text-body-sm text-on-surface-variant">{dateLine}</p>
    </div>
  );
}
