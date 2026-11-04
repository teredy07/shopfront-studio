import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  src: string | undefined;
  label: string;
  active: boolean;
  video?: boolean;
  onSelect: () => void;
};

export function MediaThumbnail({ src, label, active, video = false, onSelect }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active || undefined}
      onClick={onSelect}
      className={cn(
        "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-card transition duration-300 sm:h-[4.5rem] sm:w-[4.5rem]",
        active ? "border-primary" : "border-transparent opacity-60 hover:opacity-100",
      )}
    >
      {src && (
        <img
          src={src}
          alt=""
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover"
        />
      )}
      {video && (
        <span className="absolute inset-0 grid place-items-center bg-black/45">
          <Play aria-hidden="true" className="h-5 w-5 fill-white text-white" />
        </span>
      )}
    </button>
  );
}
