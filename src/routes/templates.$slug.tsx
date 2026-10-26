import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import { motion, useReducedMotion } from "motion/react";
import { products } from "@/lib/products";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { PreviewCarousel } from "@/components/PreviewCarousel";
import { StarBurstButton } from "@/components/StarBurstButton";
import { revealVariants, staggerParentVariants } from "@/lib/motion";

export const Route = createFileRoute("/templates/$slug")({
  loader: ({ params }) => {
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.product.name} — cashvibe`
      : "Template not found — cashvibe";
    const desc = loaderData?.product.blurb || "After Effects template";
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

function ProductPage() {
  const { product: p } = Route.useLoaderData();
  const prefersReducedMotion = useReducedMotion();
  const plainSpecsStart = p.specs.indexOf("Plugins needed:");
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← All templates
      </Link>
      <motion.div
        className="mt-6 grid gap-10 md:grid-cols-[1.4fr_1fr]"
        variants={staggerParentVariants}
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
      >
        <motion.div variants={revealVariants} custom={0}>
          {p.previewSlides || p.previewVideo ? (
            <PreviewCarousel
              slides={p.previewSlides ?? [{ type: "image", src: p.image }, { type: "video", src: p.previewVideo! }]}
              alt={p.name}
            />
          ) : p.compareImage || p.comparisonImages ? (
            <BeforeAfterSlider
              beforeSrc={p.comparisonImages?.[0].beforeSrc ?? p.compareImage ?? p.image}
              afterSrc={p.comparisonImages?.[0].afterSrc ?? p.image}
              images={p.comparisonImages}
              beforeLabel="Original"
              afterLabel={p.slug === "topaz-settings" || p.comparisonImages ? "After Topaz" : "Color corrected"}
              alt={p.name}
            />
          ) : (
            <img
              src={p.image}
              alt={p.name}
              width={1024}
              height={640}
              className="aspect-[16/10] w-full rounded-xl object-cover"
            />
          )}
        </motion.div>
        <motion.div variants={revealVariants} custom={1}>
          <p className="eyebrow">{p.category}</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">{p.name}</h1>
          {p.blurb && <p className="mt-4 text-muted-foreground">{p.blurb}</p>}
          {p.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {p.description}
            </p>
          )}
          <ul className="mt-6 space-y-2 border-t border-border pt-6 text-sm">
            {p.specs.map((s, index) => (
              <li key={s}>
                {s === "Softwares:" || (plainSpecsStart >= 0 && index >= plainSpecsStart) ? s : `- ${s}`}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex items-center gap-4">
            <span className="font-display text-4xl">{p.price === 0 ? "Free" : `€${p.price.toFixed(2)}`}</span>
            <StarBurstButton
              className="btn-buy"
              onClick={() => toast(p.price === 0 ? "Free download is coming soon." : "Checkout is coming soon.")}
            >
              {p.price === 0 ? "Download free" : "Buy & download"}
            </StarBurstButton>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
