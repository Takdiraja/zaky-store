/**
 * Product barcode lookup service.
 *
 * Primary: Open Food Facts API (free, open source, CORS-enabled)
 * Fallback: Local mock database when API is unreachable
 */

export interface BarcodeLookupResult {
  name: string;
  brand: string;
  category: string;
  image_url: string;
}

// --- Category normalization ---

const categoryMap: Record<string, string> = {
  "instant noodles": "Makanan",
  "noodles": "Makanan",
  "pasta": "Makanan",
  "rice": "Makanan",
  "cereals": "Makanan",
  "snacks": "Makanan",
  "biscuits": "Makanan",
  "cookies": "Makanan",
  "chocolate": "Makanan",
  "confectionery": "Makanan",
  "candy": "Makanan",
  "soft drinks": "Minuman",
  "carbonated drinks": "Minuman",
  "beverages": "Minuman",
  "mineral water": "Minuman",
  "waters": "Minuman",
  "juices": "Minuman",
  "coffee": "Minuman",
  "tea": "Minuman",
  "milk": "Minuman",
  "dairy": "Minuman",
  "yogurt": "Minuman",
  "vegetable oils": "Sembako",
  "oils": "Sembako",
  "grain": "Sembako",
  "grains": "Sembako",
  "sugars": "Sembako",
  "sugar": "Sembako",
  "salt": "Sembako",
  "spices": "Sembako",
  "flour": "Sembako",
  "cigarettes": "Rokok",
  "tobacco": "Rokok",
  "cleaning products": "Kebutuhan Rumah",
  "detergents": "Kebutuhan Rumah",
  "household": "Kebutuhan Rumah",
  "personal hygiene": "Kebutuhan Rumah",
  "hygiene": "Kebutuhan Rumah",
  "cosmetics": "Kebutuhan Rumah",
};

function normalizeCategory(raw: string | null): string {
  if (!raw) return "Makanan";

  const normalized = raw
    .toLowerCase()
    .replace(/[,/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Try exact match first
  if (categoryMap[normalized]) return categoryMap[normalized];

  // Try partial match — check if any key is contained in the string
  const matched = Object.entries(categoryMap).find(([key]) =>
    normalized.includes(key)
  );

  return matched ? matched[1] : "Makanan";
}

function normalizeBrand(raw: string | null): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// --- Open Food Facts API ---

const OFF_BASE = "https://world.openfoodfacts.org/api/v2/product";
const FETCH_TIMEOUT = 3000;

async function fetchFromOpenFoodFacts(
  barcode: string,
): Promise<BarcodeLookupResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(`${OFF_BASE}/${barcode}.json`, {
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = await res.json();

    if (data.status !== 1) return null;

    const p = data.product;
    const productName = p.product_name || p.product_name_en || "";
    const brands = p.brands || "";
    const categories = p.categories || "";
    const imageUrl = p.image_url || p.image_front_url || "";

    if (!productName) return null;

    return {
      name: productName.trim(),
      brand: normalizeBrand(brands),
      category: normalizeCategory(categories),
      image_url: imageUrl.trim(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// --- Mock database fallback ---

const barcodeDB: Record<string, BarcodeLookupResult> = {
  "8991002101234": { name: "Beras Ramos 5kg", category: "Sembako", brand: "Ramos", image_url: "" },
  "8991002104567": { name: "Minyak Goreng Bimoli 1L", category: "Sembako", brand: "Indofood", image_url: "" },
  "8991002107890": { name: "Gula Pasir Gulaku 1kg", category: "Sembako", brand: "Gulaku", image_url: "" },
  "8991002110123": { name: "Kopi Kapal Api Sachet", category: "Minuman", brand: "Kapal Api", image_url: "" },
  "8991002113456": { name: "Indomie Goreng", category: "Makanan", brand: "Indomie", image_url: "" },
  "8991002116789": { name: "Kecap Manis ABC Botol 275ml", category: "Kebutuhan Rumah", brand: "ABC", image_url: "" },
  "8991002120123": { name: "Saos Sambal ABC Botol 275ml", category: "Kebutuhan Rumah", brand: "ABC", image_url: "" },
  "8991002123456": { name: "Garam Halus Refina 250g", category: "Sembako", brand: "Refina", image_url: "" },
  "8991002126789": { name: "Tepung Terigu Segitiga Biru 1kg", category: "Sembako", brand: "Bogasari", image_url: "" },
  "8991002130123": { name: "Sabun Cuci Piring Sunlight 450ml", category: "Kebutuhan Rumah", brand: "Sunlight", image_url: "" },
  "8991002133456": { name: "Shampoo Lifebuoy Sachet", category: "Kebutuhan Rumah", brand: "Lifebuoy", image_url: "" },
  "8991002136789": { name: "Rokok Surya Gudang Garam 12", category: "Rokok", brand: "Gudang Garam", image_url: "" },
  "8991002140123": { name: "Biskuit Roma Kelapa", category: "Makanan", brand: "Roma", image_url: "" },
  "8991002143456": { name: "Susu Kental Manis Frisian Flag", category: "Minuman", brand: "Frisian Flag", image_url: "" },
  "8998866200103": { name: "Teh Botol Sosro 500ml", category: "Minuman", brand: "Sosro", image_url: "" },
  "8998866200127": { name: "Teh Botol Sosro 200ml", category: "Minuman", brand: "Sosro", image_url: "" },
  "8998866200134": { name: "Fruit Tea Apel 500ml", category: "Minuman", brand: "Sosro", image_url: "" },
  "8991002124563": { name: "Mie Sedaap Goreng", category: "Makanan", brand: "Mie Sedaap", image_url: "" },
  "8991002124570": { name: "Mie Sedaap Soto", category: "Makanan", brand: "Mie Sedaap", image_url: "" },
  "8991002114563": { name: "Indomie Kuah Rendang", category: "Makanan", brand: "Indomie", image_url: "" },
  "8991002114570": { name: "Indomie Kuah Kari Ayam", category: "Makanan", brand: "Indomie", image_url: "" },
  "8995899100015": { name: "Aqua 600ml", category: "Minuman", brand: "Aqua", image_url: "" },
  "8995899100022": { name: "Aqua 1500ml", category: "Minuman", brand: "Aqua", image_url: "" },
  "8995899100039": { name: "Aqua 330ml", category: "Minuman", brand: "Aqua", image_url: "" },
  "8992696100114": { name: "Coca-Cola 390ml", category: "Minuman", brand: "Coca-Cola", image_url: "" },
  "8992696100121": { name: "Sprite 390ml", category: "Minuman", brand: "Sprite", image_url: "" },
  "8992696100138": { name: "Fanta 390ml", category: "Minuman", brand: "Fanta", image_url: "" },
  "8992761100016": { name: "Silver Queen 62g", category: "Makanan", brand: "Silver Queen", image_url: "" },
  "8992761100023": { name: "Beng-Beng 40g", category: "Makanan", brand: "Beng-Beng", image_url: "" },
  "8991102103125": { name: "Kacang Dua Kelinci 250g", category: "Makanan", brand: "Dua Kelinci", image_url: "" },
  "8991102103132": { name: "Kacang Dua Kelinci 500g", category: "Makanan", brand: "Dua Kelinci", image_url: "" },
  "8993175112099": { name: "Nuvo Family 135g", category: "Kebutuhan Rumah", brand: "Nuvo", image_url: "" },
  "8993175113133": { name: "Lifebuoy Sabun Batang 100g", category: "Kebutuhan Rumah", brand: "Lifebuoy", image_url: "" },
  "8999909050734": { name: "Pepsodent Pasta Gigi 75g", category: "Kebutuhan Rumah", brand: "Pepsodent", image_url: "" },
  "8999909050741": { name: "Pepsodent Pasta Gigi 120g", category: "Kebutuhan Rumah", brand: "Pepsodent", image_url: "" },
  "8999909050758": { name: "Close Up Pasta Gigi 100g", category: "Kebutuhan Rumah", brand: "Close Up", image_url: "" },
  "8997201100169": { name: "Super Pel 800ml", category: "Kebutuhan Rumah", brand: "Super Pel", image_url: "" },
  "8997201100176": { name: "So Klin Pewangi 800ml", category: "Kebutuhan Rumah", brand: "So Klin", image_url: "" },
  "8997201100183": { name: "RINSO Deterjen 900g", category: "Kebutuhan Rumah", brand: "RINSO", image_url: "" },
  "8997201100190": { name: "Dawn Sabun Cuci Piring 650ml", category: "Kebutuhan Rumah", brand: "Dawn", image_url: "" },
  "8997201100206": { name: "Mama Lemon 800ml", category: "Kebutuhan Rumah", brand: "Mama Lemon", image_url: "" },
  "8998691314723": { name: "Taro Net 100g", category: "Makanan", brand: "Taro", image_url: "" },
  "8998691314730": { name: "Qtela 115g", category: "Makanan", brand: "Qtela", image_url: "" },
  "8998691314747": { name: "Chitato 68g", category: "Makanan", brand: "Chitato", image_url: "" },
  "8998691314754": { name: "Lays 68g", category: "Makanan", brand: "Lays", image_url: "" },
  "8998691314761": { name: "Doritos 68g", category: "Makanan", brand: "Doritos", image_url: "" },
};

/**
 * Look up product details by barcode.
 *
 * 1. Tries Open Food Facts API (with 3s timeout)
 * 2. Falls back to local mock database
 * 3. Returns null if nothing found
 */
export async function lookupBarcode(
  barcode: string,
): Promise<BarcodeLookupResult | null> {
  // Try Open Food Facts API first
  const result = await fetchFromOpenFoodFacts(barcode);
  if (result) return result;

  // Fallback to mock database
  const mock = barcodeDB[barcode];
  if (mock) {
    // Simulate small delay for consistency
    await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
    return { ...mock };
  }

  return null;
}
