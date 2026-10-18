const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const serwistDir = path.join(root, "src", "app", "serwist");
const serwistBak = path.join(root, ".serwist-temp-bak");
const nextDir = path.join(root, ".next");

let moved = false;
try {
  // 1. Singkirkan route serwist sementara agar static export Next.js berhasil
  if (fs.existsSync(serwistDir)) {
    fs.renameSync(serwistDir, serwistBak);
    moved = true;
  }

  // 2. Bersihkan cache .next agar tidak ada konflik validator route
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
  }

  // 3. Generate build info
  require("./gen-build-info.js");

  // 4. Build web statis
  console.log("==> Building static Next.js export (out/)...");
  execSync("npx next build", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, CAPACITOR_BUILD: "1" },
  });

  // 5. Sync Capacitor
  console.log("==> Syncing web assets to Android project...");
  execSync("npx cap sync android", {
    cwd: root,
    stdio: "inherit",
  });

  console.log("\n========================================================");
  console.log("✓ Selesai! Web assets berhasil disinkronkan ke Android.");
  console.log("Sekarang buka Android Studio dan tinggal Build APK / Run.");
  console.log("========================================================\n");
} finally {
  if (moved && fs.existsSync(serwistBak)) {
    fs.renameSync(serwistBak, serwistDir);
  }
}
