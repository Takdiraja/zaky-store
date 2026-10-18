#!/usr/bin/env bash
# Build web statis untuk Capacitor (APK).
# - Pindahkan route Serwist (service worker) yg tidak kompatibel dgn static export
# - Build dengan CAPACITOR_BUILD=1 -> output ke folder out/
# - Kembalikan route Serwist setelah selesai
set -e
cd "$(dirname "$0")/.."

MOVED=0
if [ -d "src/app/serwist" ]; then
  mv src/app/serwist /tmp/warung-serwist-bak
  MOVED=1
fi

rm -rf .next

trap 'if [ "$MOVED" = "1" ]; then mv /tmp/warung-serwist-bak src/app/serwist; fi' EXIT

# Tulis info build (versi + waktu) agar user bisa cek versi APK terinstall
# di Pengaturan > Tentang.
node scripts/gen-build-info.js

CAPACITOR_BUILD=1 pnpm build

echo "OK -> folder out/ siap untuk 'npx cap sync'"
