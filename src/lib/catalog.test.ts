import { describe, expect, it } from "vitest";

import {
  countByCategory,
  formatPrice,
  getPrimaryImages,
  getProductMedia,
  getRelatedProducts,
  groupSpecs,
  parseCatalogSearch,
} from "@/lib/catalog";
import { products, type Product } from "@/lib/products";

const baseProduct: Product = {
  slug: "test",
  name: "Test",
  category: "CC",
  price: 0,
  image: "/cover.avif",
  blurb: "",
  specs: [],
};

describe("groupSpecs", () => {
  it("turns entries ending in a colon into group titles", () => {
    expect(
      groupSpecs(["Softwares:", "Topaz Video AI", "After Effects 2025", "Plugins needed:", "BCC"]),
    ).toEqual([
      { title: "Softwares", items: ["Topaz Video AI", "After Effects 2025"] },
      { title: "Plugins needed", items: ["BCC"] },
    ]);
  });

  it("keeps entries before the first heading in an untitled group", () => {
    expect(groupSpecs(["After Effects 2020+", "Plugins needed:", "Magic Bullet Looks"])).toEqual([
      { title: null, items: ["After Effects 2020+"] },
      { title: "Plugins needed", items: ["Magic Bullet Looks"] },
    ]);
  });

  it("drops headings without entries and blank lines", () => {
    expect(groupSpecs(["Softwares:", "", "Plugins needed:", "Sapphire"])).toEqual([
      { title: "Plugins needed", items: ["Sapphire"] },
    ]);
  });
});

describe("formatPrice", () => {
  it("shows Free for zero and euros otherwise", () => {
    expect(formatPrice(0)).toBe("Free");
    expect(formatPrice(2.5)).toBe("€2.50");
  });
});

describe("parseCatalogSearch", () => {
  it("accepts real categories and drops everything else", () => {
    expect(parseCatalogSearch({ category: "CC" })).toEqual({ category: "CC" });
    expect(parseCatalogSearch({ category: "All" })).toEqual({});
    expect(parseCatalogSearch({ category: "nope" })).toEqual({});
    expect(parseCatalogSearch({ category: 3 })).toEqual({});
    expect(parseCatalogSearch({})).toEqual({});
  });
});

describe("getProductMedia", () => {
  it("builds a gallery from a preview video when there are no slides", () => {
    expect(getProductMedia({ ...baseProduct, previewVideo: "/clip.mp4" })).toEqual({
      kind: "gallery",
      slides: [
        { type: "image", src: "/cover.avif" },
        { type: "video", src: "/clip.mp4" },
      ],
    });
  });

  it("compares the cover against a single before image", () => {
    expect(getProductMedia({ ...baseProduct, compareImage: "/before.avif" })).toMatchObject({
      kind: "compare",
      pairs: [{ beforeSrc: "/before.avif", afterSrc: "/cover.avif" }],
      afterLabel: "Color corrected",
    });
  });

  it("falls back to the cover image", () => {
    expect(getProductMedia(baseProduct)).toEqual({ kind: "image", src: "/cover.avif" });
  });

  it("gives every catalog product media to show", () => {
    for (const product of products) {
      expect(getPrimaryImages(product).length).toBeGreaterThan(0);
    }
  });
});

describe("catalog listings", () => {
  it("counts every product under All and its own category", () => {
    const counts = countByCategory(products);
    expect(counts.All).toBe(products.length);
    expect(counts.Topaz + counts.CC + counts.Packs).toBe(products.length);
  });

  it("suggests other products, same category first", () => {
    const [product] = products;
    if (!product) throw new Error("The catalog is empty.");
    const related = getRelatedProducts(product);
    expect(related).toHaveLength(Math.min(3, products.length - 1));
    expect(related.some((item) => item.slug === product.slug)).toBe(false);
    expect(related[0]?.category).toBe(product.category);
  });
});
