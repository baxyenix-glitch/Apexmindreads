import { useState } from "react";
import { ArrowUpRight, Check, Eye, Plus, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { CoverArt } from "./CoverArt";
import { type Product } from "@/lib/store";
import { formatCurrency, useCurrency } from "@/lib/currency";

type ProductCardProps = {
  product: Product;
  onAdd?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
};

export function ProductCard({ product, onAdd, onQuickView }: ProductCardProps) {
  const { currency } = useCurrency();
  const [added, setAdded] = useState(false);

  const discountPercent =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAdd?.(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  return (
    <article className="group flex min-w-0 flex-col rounded-[1.4rem] border border-[#e5ddd2]/70 bg-[#fcfbf9] p-3.5 shadow-sm transition-all duration-300 hover:border-[#d86f45]/40 hover:bg-white hover:shadow-[0_18px_36px_-12px_rgba(38,51,47,0.12)] sm:p-4">
      {/* ─── Cover Image Container ─── */}
      <div className="relative mb-4 overflow-hidden rounded-[1.1rem]">
        <Link
          to={`/products/${product.slug}`}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d86f45]"
        >
          <CoverArt
            cover={product.cover}
            imageUrl={product.imageUrl}
            className="transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 pointer-events-none">
          {product.bestseller && (
            <span className="rounded-full bg-[#26332f]/90 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#f8f4ec] backdrop-blur-md shadow-sm sm:text-[10px]">
              ★ Bestseller
            </span>
          )}
          {product.isNew && (
            <span className="rounded-full bg-[#d86f45] px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white shadow-sm sm:text-[10px]">
              New
            </span>
          )}
          {discountPercent && (
            <span className="rounded-full bg-[#f0bc58] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#26332f] shadow-sm sm:text-[10px]">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Quick View Hover Action */}
        {onQuickView && (
          <button
            onClick={handleQuickView}
            aria-label={`Quick view ${product.title}`}
            className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#26332f] opacity-0 shadow-md backdrop-blur-sm transition-all duration-300 hover:bg-[#d86f45] hover:text-white group-hover:opacity-100 sm:h-10 sm:w-10"
          >
            <Eye size={16} />
          </button>
        )}
      </div>

      {/* ─── Product Meta Details ─── */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* Category & Format Pill */}
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8175]">
              {product.category}
            </span>
            <span className="shrink-0 text-[10px] font-medium text-[#a89f93]">
              {product.pages}p · PDF
            </span>
          </div>

          {/* Book Title */}
          <Link
            to={`/products/${product.slug}`}
            className="line-clamp-2 block font-serif text-[1.2rem] font-medium leading-[1.18] tracking-[-0.03em] text-[#26332f] transition-colors hover:text-[#d86f45] sm:text-[1.35rem]"
          >
            {product.title}
          </Link>

          {/* Star Rating */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#736b61]">
            <div className="flex items-center text-[#e4a83d]">
              <Star size={12} fill="currentColor" />
            </div>
            <span className="font-bold text-[#26332f]">{product.rating}</span>
            <span className="text-[11px] text-[#8b8175]">({product.reviews})</span>
          </div>
        </div>

        {/* ─── Price & Actions ─── */}
        <div className="mt-4 border-t border-[#eee7dc] pt-3">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <div>
              <span className="font-serif text-[1.4rem] font-bold tracking-[-0.03em] text-[#26332f] sm:text-[1.6rem]">
                {formatCurrency(product.price, currency)}
              </span>
              {product.oldPrice && (
                <span className="ml-2 text-xs text-[#a99d91] line-through">
                  {formatCurrency(product.oldPrice, currency)}
                </span>
              )}
            </div>
            <span className="rounded bg-[#eef1eb] px-1.5 py-0.5 text-[9px] font-bold text-[#5e8c67]">
              Instant
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={added}
              className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold uppercase tracking-[0.1em] transition-all duration-200 ${
                added
                  ? "bg-[#4c7b55] text-white shadow-sm"
                  : "border border-[#d8d0c6] bg-white text-[#26332f] hover:border-[#26332f] hover:bg-[#26332f] hover:text-[#fffaf2]"
              }`}
            >
              {added ? (
                <>
                  <Check size={14} /> Added
                </>
              ) : (
                <>
                  <ShoppingBag size={13} /> Add to bag
                </>
              )}
            </button>
            <Link
              to={`/products/${product.slug}`}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d0c6] bg-white text-[#736b61] transition-colors hover:border-[#d86f45] hover:text-[#d86f45]"
              aria-label={`View ${product.title}`}
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
