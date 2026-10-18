import { describe, it, expect, beforeEach } from "vitest";
import { useProductStore } from "./use-product-store";
import type { Product } from "@/types";

function makeProduct(overrides: Partial<Product> & { id: string }): Product {
  return {
    name: "Test",
    brand: null,
    category: "Makanan",
    barcode: null,
    image_url: null,
    buyPrice: 1000,
    sellPrice: 1500,
    stock: 10,
    minStock: 0,
    isActive: true,
    createdAt: "2026-10-15T00:00:00.000Z",
    updatedAt: "2026-10-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("findProductByBarcode dengan alias", () => {
  beforeEach(() => {
    useProductStore.setState({
      products: [
        makeProduct({ id: "p1", name: "Indomie", barcode: "8991234567891", barcodes: ["8991234567800", "12345"] }),
        makeProduct({ id: "p2", name: "Aqua", barcode: "8999999999999" }),
        makeProduct({ id: "p3", name: "Nonaktif", barcode: "8111111111111", isActive: false }),
      ],
    });
  });

  it("menemukan via barcode utama (exact)", () => {
    expect(useProductStore.getState().findProductByBarcode("8991234567891")?.id).toBe("p1");
  });

  it("menemukan via barcode alias", () => {
    expect(useProductStore.getState().findProductByBarcode("8991234567800")?.id).toBe("p1");
    expect(useProductStore.getState().findProductByBarcode("12345")?.id).toBe("p1");
  });

  it("menemukan via alias dengan toleransi leading zero", () => {
    // UPC-A 12 digit vs EAN-13: "012345" -> strip -> "12345" cocok alias p1
    expect(useProductStore.getState().findProductByBarcode("012345")?.id).toBe("p1");
  });

  it("tidak menemukan barcode yang tidak terdaftar", () => {
    expect(useProductStore.getState().findProductByBarcode("0000000000000")).toBeUndefined();
  });

  it("tidak menemukan produk nonaktif walau barcode cocok", () => {
    expect(useProductStore.getState().findProductByBarcode("8111111111111")).toBeUndefined();
  });

  it("trim spasi di input", () => {
    expect(useProductStore.getState().findProductByBarcode("  8999999999999  ")?.id).toBe("p2");
  });
});
