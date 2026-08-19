import { ArrowUpRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { CoverArt } from "./CoverArt";
import { type Product } from "@/lib/store";
import { formatCurrency, useCurrency } from "@/lib/currency";

type ProductCardProps = {
  product: Product;
  onAdd?: (product: Product) => void;
};

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const { currency } = useCurrency();
  return (
    <article className="group flex min-w-0 flex-col">
      <Link to={`/products/${product.slug}`} className="relative mb-5 block overflow-visible focus:outline-none">
        <CoverArt cover={product.cover} imageUrl={product.imageUrl} className="transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[1deg]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.bestseller && (
            <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm" style={{ backgroundColor: "var(--theme-bg-card)", color: "var(--theme-text)", border: "1px solid var(--theme-border)" }}>
              Bestseller
            </span>
          )}
          {product.isNew && (
            <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm" style={{ backgroundColor: "var(--theme-accent)" }}>
              New
            </span>
          )}
        </div>
        <span className="absolute bottom-3 right-3 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full opacity-0 shadow-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100" style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
          <ArrowUpRight size={17} />
        </span>
      </Link>
      <div className="flex flex-col items-start gap-2 sm:min-h-[92px] sm:flex-row sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--theme-text-muted)" }}>{product.category}</p>
          <Link to={`/products/${product.slug}`} className="block font-serif text-[1.25rem] leading-[1.15] text-balance tracking-[-0.035em] transition-colors sm:text-[1.45rem]" style={{ color: "var(--theme-text)" }}>
            {product.title}
          </Link>
          <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--theme-text-muted)" }}>
            <Star size={12} fill="currentColor" style={{ color: "var(--theme-star)" }} /> {product.rating} <span className="opacity-70">({product.reviews})</span>
          </div>
        </div>
        <div className="mt-1 shrink-0 sm:mt-0 sm:text-right">
          <p className="font-serif text-[1.35rem] font-bold tracking-[-0.03em] sm:text-2xl" style={{ color: "var(--theme-text)" }}>{formatCurrency(product.price, currency)}</p>
          {product.oldPrice && <p className="mt-0.5 text-xs line-through opacity-60 sm:mt-1">{formatCurrency(product.oldPrice, currency)}</p>}
        </div>
      </div>
      <button 
        onClick={() => onAdd?.(product)} 
        className="mt-auto h-11 w-full shrink-0 rounded-full border px-2 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] transition hover:opacity-90 shadow-sm focus:outline-none sm:text-xs sm:tracking-[0.12em]"
        style={{ borderColor: "var(--theme-border)", backgroundColor: "var(--theme-bg-card)", color: "var(--theme-text)" }}
      >
        Add to basket
      </button>
    </article>
  );
}
