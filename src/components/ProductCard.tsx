import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";

import { formatPrice, warmProductMedia } from "@/lib/catalog";
import { productCategoryPath, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";
import { claimSharedMedia, wasLastViewed } from "@/lib/view-transition";

type Props = {
  product: Product;
  /** Load the cover immediately — for cards in the first screenful. */
  priority?: boolean;
  /** Let this card receive the page-transition morph when coming back from its product page. */
  sharedMedia?: boolean;
  compact?: boolean;
};

export function ProductCard({
  product: p,
  priority = false,
  sharedMedia = false,
  compact = false,
}: Props) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoState, setVideoState] = useState<"idle" | "playing" | "failed">("idle");

  function handlePointerMove(event: PointerEvent<HTMLAnchorElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }

  function startPreview() {
    warmProductMedia(p);
    // play() rejects if a quick hover-out pauses it first; that's expected.
    if (videoState !== "failed") videoRef.current?.play().catch(() => {});
  }

  function stopPreview() {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setVideoState((state) => (state === "failed" ? state : "idle"));
  }

  return (
    <Link
      to="/$category/$slug"
      params={{ category: productCategoryPath(p.category), slug: p.slug }}
      className="product-card group"
      onPointerEnter={startPreview}
      onPointerLeave={stopPreview}
      onPointerMove={handlePointerMove}
      onFocus={() => warmProductMedia(p)}
      onClick={() => claimSharedMedia(mediaRef.current)}
    >
      <div
        ref={mediaRef}
        data-shared-media
        data-last-viewed={sharedMedia && wasLastViewed(p.slug) ? "" : undefined}
        className="relative overflow-hidden rounded-lg bg-background"
      >
        <img
          src={p.image}
          alt={p.name}
          width={1080}
          height={675}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
        />
        {p.hoverVideo && videoState !== "failed" && (
          <video
            ref={videoRef}
            src={p.hoverVideo}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            onPlaying={() => setVideoState("playing")}
            onError={() => setVideoState("failed")}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              videoState === "playing" ? "opacity-100" : "opacity-0",
            )}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-2/3 items-end bg-gradient-to-t from-black/95 via-black/55 to-transparent p-5">
          <span
            className={cn(
              "font-display font-extrabold text-white drop-shadow-md",
              compact ? "text-2xl" : "text-2xl sm:text-3xl",
            )}
          >
            {p.coverTitle ?? p.name}
          </span>
        </div>
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
        >
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4 px-1 pb-1">
        <div className="min-w-0">
          <p className="eyebrow">{p.category}</p>
          <h3 className={cn("mt-1 text-balance font-display", compact ? "text-xl" : "text-2xl")}>
            {p.name}
          </h3>
        </div>
        <span className={cn("price-tag", p.price === 0 && "price-tag-free")}>
          {formatPrice(p.price)}
        </span>
      </div>
    </Link>
  );
}
