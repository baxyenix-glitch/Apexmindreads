import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/store";

type CoverArtProps = {
  cover?: Product["cover"];
  imageUrl?: string;
  className?: string;
  compact?: boolean;
};

export function CoverArt({ cover, imageUrl, className, compact = false }: CoverArtProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const tone = cover?.tone || "#d86f45";
  const accent = cover?.accent || "#f0bc58";
  const title = cover?.title || "ApexMindReads";
  const subtitle = cover?.subtitle || "DIGITAL GUIDE";
  const kicker = cover?.kicker || "APEXMINDREADS";
  const author = cover?.author || "ApexMindReads";
  const pattern = cover?.pattern || "grid";

  return (
    <div
      className={cn(
        "cover-art relative aspect-[3/4] w-full overflow-hidden rounded-[1.1rem] text-[#fffaf2] shadow-[0_18px_42px_-24px_rgba(32,35,29,.8)] transition-all",
        className
      )}
      style={{ backgroundColor: tone }}
    >
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt={title}
          onError={() => setImgError(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div className={cn("absolute inset-0 opacity-60", `cover-pattern-${pattern}`)} style={{ color: accent }} />
          <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 text-[9px] font-bold uppercase tracking-[0.18em] opacity-90 sm:text-[10px]">
              <span>{kicker}</span>
              <span className="text-sm tracking-normal opacity-80">↗</span>
            </div>
            <div>
              <h3 className={cn("whitespace-pre-line font-serif text-[2.35rem] font-medium leading-[0.9] tracking-[-0.06em] sm:text-[2.8rem]", compact && "text-[1.8rem] sm:text-[2rem]")}>
                {title}
              </h3>
              <p className="mt-4 max-w-[11rem] text-[10px] font-medium leading-[1.3] opacity-85 sm:text-[11px]">
                {subtitle}
              </p>
            </div>
            <div className="flex items-end justify-between text-[9px] font-bold uppercase tracking-[0.16em] opacity-90">
              <span>{author}</span>
              <span>PDF</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
