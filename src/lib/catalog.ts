import { categories, products, type Product } from "@/lib/products";

export type Category = (typeof categories)[number];
export type PreviewSlide = NonNullable<Product["previewSlides"]>[number];
export type ComparePair = NonNullable<Product["comparisonImages"]>[number];

export type ProductMedia =
  | { kind: "gallery"; slides: PreviewSlide[] }
  | { kind: "compare"; pairs: ComparePair[]; beforeLabel: string; afterLabel: string }
  | { kind: "image"; src: string };

export type CatalogSearch = { category?: Exclude<Category, "All"> };

export type SpecGroup = { title: string | null; items: string[] };

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (categories as readonly string[]).includes(value);
}

/** Reads the home page's `?category=` filter, dropping anything that isn't a real category. */
export function parseCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const category = search["category"];
  return isCategory(category) && category !== "All" ? { category } : {};
}

export function formatPrice(price: number): string {
  return price === 0 ? "Free" : `€${price.toFixed(2)}`;
}

export function countByCategory(items: readonly Product[] = products): Record<Category, number> {
  const counts = Object.fromEntries(categories.map((category) => [category, 0])) as Record<
    Category,
    number
  >;
  for (const item of items) {
    counts.All += 1;
    if (isCategory(item.category) && item.category !== "All") counts[item.category] += 1;
  }
  return counts;
}

/** The main media block a product page leads with. */
export function getProductMedia(product: Product): ProductMedia {
  if (product.previewSlides || product.previewVideo) {
    return {
      kind: "gallery",
      slides: product.previewSlides ?? [
        { type: "image", src: product.image },
        ...(product.previewVideo ? [{ type: "video" as const, src: product.previewVideo }] : []),
      ],
    };
  }

  if (product.comparisonImages || product.compareImage) {
    return {
      kind: "compare",
      pairs: product.comparisonImages?.length
        ? product.comparisonImages
        : [{ beforeSrc: product.compareImage ?? product.image, afterSrc: product.image }],
      beforeLabel: "Original",
      afterLabel:
        product.slug === "topaz-settings" || product.comparisonImages
          ? "After Topaz"
          : "Color corrected",
    };
  }

  return { kind: "image", src: product.image };
}

/** The first images a visitor sees on the product page — worth fetching before they click. */
export function getPrimaryImages(product: Product): string[] {
  const media = getProductMedia(product);
  if (media.kind === "gallery") {
    return media.slides
      .filter((slide) => slide.type === "image")
      .slice(0, 2)
      .map((slide) => slide.src);
  }
  if (media.kind === "compare") {
    const first = media.pairs[0];
    return first ? [first.beforeSrc, first.afterSrc] : [];
  }
  return [media.src];
}

const warmedImages = new Set<string>();

/** Starts downloading images in the background so they paint instantly when shown. */
export function warmImages(urls: Iterable<string>) {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    if (warmedImages.has(url)) continue;
    warmedImages.add(url);
    const image = new Image();
    image.decoding = "async";
    image.src = url;
  }
}

export function warmProductMedia(product: Product) {
  warmImages(getPrimaryImages(product));
}

/** Other products to suggest on a product page: same category first. */
export function getRelatedProducts(product: Product, limit = 3): Product[] {
  const others = products.filter((item) => item.slug !== product.slug);
  return [
    ...others.filter((item) => item.category === product.category),
    ...others.filter((item) => item.category !== product.category),
  ].slice(0, limit);
}

/**
 * Specs are stored as a flat list where an entry ending in ":" (e.g. "Plugins needed:")
 * starts a new group. Entries before the first heading form an untitled group.
 */
export function groupSpecs(specs: readonly string[]): SpecGroup[] {
  const groups: SpecGroup[] = [];
  for (const spec of specs) {
    const text = spec.trim();
    if (!text) continue;
    if (text.endsWith(":")) {
      groups.push({ title: text.slice(0, -1).trim(), items: [] });
      continue;
    }
    const current = groups.at(-1);
    if (current) current.items.push(text);
    else groups.push({ title: null, items: [text] });
  }
  return groups.filter((group) => group.items.length > 0);
}
