import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

// Build khusus Capacitor (APK): static export ke out/.
const isCapacitor = process.env.CAPACITOR_BUILD !== "0";

const baseConfig: NextConfig = isCapacitor
  ? {
      output: "export",
      images: { unoptimized: true },
    }
  : {
      // Your Next.js configuration
    };

export default isCapacitor ? baseConfig : withSerwist(baseConfig);
