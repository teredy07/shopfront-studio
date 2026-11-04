import { Link } from "@tanstack/react-router";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, type CSSProperties, type PointerEvent } from "react";

import { formatPrice, warmProductMedia } from "@/lib/catalog";
import { productCategoryPath, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";
import { claimSharedMedia } from "@/lib/view-transition";

// Fanned layout for the three covers; `depth` is how far each one drifts with the pointer.
const slots = [
  { position: "left-0 top-[14%] w-[50%]", rotate: "-rotate-[7deg]", depth: 14, float: "0s" },
  { position: "left-[25%] top-0 z-10 w-[52%]", rotate: "rotate-[2deg]", depth: 26, float: "-2.4s" },
  { position: "right-0 top-[20%] w-[48%]", rotate: "rotate-[8deg]", depth: 18, float: "-4.8s" },
] as const;

type Slot = (typeof slots)[number];

export function HeroShowcase({ products, intro }: { products: Product[]; intro: boolean }) {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 80, damping: 18, mass: 0.7 });
  const y = useSpring(pointerY, { stiffness: 80, damping: 18, mass: 0.7 });

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <div
      className="relative hidden aspect-[10/9] w-full lg:block"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
    >
      {slots.map((slot, index) => {
        const product = products[index];
        return product ? (
          <ShowcaseCard
            key={product.slug}
            product={product}
            slot={slot}
            index={index}
            x={x}
            y={y}
            intro={intro}
          />
        ) : null;
      })}
    </div>
  );
}

function ShowcaseCard({
  product,
  slot,
  index,
  x,
  y,
  intro,
}: {
  product: Product;
  slot: Slot;
  index: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
  intro: boolean;
}) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const offsetX = useTransform(x, (value) => value * slot.depth);
  const offsetY = useTransform(y, (value) => value * slot.depth);

  return (
    <motion.div
      style={{ x: offsetX, y: offsetY }}
      className={cn("absolute hover:z-30", slot.position)}
    >
      <div
        className={cn(intro && "reveal")}
        style={{ "--reveal-index": index + 3 } as CSSProperties}
      >
        <div className="float-y" style={{ "--float-delay": slot.float } as CSSProperties}>
          <Link
            to="/$category/$slug"
            params={{ category: productCategoryPath(product.category), slug: product.slug }}
            onPointerEnter={() => warmProductMedia(product)}
            onFocus={() => warmProductMedia(product)}
            onClick={() => claimSharedMedia(mediaRef.current)}
            className={cn(
              "group relative block rounded-[1.4rem] border border-white/10 bg-card p-2 shadow-[0_40px_80px_-30px_oklch(0_0_0/0.95)] transition-[rotate,scale,border-color] duration-500 ease-[var(--ease-out-expo)] hover:rotate-0 hover:scale-[1.04] hover:border-primary/50",
              slot.rotate,
            )}
          >
            <div ref={mediaRef} data-shared-media className="overflow-hidden rounded-2xl">
              <img
                src={product.image}
                alt=""
                width={1080}
                height={1350}
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
              />
            </div>
            <div className="glass absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
              <span className="truncate text-sm font-semibold text-foreground">{product.name}</span>
              <span className="shrink-0 text-xs font-bold text-gold">
                {formatPrice(product.price)}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
