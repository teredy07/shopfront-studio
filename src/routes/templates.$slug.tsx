import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { findProductBySlug, productCategoryPath } from "@/lib/products";

/** Sends old product URLs to the category-based URL. */
export const Route = createFileRoute("/templates/$slug")({
  loader: ({ params }) => {
    const product = findProductBySlug(params.slug);
    if (!product) throw notFound();
    throw redirect({
      to: "/$category/$slug",
      params: { category: productCategoryPath(product.category), slug: product.slug },
    });
  },
});
