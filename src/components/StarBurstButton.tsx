import { useState, type ButtonHTMLAttributes, type CSSProperties, type MouseEvent } from "react";
import { Star } from "lucide-react";

type Burst = { id: number; x: number; y: number };
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  position?: "absolute" | "relative";
};

const particles = [
  { x: -22, y: -20 },
  { x: 20, y: -22 },
  { x: -27, y: 2 },
  { x: 25, y: 4 },
  { x: -10, y: 25 },
  { x: 11, y: 24 },
];

export function StarBurstButton({
  position = "relative",
  onClick,
  children,
  className,
  style,
  ...props
}: Props) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [nextId, setNextId] = useState(0);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const id = nextId;
    setNextId((current) => current + 1);
    setBursts((current) => [...current, {
      id,
      x: event.detail === 0 ? rect.width / 2 : event.clientX - rect.left,
      y: event.detail === 0 ? rect.height / 2 : event.clientY - rect.top,
    }]);
    window.setTimeout(() => setBursts((current) => current.filter((burst) => burst.id !== id)), 850);
    onClick?.(event);
  };

  return (
    <button
      {...props}
      className={`${className ?? ""} cursor-pointer`}
      style={{ ...style, position }}
      onClick={handleClick}
    >
      {children}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-visible">
        {bursts.map((burst) => particles.map((particle, index) => (
          <Star
            key={`${burst.id}-${index}`}
            className="star-burst-particle"
            style={{
              left: burst.x,
              top: burst.y,
              animationDelay: `${index * 22}ms`,
              "--spark-x": `${particle.x}px`,
              "--spark-y": `${particle.y}px`,
            } as CSSProperties}
          />
        )))}
      </span>
    </button>
  );
}
