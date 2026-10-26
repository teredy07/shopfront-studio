import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StarBurstButton } from "@/components/StarBurstButton";

type PreviewSlide =
  | { type: "image"; src: string }
  | { type: "video"; src: string }
  | { type: "youtube"; src: string };

type Props = {
  slides: PreviewSlide[];
  alt: string;
};

export function PreviewCarousel({ slides, alt }: Props) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
      {slide.type === "video" ? (
        <video
          key={slide.src}
          src={slide.src}
          controls
          playsInline
          className="h-full w-full bg-black object-contain"
        />
      ) : slide.type === "youtube" ? (
        <iframe
          key={slide.src}
          src={slide.src}
          title={`${alt} video preview`}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <img src={slide.src} alt={alt} className="h-full w-full bg-black object-contain" />
      )}
      {slides.length > 1 && (
        <>
          <StarBurstButton
            type="button"
            position="absolute"
            aria-label="Previous preview"
            className="absolute top-1/2 left-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary/70 bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90"
            onClick={() => setIndex((current) => (current - 1 + slides.length) % slides.length)}
          >
            <ChevronLeft aria-hidden="true" size={24} strokeWidth={2.75} />
          </StarBurstButton>
          <StarBurstButton
            type="button"
            position="absolute"
            aria-label="Next preview"
            className="absolute top-1/2 right-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary/70 bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90"
            onClick={() => setIndex((current) => (current + 1) % slides.length)}
          >
            <ChevronRight aria-hidden="true" size={24} strokeWidth={2.75} />
          </StarBurstButton>
        </>
      )}
    </div>
  );
}
