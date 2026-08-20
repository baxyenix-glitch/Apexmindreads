import { cn } from "@/lib/utils";
import type { Product } from "@/lib/store";

type CoverArtProps = {
  cover?: Product["cover"];
  imageUrl?: string;
  className?: string;
  compact?: boolean;
};

export function CoverArt({ cover, imageUrl, className }: CoverArtProps) {
  const displayUrl = imageUrl || "/placeholder.svg";

  return (
    <div
      className={cn(
        "cover-art group/cover relative aspect-[3/4] w-full overflow-hidden rounded-[1rem] bg-[#e9e3da] shadow-[0_16px_36px_-14px_rgba(38,51,47,0.22)] ring-1 ring-black/5 transition-all duration-300",
        className
      )}
    >
      {/* Book Image */}
      <img
        src={displayUrl}
        alt={cover?.title || "Product Cover"}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/cover:scale-[1.03]"
      />

      {/* Realistic Book Spine Effect (Left Edge) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-white/10 to-transparent sm:w-4" />

      {/* Subtle Book Spine Fold Crease */}
      <div className="pointer-events-none absolute inset-y-0 left-3 w-px bg-black/10 sm:left-4" />

      {/* Subtle Inner Border Glow */}
      <div className="pointer-events-none absolute inset-0 rounded-[1rem] ring-1 ring-inset ring-white/20" />
    </div>
  );
}
