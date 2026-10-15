# Warung Resoyudan — Android (Capacitor)

Web app dibungkus jadi aplikasi Android native pakai Capacitor.

## Yang sudah disiapkan
- `capacitor.config.ts` — appId `id.warung.resoyudan`, webDir `out`
- `next.config.ts` — mode `CAPACITOR_BUILD=1` = static export tanpa service worker
- `scripts/build-capacitor.sh` — build web statis (otomatis singkirkan route Serwist)
- `android/` — project Android (Capacitor), sudah ada izin kamera buat scan barcode
- `.github/workflows/build-apk.yml` — build APK otomatis tiap push ke `main`

## Cara build APK (GitHub Actions)
1. Push project ini ke repo GitHub kamu (branch `main`)
2. Buka tab **Actions** → workflow **Build Android APK** akan jalan otomatis
3. Selesai → download file `warung-resoyudan-apk` dari **Artifacts**
4. Install APK di HP (debug build, perlu "install from unknown sources")

## Cara build ulang web-nya (lokal)
```bash
pnpm install
bash scripts/build-capacitor.sh   # hasil di folder out/
npx cap sync android
```

## Catatan penting
- Database pakai Firebase project milik pembuat repo (`warung-resoyudan`).
  Buat Firebase project sendiri dan ganti config di `src/lib/firebase.ts`
  sebelum dipakai beneran — kalau tidak, datamu masuk ke project orang.
- Build APK lokal butuh JDK 17 + Android SDK; kalau gagal, pakai GitHub Actions.
