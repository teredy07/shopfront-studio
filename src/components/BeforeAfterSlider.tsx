import { useRef, useState } from "react";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  alt: string;
};

export function BeforeAfterSlider({ beforeSrc, afterSrc, beforeLabel = "Before", afterLabel = "After", alt }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(98, Math.max(2, pct)));
  };

  return (
    <div
      ref={ref}
      className="relative aspect-[16/10] w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-xl"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) move(e.clientX);
      }}
      role="slider"
      aria-label="Before and after comparison"
      aria-valuenow={Math.round(pos)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setPos((p) => Math.max(2, p - 4));
        if (e.key === "ArrowRight") setPos((p) => Math.min(98, p + 4));
      }}
    >
      <img src={afterSrc} alt={alt} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img
          src={beforeSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: ref.current?.clientWidth ? `${ref.current.clientWidth}px` : "100vw", maxWidth: "none" }}
          draggable={false}
        />
      </div>
      <div className="absolute inset-y-0 w-0.5 bg-foreground/90" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-xs font-bold shadow-lg backdrop-blur">
          ⇔
        </div>
      </div>
      <span className="absolute top-3 left-3 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold backdrop-blur">{beforeLabel}</span>
      <span className="absolute top-3 right-3 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold backdrop-blur">{afterLabel}</span>
    </div>
  );
}
