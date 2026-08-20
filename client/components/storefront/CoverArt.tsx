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
        "cover-art relative aspect-[3/4] w-full overflow-hidden rounded-[1.1rem] bg-[#ece7df] shadow-[0_18px_42px_-24px_rgba(32,35,29,.8)] transition-all",
        className
      )}
    >
      <img
        src={displayUrl}
        alt={cover?.title || "Product Cover"}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
