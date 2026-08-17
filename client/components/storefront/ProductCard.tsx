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
      <Link to={`/products/${product.slug}`} className="relative mb-5 block overflow-visible focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d86f45] focus-visible:ring-offset-4">
        <CoverArt cover={product.cover} imageUrl={product.imageUrl} className="transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[1deg]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.bestseller && <span className="rounded-full bg-[#f7f1e7] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#26332f] shadow-sm">Bestseller</span>}
          {product.isNew && <span className="rounded-full bg-[#26332f] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#f8f4ec] shadow-sm">New</span>}
        </div>
        <span className="absolute bottom-3 right-3 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-[#f8f4ec] text-[#26332f] opacity-0 shadow-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={17} /></span>
      </Link>
      <div className="flex flex-col items-start gap-2 sm:min-h-[92px] sm:flex-row sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8175]">{product.category}</p>
          <Link to={`/products/${product.slug}`} className="block font-serif text-[1.25rem] leading-[1.15] text-balance tracking-[-0.035em] text-[#26332f] transition-colors hover:text-[#d86f45] sm:text-[1.45rem]">{product.title}</Link>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#736b61]"><Star size={12} fill="currentColor" className="text-[#e4a83d]" /> {product.rating} <span className="text-[#afa69b]">({product.reviews})</span></div>
        </div>
        <div className="mt-1 shrink-0 sm:mt-0 sm:text-right">
          <p className="font-serif text-[1.35rem] font-bold tracking-[-0.03em] text-[#26332f] sm:text-2xl">{formatCurrency(product.price, currency)}</p>
          {product.oldPrice && <p className="mt-0.5 text-xs text-[#a99d91] line-through sm:mt-1">{formatCurrency(product.oldPrice, currency)}</p>}
        </div>
      </div>
      <button onClick={() => onAdd?.(product)} className="mt-auto h-11 w-full shrink-0 rounded-full border border-[#d8d0c6] px-2 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#26332f] transition hover:border-[#26332f] hover:bg-[#26332f] hover:text-[#fffaf2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d86f45] sm:text-xs sm:tracking-[0.12em]">Add to basket</button>
    </article>
  );
}
