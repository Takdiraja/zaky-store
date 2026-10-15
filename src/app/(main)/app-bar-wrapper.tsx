"use client";

import { usePathname } from "next/navigation";
import TopAppBar from "@/components/layout/top-app-bar";

export default function AppBarWrapper() {
  const pathname = usePathname();
  const isKasir = pathname === "/" || pathname === "/cart";

  return <div className={isKasir ? "hidden" : ""}><TopAppBar /></div>;
}
