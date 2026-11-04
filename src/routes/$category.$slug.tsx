import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { useEffect, type CSSProperties } from "react";
import { toast } from "sonner";
import { findProductBySlug, productCategoryPath, type Product } from "@/lib/products";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { PreviewCarousel } from "@/components/PreviewCarousel";
import { ProductCard } from "@/components/ProductCard";
import { StarBurstButton } from "@/components/StarBurstButton";
import {
  formatPrice,
  getProductMedia,
  getRelatedProducts,
  groupSpecs,
  isCategory,
  type ProductMedia,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { rememberViewedProduct, SHARED_MEDIA_NAME } from "@/lib/view-transition";

export const Route = createFileRoute("/$category/$slug")({
  loader: ({ params }) => {
    const product = findProductBySlug(params.slug);
    if (!product) throw notFound();
    const category = productCategoryPath(product.category);
    if (params.category !== category || params.slug !== product.slug) {
      throw redirect({ to: "/$category/$slug", params: { category, slug: product.slug } });
    }
    return { product };
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.product.name} — cashvibe`
      : "Pack not found — cashvibe";
    const desc = loaderData?.product.blurb || "After Effects pack";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: ProductPage,
});

const revealAt = (index: number) => ({ "--reveal-index": index }) as CSSProperties;

function ProductPage() {
  const { product } = Route.useLoaderData();
  // Remount per product so gallery position and transition names never carry between pages.
  return <ProductDetails key={product.slug} product={product} />;
}

function ProductDetails({ product: p }: { product: Product }) {
  const media = getProductMedia(p);
  const specGroups = groupSpecs(p.specs);
  const related = getRelatedProducts(p);
  const category = isCategory(p.category) && p.category !== "All" ? p.category : null;

  useEffect(() => {
    rememberViewedProduct(p.slug);
  }, [p.slug]);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-4 sm:px-6 md:pt-8">
      <nav
        aria-label="Breadcrumb"
        className="reveal flex items-center gap-1.5 text-sm text-muted-foreground"
        style={revealAt(0)}
      >
        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 py-1 transition hover:text-foreground"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
          />
          All packs
        </Link>
        {category && (
          <>
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 opacity-50" />
            <Link
              to="/"
              search={{ category }}
              hash="packs"
              className="py-1 transition hover:text-foreground"
            >
              {category}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-start lg:gap-14">
        <ProductMediaView product={p} media={media} />

        <div className="md:sticky md:top-28">
          <div className="reveal" style={revealAt(1)}>
            <p className="eyebrow">{p.category}</p>
            <h1 className="mt-2 font-display text-3xl md:text-4xl">{p.name}</h1>
            {p.blurb && <p className="mt-4 text-muted-foreground">{p.blurb}</p>}
            {p.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            )}
          </div>

          {specGroups.length > 0 && (
            <div className="reveal mt-6 space-y-5 border-t border-border pt-6" style={revealAt(2)}>
              {specGroups.map((group, groupIndex) => (
                <div key={`${group.title ?? "details"}-${groupIndex}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {group.title ?? "Details"}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item, itemIndex) => (
                      <li key={`${item}-${itemIndex}`} className="spec-chip">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div
            className="reveal mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4 pl-5"
            style={revealAt(3)}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Price</p>
              <p className="font-display text-4xl leading-tight">{formatPrice(p.price)}</p>
            </div>
            <StarBurstButton
              className="btn-buy"
              onClick={() =>
                toast(p.price === 0 ? "Free download is coming soon." : "Checkout is coming soon.")
              }
            >
              {p.price === 0 ? "Download free" : "Buy & download"}
            </StarBurstButton>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-24 md:mt-32">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Keep browsing</p>
              <h2 id="related-title" className="mt-2 font-display text-3xl md:text-4xl">
                More packs
              </h2>
            </div>
            <Link
              to="/"
              hash="packs"
              className="group hidden items-center gap-1.5 text-sm font-semibold text-gold sm:inline-flex"
            >
              View all
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, index) => (
              <li
                key={item.slug}
                className={cn("reveal-on-scroll", index === 2 && "hidden lg:block")}
              >
                <ProductCard product={item} compact />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function ProductMediaView({ product, media }: { product: Product; media: ProductMedia }) {
  if (media.kind === "gallery") {
    return (
      <PreviewCarousel
        slides={media.slides}
        alt={product.name}
        poster={product.image}
        viewTransitionName={SHARED_MEDIA_NAME}
      />
    );
  }
  if (media.kind === "compare") {
    return (
      <BeforeAfterSlider
        pairs={media.pairs}
        beforeLabel={media.beforeLabel}
        afterLabel={media.afterLabel}
        alt={product.name}
        viewTransitionName={SHARED_MEDIA_NAME}
      />
    );
  }
  return (
    <div
      data-shared-media
      style={{ viewTransitionName: SHARED_MEDIA_NAME }}
      className="overflow-hidden rounded-xl"
    >
      <img
        src={media.src}
        alt={product.name}
        width={1080}
        height={675}
        fetchPriority="high"
        className="aspect-[16/10] w-full object-cover"
      />
    </div>
  );
}
