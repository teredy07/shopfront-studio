import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import { products } from "@/lib/products";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";

export const Route = createFileRoute("/templates/$slug")({
  loader: ({ params }) => {
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.product.name} — Frameforge` : "Template not found — Frameforge";
    const desc = loaderData?.product.blurb ?? "After Effects template";
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
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← All templates</Link>
      <div className="mt-6 grid gap-10 md:grid-cols-[1.4fr_1fr]">
        <img src={p.image} alt={p.name} width={1024} height={640} className="aspect-[16/10] w-full rounded-xl object-cover" />
        <div>
          <p className="eyebrow">{p.category}</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{p.name}</h1>
          <p className="mt-4 text-muted-foreground">{p.blurb}</p>
          <ul className="mt-6 space-y-2 border-t border-border pt-6 text-sm">
            {p.specs.map((s) => (<li key={s}>— {s}</li>))}
          </ul>
          <div className="mt-8 flex items-center gap-4">
            <span className="font-display text-4xl">${p.price}</span>
            <button className="btn-buy" onClick={() => toast("Checkout is coming soon.")}>Buy & download</button>
          </div>
        </div>
      </div>
    </main>
  );
}
