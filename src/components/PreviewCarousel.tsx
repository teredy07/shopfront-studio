import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { MediaThumbnail } from "@/components/MediaThumbnail";
import { StarBurstButton } from "@/components/StarBurstButton";
import type { PreviewSlide } from "@/lib/catalog";
import { springSnappy } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  slides: PreviewSlide[];
  alt: string;
  /** Shown before a video slide plays, and as its thumbnail. */
  poster?: string | undefined;
  viewTransitionName?: string | undefined;
};

const SWIPE_DISTANCE = 80;

const slideVariants: Variants = {
  enter: (direction: number) => ({ x: `${direction * 100}%`, opacity: 1, zIndex: 1 }),
  center: { x: 0, opacity: 1, zIndex: 1 },
  exit: (direction: number) => ({ x: `${direction * -35}%`, opacity: 0, zIndex: 0 }),
};

const arrowClassName =
  "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary/70 bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:bg-primary/90";

export function PreviewCarousel({ slides, alt, poster, viewTransitionName }: Props) {
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const reduceMotion = useReducedMotion();
  const count = slides.length;
  const slide = slides[index];

  if (!slide) return null;

  const paginate = (delta: number) =>
    setPage(([current]) => [(current + delta + count) % count, delta]);
  const goTo = (target: number) =>
    setPage(([current]) => [target, target === current ? 0 : target > current ? 1 : -1]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (count < 2 || event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft") paginate(-1);
    else if (event.key === "ArrowRight") paginate(1);
    else return;
    event.preventDefault();
  }

  const draggable = count > 1 && slide.type === "image";

  return (
    <div>
      <div
        data-shared-media
        role="region"
        aria-roledescription="carousel"
        aria-label={`${alt} previews`}
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={handleKeyDown}
        style={viewTransitionName ? { viewTransitionName } : undefined}
        className="relative aspect-square w-full overflow-hidden rounded-xl bg-black"
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reduceMotion ? { duration: 0 } : { x: springSnappy, opacity: { duration: 0.25 } }
            }
            drag={draggable ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              const swipe = info.offset.x + info.velocity.x * 0.2;
              if (swipe <= -SWIPE_DISTANCE) paginate(1);
              else if (swipe >= SWIPE_DISTANCE) paginate(-1);
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            className={cn(
              "absolute inset-0",
              draggable && "cursor-grab touch-pan-y active:cursor-grabbing",
            )}
          >
            {slide.type === "video" ? (
              <VideoSlide src={slide.src} poster={poster} />
            ) : slide.type === "youtube" ? (
              <iframe
                src={slide.src}
                title={`${alt} video preview`}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <img
                src={slide.src}
                alt={alt}
                draggable={false}
                className="h-full w-full select-none bg-black object-contain"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            <StarBurstButton
              type="button"
              position="absolute"
              aria-label="Previous preview"
              className={cn(arrowClassName, "left-3")}
              onClick={() => paginate(-1)}
            >
              <ChevronLeft aria-hidden="true" size={24} strokeWidth={2.75} />
            </StarBurstButton>
            <StarBurstButton
              type="button"
              position="absolute"
              aria-label="Next preview"
              className={cn(arrowClassName, "right-3")}
              onClick={() => paginate(1)}
            >
              <ChevronRight aria-hidden="true" size={24} strokeWidth={2.75} />
            </StarBurstButton>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur-md"
            >
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {slides.map((item, itemIndex) => (
            <MediaThumbnail
              key={`${item.src}-${itemIndex}`}
              src={item.type === "image" ? item.src : poster}
              video={item.type !== "image"}
              label={`Show preview ${itemIndex + 1}${item.type === "image" ? "" : " (video)"}`}
              active={itemIndex === index}
              onSelect={() => goTo(itemIndex)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Shows the poster with a play button and only mounts the <video> once asked. Creating the
 * player stalls rendering for a moment while the browser sets up decoding, which would freeze a
 * slide transition; it also avoids fetching a large file nobody has asked to watch yet.
 */
function VideoSlide({ src, poster }: { src: string; poster?: string | undefined }) {
  const [state, setState] = useState<"poster" | "playing" | "failed">("poster");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Layout effect so play() runs within the click that requested it (Safari requires that).
  useLayoutEffect(() => {
    if (state === "playing") videoRef.current?.play().catch(() => {});
  }, [state]);

  if (state === "failed") {
    return (
      <div className="relative h-full w-full">
        {poster && <img src={poster} alt="" className="h-full w-full object-contain opacity-40" />}
        <p className="glass absolute inset-x-6 bottom-6 rounded-xl p-3 text-center text-sm text-muted-foreground">
          This preview video can't play in this browser. Try opening the page in another browser.
        </p>
      </div>
    );
  }

  if (state === "poster") {
    return (
      <button
        type="button"
        aria-label="Play video preview"
        onClick={() => setState("playing")}
        className="group/play relative block h-full w-full cursor-pointer"
      >
        {poster && (
          <img src={poster} alt="" draggable={false} className="h-full w-full object-contain" />
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/35 transition-colors duration-300 group-hover/play:bg-black/20">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_14px_40px_-10px_var(--gold-glow)] transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover/play:scale-110">
            <Play aria-hidden="true" className="ml-1 h-7 w-7 fill-current" />
          </span>
        </span>
      </button>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      controls
      playsInline
      onError={() => setState("failed")}
      className="h-full w-full bg-black object-contain"
    />
  );
}
