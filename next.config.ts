import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

// Build khusus Capacitor (APK): static export tanpa service worker.
// Jalankan dengan: CAPACITOR_BUILD=1 pnpm build
// (folder src/app/serwist harus dipindah dulu — lihat scripts/build-capacitor.sh)
const isCapacitor = process.env.CAPACITOR_BUILD === "1";

const baseConfig: NextConfig = isCapacitor
  ? {
      output: "export",
      images: { unoptimized: true },
    }
  : {
      // Your Next.js configuration
    };

export default isCapacitor ? baseConfig : withSerwist(baseConfig);
