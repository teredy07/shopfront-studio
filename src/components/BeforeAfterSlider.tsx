import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeftRight } from "lucide-react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { MediaThumbnail } from "@/components/MediaThumbnail";
import { StarBurstButton } from "@/components/StarBurstButton";
import { warmImages, type ComparePair } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Props = {
  pairs: ComparePair[];
  beforeLabel?: string;
  afterLabel?: string;
  alt: string;
  viewTransitionName?: string | undefined;
};

const MIN = 2;
const MAX = 98;
const clamp = (value: number) => Math.min(MAX, Math.max(MIN, value));

const arrowClassName =
  "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary/70 bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:bg-primary/90";
const labelClassName =
  "pointer-events-none absolute top-3 z-10 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold backdrop-blur";

export function BeforeAfterSlider({
  pairs,
  beforeLabel = "Before",
  afterLabel = "After",
  alt,
  viewTransitionName,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [pairIndex, setPairIndex] = useState(0);
  const [touched, setTouched] = useState(false);
  const reduceMotion = useReducedMotion();
  const inView = useInView(frameRef, { once: true, amount: 0.6 });

  // The divider position (percent) lives in a motion value, so dragging never re-renders React.
  const position = useMotionValue(50);
  const clipPath = useTransform(position, (value) => `inset(0 ${100 - value}% 0 0)`);
  const dividerLeft = useTransform(position, (value) => `${value}%`);
  const beforeLabelOpacity = useTransform(position, [MIN, 18], [0, 1]);
  const afterLabelOpacity = useTransform(position, [82, MAX], [1, 0]);

  useMotionValueEvent(position, "change", (value) => {
    frameRef.current?.setAttribute("aria-valuenow", String(Math.round(value)));
  });

  useEffect(() => {
    warmImages(pairs.flatMap((pair) => [pair.beforeSrc, pair.afterSrc]));
  }, [pairs]);

  // A one-time nudge shows visitors that the divider can be dragged.
  useEffect(() => {
    if (!inView || touched || reduceMotion) return;
    const controls = animate(position, [50, 34, 64, 50], {
      duration: 1.8,
      ease: "easeInOut",
      delay: 0.5,
    });
    return () => controls.stop();
  }, [inView, touched, reduceMotion, position]);

  const pair = pairs[pairIndex] ?? pairs[0];
  if (!pair) return null;

  function glideTo(value: number) {
    animate(
      position,
      clamp(value),
      reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 },
    );
  }

  function positionAt(clientX: number) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return position.get();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    setTouched(true);
    glideTo(positionAt(event.clientX));
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (draggingRef.current) position.jump(clamp(positionAt(event.clientX)));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 15 : 5;
    const targets: Record<string, number> = {
      ArrowLeft: position.get() - step,
      ArrowRight: position.get() + step,
      Home: MIN,
      End: MAX,
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    setTouched(true);
    glideTo(target);
  }

  const showPair = (next: number) => setPairIndex((next + pairs.length) % pairs.length);

  return (
    <div className="w-full">
      <div className="relative">
        <div
          ref={frameRef}
          data-shared-media
          role="slider"
          tabIndex={0}
          aria-label="Before and after comparison"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={50}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => {
            draggingRef.current = false;
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
          onKeyDown={handleKeyDown}
          style={viewTransitionName ? { viewTransitionName } : undefined}
          className="group/slider relative aspect-[16/10] w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-xl bg-black"
        >
          <motion.div
            key={pairIndex}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0.35 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <img
              src={pair.afterSrc}
              alt={alt}
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <motion.img
              src={pair.beforeSrc}
              alt=""
              draggable={false}
              style={{ clipPath }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </motion.div>

          <motion.div
            aria-hidden="true"
            style={{ left: dividerLeft }}
            className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-white/90 shadow-[0_0_14px_oklch(0_0_0/0.55)]"
          >
            <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-black/50 text-white shadow-lg backdrop-blur-md transition-[scale,border-color] duration-300 group-hover/slider:scale-110 group-focus-visible/slider:border-primary">
              <ChevronsLeftRight className="h-5 w-5" />
            </span>
          </motion.div>

          <motion.span
            style={{ opacity: beforeLabelOpacity }}
            className={cn(labelClassName, "left-3")}
          >
            {beforeLabel}
          </motion.span>
          <motion.span
            style={{ opacity: afterLabelOpacity }}
            className={cn(labelClassName, "right-3")}
          >
            {afterLabel}
          </motion.span>
        </div>

        {pairs.length > 1 && (
          <>
            <StarBurstButton
              type="button"
              position="absolute"
              aria-label="Previous comparison image"
              className={cn(arrowClassName, "left-3")}
              onClick={() => showPair(pairIndex - 1)}
            >
              <ChevronLeft aria-hidden="true" size={24} strokeWidth={2.75} />
            </StarBurstButton>
            <StarBurstButton
              type="button"
              position="absolute"
              aria-label="Next comparison image"
              className={cn(arrowClassName, "right-3")}
              onClick={() => showPair(pairIndex + 1)}
            >
              <ChevronRight aria-hidden="true" size={24} strokeWidth={2.75} />
            </StarBurstButton>
          </>
        )}
      </div>

      {pairs.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {pairs.map((item, index) => (
            <MediaThumbnail
              key={`${item.afterSrc}-${index}`}
              src={item.afterSrc}
              label={`Show comparison ${index + 1}`}
              active={index === pairIndex}
              onSelect={() => showPair(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
