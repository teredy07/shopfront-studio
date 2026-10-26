import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { products, categories, type Product } from "@/lib/products";
import { revealVariants, staggerParentVariants } from "@/lib/motion";

export const Route = createFileRoute("/")({
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
  const [cat, setCat] = useState<string>("All");
  const prefersReducedMotion = useReducedMotion();
  const shown = cat === "All" ? products : products.filter((p) => p.category === cat);
  return (
    <main className="mx-auto max-w-6xl px-6 pb-24">
      <motion.section
        className="py-20 md:py-28"
        variants={staggerParentVariants}
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
      >
        <motion.p className="eyebrow" variants={revealVariants} custom={0}>
          After Effects templates
        </motion.p>
        <motion.h1
          className="mt-4 font-display text-5xl leading-[0.95] md:text-8xl"
          variants={revealVariants}
          custom={1}
        >
          Motion that <span className="text-gold">moves</span> people.
        </motion.h1>
        <motion.p
          className="mt-6 max-w-xl text-lg text-muted-foreground"
          variants={revealVariants}
          custom={2}
        >
          Ready-made project files for editors and creators. Download, drop in your footage, render.
        </motion.p>
      </motion.section>

      <motion.div
        className="mb-8 flex flex-wrap gap-2"
        variants={staggerParentVariants}
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
      >
        {categories.map((c, index) => (
          <motion.button
            key={c}
            onClick={() => setCat(c)}
            className={c === cat ? "chip chip-active" : "chip"}
            variants={revealVariants}
            custom={index}
          >
            {c}
          </motion.button>
        ))}
      </motion.div>

      <section key={cat} className="grid gap-6 sm:grid-cols-2">
        {shown.map((p, index) => (
          <ProductCard
            key={p.slug}
            product={p}
            index={index}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </section>
    </main>
  );
}

function ProductCard({
  product: p,
  index,
  prefersReducedMotion,
}: {
  product: Product;
  index: number;
  prefersReducedMotion: boolean | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <motion.div
      variants={revealVariants}
      custom={index}
      initial={prefersReducedMotion ? false : "hidden"}
      whileInView={prefersReducedMotion ? undefined : "visible"}
      viewport={{ once: false, amount: 0.15 }}
    >
      <Link
        to="/templates/$slug"
        params={{ slug: p.slug }}
        className="product-card group"
        onMouseEnter={() => videoRef.current?.play()}
        onMouseLeave={() => {
          const v = videoRef.current;
          if (v) {
            v.pause();
            v.currentTime = 0;
          }
        }}
      >
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={p.image}
            alt={p.name}
            width={1024}
            height={640}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-2/3 items-end bg-gradient-to-t from-black/95 via-black/55 to-transparent p-5">
            <span className="font-display text-2xl font-extrabold text-white drop-shadow-md sm:text-3xl">
              {p.coverTitle ?? p.name}
            </span>
          </div>
          {p.hoverVideo && (
            <video
              ref={videoRef}
              src={p.hoverVideo}
              muted
              loop
              playsInline
              preload="none"
              className="absolute inset-0 aspect-[16/10] w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{p.category}</p>
            <h2 className="mt-1 font-display text-2xl">{p.name}</h2>
          </div>
          <span className="price-tag">{p.price === 0 ? "Free" : `€${p.price.toFixed(2)}`}</span>
        </div>
      </Link>
    </motion.div>
  );
}
