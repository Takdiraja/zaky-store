/**
 * Loading fallback saat navigasi antar halaman.
 * Next.js otomatis menampilkan ini selama route baru dimuat.
 */
export default function Loading() {
  return (
    <div className="space-y-4 p-4 animate-pulse" aria-label="Memuat...">
      {/* Header skeleton */}
      <div className="h-8 w-40 rounded-lg bg-surface-container-high" />
      {/* Search bar skeleton */}
      <div className="h-12 w-full rounded-xl bg-surface-container-high" />
      {/* Filter chips skeleton */}
      <div className="flex gap-2">
        <div className="h-9 w-20 rounded-full bg-surface-container-high" />
        <div className="h-9 w-20 rounded-full bg-surface-container-high" />
        <div className="h-9 w-20 rounded-full bg-surface-container-high" />
      </div>
      {/* List items skeleton */}
      <div className="space-y-3 pt-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 w-full rounded-2xl bg-surface-container-high"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
