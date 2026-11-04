import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowDown } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";

import { HeroShowcase } from "@/components/HeroShowcase";
import { ProductCard } from "@/components/ProductCard";
import { countByCategory, parseCatalogSearch, type Category } from "@/lib/catalog";
import { springSnappy } from "@/lib/motion";
import { categories, products, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

// The entrance animation plays once per visit; coming back to the catalog should feel instant.
let introPlayed = false;

const categoryCounts = countByCategory(products);
const freeCount = products.filter((product) => product.price === 0).length;
const showcase = categories
  .filter((category) => category !== "All")
  .map((category) => products.find((product) => product.category === category))
  .filter((product): product is Product => product !== undefined);

const revealAt = (index: number) => ({ "--reveal-index": index }) as CSSProperties;

export const Route = createFileRoute("/")({
  validateSearch: parseCatalogSearch,
  head: () => ({
    meta: [
      { title: "cashvibe — After Effects Templates" },
      {
        name: "description",
        content: "Premium After Effects templates: titles, transitions, logo reveals and overlays.",
      },
      { property: "og:title", content: "cashvibe — After Effects Templates" },
      {
        property: "og:description",
        content: "Premium After Effects templates: titles, transitions, logo reveals and overlays.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { category = "All" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const reduceMotion = useReducedMotion();
  const [intro] = useState(() => !introPlayed);
  const shown = category === "All" ? products : products.filter((p) => p.category === category);

  useEffect(() => {
    introPlayed = true;
  }, []);

  function selectCategory(next: Category) {
    // The filter lives in the URL so it survives reloads and the back button.
    void navigate({
      search: next === "All" ? {} : { category: next },
      replace: true,
      resetScroll: false,
      viewTransition: false,
    });
  }

  function scrollToCatalog(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    document
      .getElementById("templates")
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <main>
      <section className="relative isolate">
        <div aria-hidden="true" className="hero-aurora" />
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:pt-14">
          <div>
            <p
              className={cn("eyebrow inline-flex items-center gap-2.5", intro && "reveal")}
              style={revealAt(0)}
            >
              <span aria-hidden="true" className="pulse-dot" />
              After Effects templates
            </p>
            <h1
              className={cn(
                "mt-5 font-display text-5xl leading-[0.95] sm:text-6xl md:text-8xl lg:text-7xl",
                intro && "reveal",
              )}
              style={revealAt(1)}
            >
              Motion that <span className="text-gold-gradient">moves</span> people.
            </h1>
            <p
              className={cn("mt-6 max-w-xl text-lg text-muted-foreground", intro && "reveal")}
              style={revealAt(2)}
            >
              Ready-made project files for editors and creators. Download, drop in your footage,
              render.
            </p>
            <div
              className={cn("mt-9 flex flex-wrap items-center gap-3", intro && "reveal")}
              style={revealAt(3)}
            >
              <a href="#templates" className="btn-primary group" onClick={scrollToCatalog}>
                Browse templates
                <ArrowDown
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5"
                />
              </a>
              <span className="stat-pill">
                <strong>{products.length}</strong> templates
              </span>
              <span className="stat-pill">
                <strong>{freeCount}</strong> free downloads
              </span>
            </div>
          </div>
          <HeroShowcase products={showcase} intro={intro} />
        </div>
      </section>

      <section
        id="templates"
        aria-labelledby="templates-title"
        className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-24 sm:px-6"
      >
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2 id="templates-title" className="mt-2 font-display text-3xl md:text-4xl">
              Templates
            </h2>
          </div>
          <LayoutGroup id="category-filter">
            <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = c === category;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectCategory(c)}
                    className={cn("chip", active && "chip-active")}
                  >
                    {active && (
                      <motion.span
                        layoutId="category-pill"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-primary shadow-[0_8px_24px_-10px_var(--gold-glow)]"
                        transition={reduceMotion ? { duration: 0 } : springSnappy}
                      />
                    )}
                    <span className="relative">{c}</span>
                    <span className="relative text-xs tabular-nums opacity-60">
                      {categoryCounts[c]}
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>

        <ul className="relative grid grid-cols-1 gap-6 sm:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((product, index) => (
              <motion.li
                key={product.slug}
                layout={!reduceMotion}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={reduceMotion ? { duration: 0 } : springSnappy}
              >
                <div className="reveal-on-scroll">
                  <ProductCard product={product} priority={index < 2} sharedMedia />
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {shown.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No templates in this category yet.
          </p>
        )}
      </section>
    </main>
  );
}
