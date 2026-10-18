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

trap 'if [ "$MOVED" = "1" ]; then mv /tmp/warung-serwist-bak src/app/serwist; fi' EXIT

# Tulis info build (versi + waktu) agar user bisa cek versi APK terinstall
# di Pengaturan > Tentang.
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "nogit")
cat > src/lib/build-info.ts << EOF
// Auto-generated saat build. JANGAN edit manual.
export const BUILD_TIME = "$BUILD_TIME";
export const GIT_HASH = "$GIT_HASH";
export const APP_VERSION = "1.0.0+$GIT_HASH";
EOF
echo "Build info: $APP_VERSION @ $BUILD_TIME"

CAPACITOR_BUILD=1 pnpm build

echo "OK -> folder out/ siap untuk 'npx cap sync'"
