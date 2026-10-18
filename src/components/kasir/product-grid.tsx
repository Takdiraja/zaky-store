"use client";

import { useShallow } from "zustand/react/shallow";
import { useProductStore } from "@/stores/use-product-store";
import ProductCard from "./product-card";
import EmptyState from "@/components/shared/empty-state";
import { SkeletonList } from "@/components/shared/skeleton";

export default function ProductGrid() {
  const products = useProductStore(useShallow((s) => s.getFilteredProducts()));
  const loading = useProductStore((s) => s.loading);

  if (loading) {
    return (
      <section className="px-4 py-4 sm:px-6">
        <SkeletonList count={8} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" />
      </section>
    );
  }

  return (
    <section className="px-4 py-4 sm:px-6">
      {products.length === 0 ? (
        <EmptyState
          icon="search_off"
          title="Tidak ada produk"
          description="Coba kata kunci lain atau ubah kategori."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
