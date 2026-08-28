import { useState } from "react";
import { ArrowUpRight, Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { CoverArt } from "./CoverArt";
import { type Product } from "@/lib/store";
import { formatCurrency, useCurrency } from "@/lib/currency";
import { useCart } from "@/lib/cart";

type ProductCardProps = {
  product: Product;
  onAdd?: (product: Product) => void;
};

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const { currency } = useCurrency();
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    if (onAdd) {
      onAdd(product);
    } else {
      addToCart(product);
    }

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false), 2000;
    }, 2000);
  };

  return (
    <article className="group flex min-w-0 flex-col">
      <Link
        to={`/products/${product.slug}`}
        className="relative mb-3.5 block overflow-visible focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d86f45] focus-visible:ring-offset-4"
      >
        <CoverArt
          cover={product.cover}
          imageUrl={product.imageUrl}
          className="transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[0.5deg]"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {product.bestseller && (
            <span className="rounded-full bg-[#f7f1e7] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#26332f] shadow-sm">
              Bestseller
            </span>
          )}
          {product.isNew && (
            <span className="rounded-full bg-[#26332f] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#f8f4ec] shadow-sm">
              New
            </span>
          )}
        </div>
        <span className="absolute bottom-2.5 right-2.5 flex h-8 w-8 translate-y-2 items-center justify-center rounded-full bg-[#f8f4ec] text-[#26332f] opacity-0 shadow-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:h-9 sm:w-9">
          <ArrowUpRight size={15} />
        </span>
      </Link>
      <div className="flex flex-col items-start gap-1 sm:min-h-[82px] sm:flex-row sm:justify-between sm:gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#8b8175] sm:text-[10px]">
            {product.category}
          </p>
          <Link
            to={`/products/${product.slug}`}
            className="line-clamp-2 block font-serif text-[1.1rem] leading-[1.2] tracking-[-0.025em] text-[#26332f] transition-colors hover:text-[#d86f45] sm:text-[1.2rem]"
          >
            {product.title}
          </Link>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#736b61]">
            <Star size={11} fill="currentColor" className="text-[#e4a83d]" /> {product.rating}
            <span className="text-[10px] text-[#afa69b]">({product.reviews})</span>
          </div>
        </div>
        <div className="mt-1 shrink-0 sm:mt-0 sm:text-right">
          <p className="font-serif text-[1.15rem] font-bold tracking-[-0.03em] text-[#26332f] sm:text-[1.35rem]">
            {formatCurrency(product.price, currency)}
          </p>
          {product.oldPrice && (
            <p className="text-[10px] text-[#a99d91] line-through sm:text-xs">
              {formatCurrency(product.oldPrice, currency)}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={handleAdd}
        className={`mt-3 flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-full border px-2 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d86f45] sm:text-[11px] sm:tracking-[0.12em] active:scale-[0.97] ${
          isAdded
            ? "border-[#5e8c67] bg-[#5e8c67] text-white shadow-sm"
            : "border-[#d8d0c6] bg-transparent text-[#26332f] hover:border-[#26332f] hover:bg-[#26332f] hover:text-[#fffaf2]"
        }`}
      >
        {isAdded ? (
          <>
            <Check size={14} className="animate-in zoom-in-50 duration-200" strokeWidth={2.5} />
            <span>Added to basket</span>
          </>
        ) : (
          <span>Add to basket</span>
        )}
      </button>
    </article>
  );
}
