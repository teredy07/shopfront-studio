import { createFileRoute, Link } from "@tanstack/react-router";
import { products } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Frameforge — After Effects Templates" },
      { name: "description", content: "Premium After Effects templates: titles, transitions, logo reveals and overlays." },
      { property: "og:title", content: "Frameforge — After Effects Templates" },
      { property: "og:description", content: "Premium After Effects templates: titles, transitions, logo reveals and overlays." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto max-w-6xl px-6 pb-24">
      <section className="py-20 md:py-28">
        <p className="eyebrow">After Effects templates</p>
        <h1 className="mt-4 font-display text-5xl leading-[0.95] md:text-8xl">
          Motion that <span className="text-primary">moves</span> people.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Ready-made project files for editors and creators. Download, drop in your footage, render.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {products.map((p) => (
          <Link key={p.slug} to="/templates/$slug" params={{ slug: p.slug }} className="product-card group">
            <div className="overflow-hidden rounded-lg">
              <img src={p.image} alt={p.name} width={1024} height={640} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{p.category}</p>
                <h2 className="mt-1 font-display text-2xl">{p.name}</h2>
              </div>
              <span className="price-tag">${p.price}</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
