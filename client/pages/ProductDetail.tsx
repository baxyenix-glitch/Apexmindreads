import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Heart, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CoverArt } from "@/components/storefront/CoverArt";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { useProduct, useProducts, testimonials, type Product } from "@/lib/store";
import { formatCurrency, useCurrency } from "@/lib/currency";
import { useCart } from "@/lib/cart";

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const { product, loading: productLoading } = useProduct(slug);
  const { products, loading: productsLoading } = useProducts();
  const { addToCart } = useCart();
  const { currency } = useCurrency();
  const navigate = useNavigate();

  if (productLoading) {
    return (
      <StorefrontShell>
        <div className="mx-auto max-w-[1320px] px-5 py-32 text-center lg:px-10">
          <p className="section-kicker">Loading</p>
          <h1 className="mt-4 font-serif text-5xl tracking-[-0.06em]">Fetching guide...</h1>
        </div>
      </StorefrontShell>
    );
  }

  if (!product) {
    return (
      <StorefrontShell>
        <div className="mx-auto max-w-[1320px] px-5 py-32 text-center lg:px-10">
          <p className="section-kicker">Guide not found</p>
          <h1 className="mt-4 font-serif text-5xl tracking-[-0.06em]">This page has wandered off.</h1>
          <Link to="/#shop" className="mt-8 inline-flex rounded-full bg-[#26332f] px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-white">
            Back to the library
          </Link>
        </div>
      </StorefrontShell>
    );
  }

  const related = products.filter((item) => item.id !== product.id && item.categorySlug === product.categorySlug).slice(0, 3);
  
  const handleBuyNow = () => { 
    if (!product) return;
    addToCart(product);
    navigate("/checkout"); 
  };

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-[1320px] px-5 pb-20 pt-8 lg:px-10 lg:pb-28 lg:pt-12">
        <Link to="/#shop" className="mb-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#8b8175] transition hover:text-[#d86f45]">
          <ArrowLeft size={15} /> Back to library
        </Link>
        
        <section className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-start lg:gap-20">
          <div className="mx-auto w-full max-w-[470px] lg:mx-0">
            <div className="rounded-[1.7rem] bg-[#e9dfd2] p-4 sm:p-6">
              <CoverArt cover={product.cover} imageUrl={product.imageUrl} className="rounded-[1.25rem]" />
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#8b8175]">
              <Download size={14} /> Instant download after secure checkout
            </div>
          </div>
          
          <div className="max-w-[650px]">
            <p className="section-kicker">{product.category}</p>
            <h1 className="mt-4 font-serif text-[4rem] leading-[0.85] tracking-[-0.07em] sm:text-[5.8rem]">{product.title}</h1>
            <p className="mt-7 max-w-xl text-lg leading-7 text-[#736b61]">{product.description}</p>
            
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 font-semibold">
                <Star size={15} fill="currentColor" className="text-[#e4a83d]" /> {product.rating} 
                <span className="font-normal text-[#8b8175]">({product.reviews} reader reviews)</span>
              </span>
              <span className="h-4 w-px bg-[#d8d0c6]" />
              <span className="text-[#8b8175]">{product.pages} pages · {product.format}</span>
            </div>
            
            <div className="my-8 border-y border-[#e5ddd2] py-7">
              <div className="flex items-end gap-4">
                <span className="font-serif text-[2.75rem] font-bold tracking-[-0.05em] sm:text-6xl">{formatCurrency(product.price, currency)}</span>
                {product.oldPrice && (
                  <>
                    <span className="pb-1 text-base text-[#a99d91] line-through">{formatCurrency(product.oldPrice, currency)}</span>
                    <span className="mb-1 rounded-full bg-[#f0bc58] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]">
                      Save {Math.round((1 - product.price / product.oldPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-[#8b8175]">One-time purchase · yours forever</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBuyNow} 
                className="flex h-14 w-auto min-w-[210px] max-w-[280px] items-center justify-center gap-3 rounded-full bg-[#d86f45] px-8 text-base font-extrabold uppercase tracking-[0.14em] text-white shadow-sm transition hover:bg-[#be5935] active:scale-[0.98] sm:h-14 sm:min-w-0 sm:flex-1 sm:max-w-none sm:px-6 sm:text-xs"
              >
                BUY NOW <ArrowRight size={18} />
              </button>
              <button 
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#d8d0c6] transition hover:border-[#d86f45] hover:text-[#d86f45]" 
                aria-label="Save product"
              >
                <Heart size={20} />
              </button>
            </div>
            
            <div className="mt-8 grid gap-4 border-t border-[#e5ddd2] pt-6 sm:grid-cols-3">
              <div className="flex gap-2 text-xs leading-5 text-[#736b61]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#829a7b]" />Secure payment</div>
              <div className="flex gap-2 text-xs leading-5 text-[#736b61]"><Download size={16} className="mt-0.5 shrink-0 text-[#829a7b]" />Instant access</div>
              <div className="flex gap-2 text-xs leading-5 text-[#736b61]"><Heart size={16} className="mt-0.5 shrink-0 text-[#829a7b]" />Keep forever</div>
            </div>
          </div>
        </section>
        
        <section className="mt-24 grid gap-12 border-t border-[#e5ddd2] pt-16 lg:grid-cols-[1.1fr_.9fr] lg:gap-24">
          <div>
            <p className="section-kicker">Inside Your Guide</p>
            <h2 className="mt-3 max-w-lg font-serif text-4xl leading-[0.9] tracking-[-0.06em] sm:text-5xl">A clear path forward,<br /><em>step by step.</em></h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#736b61]">{product.longDescription}</p>
          </div>
          <div>
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.17em] text-[#8b8175]">What You'll Discover</p>
            <ul className="space-y-4">{product.benefits.map((benefit) => <li key={benefit} className="flex items-start gap-3 border-b border-[#e5ddd2] pb-4 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#b8c7b2] text-[#26332f]"><Check size={14} /></span>{benefit}</li>)}</ul>
          </div>
        </section>
        
        <section className="mt-24 rounded-[1.5rem] bg-[#eee7dc] px-6 py-12 sm:px-10 lg:mt-28 lg:py-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-kicker">Trusted by Thousands</p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.06em]">Real stories from <em>people just like you.</em></h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#736b61]">Hear how these practical guides helped readers achieve lasting transformations in their finances, families, and relationships.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="flex min-h-[260px] flex-col justify-between rounded-2xl bg-[#fffaf2] p-6 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex rounded-full bg-[#eee7dc] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#26332f]">
                      {item.category}
                    </span>
                    <div className="flex gap-1 text-[#e4a83d]">
                      {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={12} fill="currentColor" />)}
                    </div>
                  </div>
                  <p className="mt-5 font-serif text-[1.25rem] leading-[1.2] tracking-[-0.02em]">“{item.quote}”</p>
                </div>
                <div className="mt-6 border-t border-[#f0eae0] pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#26332f]">{item.name}</p>
                  <p className="mt-0.5 text-[11px] text-[#8b8175]">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {related.length > 0 && (
          <section className="mt-24">
            <div className="flex items-end justify-between">
              <div>
                <p className="section-kicker">Keep exploring</p>
                <h2 className="mt-3 font-serif text-4xl tracking-[-0.06em]">You may also like</h2>
              </div>
              <Link to="/#shop" className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#d86f45] sm:flex">All guides <ArrowRight size={15} /></Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-8">
              {related.map((item) => (
                <ProductCard 
                  key={item.id} 
                  product={item} 
                  onAdd={addToCart}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </StorefrontShell>
  );
}
