"use client";

import dynamic from "next/dynamic";

const PouchTestClient = dynamic(() => import("./client"), { ssr: false });

export default function PouchTestPage() {
  return <PouchTestClient />;
}
