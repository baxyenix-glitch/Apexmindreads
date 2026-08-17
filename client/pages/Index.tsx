import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronRight, Search, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { ProductCard } from "@/components/storefront/ProductCard";
import { categories, useProducts, testimonials, type Product } from "@/lib/store";
import { loadCart, saveCart } from "@/lib/cart";

export default function Index() {
  const [cart, setCart] = useState<Product[]>(loadCart);
  useEffect(() => saveCart(cart), [cart]);
  const [activeCategory, setActiveCategory] = useState("All guides");
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  
  const { products, loading } = useProducts();

  const addToCart = (product: Product) => setCart((current) => current.some((item) => item.id === product.id) ? current : [...current, product]);
  const removeFromCart = (productId: string) => setCart((current) => current.filter((item) => item.id !== productId));
  
  const getCategoryCount = (catName: string, catSlug?: string) => {
    if (!products || products.length === 0) return 0;
    const targetName = catName.trim().toLowerCase();
    const targetSlug = (catSlug || catName).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    return products.filter((p) => {
      if (!p) return false;
      const pCat = (p.category || "").trim().toLowerCase();
      const pSlug = (p.categorySlug || "").trim().toLowerCase();
      const pSlugGenerated = pCat.replace(/[^a-z0-9]+/g, "-");
      
      return pCat === targetName || pSlug === targetSlug || pSlugGenerated === targetSlug;
    }).length;
  };

  const filteredProducts = useMemo(() => products.filter((product) => {
    if (!product) return false;
    const pCat = (product.category || "").trim().toLowerCase();
    const pSlug = (product.categorySlug || "").trim().toLowerCase();
    const activeLower = activeCategory.trim().toLowerCase();
    const activeSlug = activeLower.replace(/[^a-z0-9]+/g, "-");

    const matchesCategory = activeCategory === "All guides" || 
      pCat === activeLower || 
      pSlug === activeSlug || 
      pCat.replace(/[^a-z0-9]+/g, "-") === activeSlug;

    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery = !normalizedQuery || `${product.title} ${product.description} ${product.category}`.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  }), [products, activeCategory, query]);

  return (
    <StorefrontShell cart={cart} onRemove={removeFromCart}>
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden border-b border-[#e5ddd2] bg-[#f8f4ec]">
        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-10 sm:px-5 sm:pb-14 sm:pt-14 lg:px-10 lg:pb-16 lg:pt-16">
          <div className="mx-auto max-w-[780px] text-center">
            <h1 className="font-serif text-[3.35rem] leading-[0.92] tracking-[-0.065em] text-[#26332f] sm:text-[4.7rem] lg:text-[5.7rem]">
              Clarity & Wisdom for the <span className="relative inline-block text-[#d86f45]">Journey of Life<span className="absolute -bottom-1 left-1/2 h-1.5 w-[92%] -translate-x-1/2 rotate-[-2deg] rounded-[50%] border-b-2 border-[#f0bc58]" />.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-sm leading-6 text-[#736b61] sm:mt-6 sm:text-base sm:leading-7">
              Discover profound insights and practical strategies carefully crafted to help you navigate relationships, personal growth, parenting, and everyday challenges with confidence.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="#shop" className="group flex items-center justify-center gap-3 rounded-full bg-[#d86f45] px-5 py-3.5 text-xs font-bold uppercase tracking-[0.13em] text-white transition hover:bg-[#bf5937]">
                Explore the Collection <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#focus-categories" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#736b61] transition hover:text-[#d86f45]">
                Explore Categories <ArrowRight size={14} />
              </a>
            </div>
            <div className="mx-auto mt-8 flex max-w-[430px] items-center justify-center gap-5 border-t border-[#e5ddd2] pt-5 sm:gap-8">
              <div>
                <p className="font-serif text-3xl tracking-[-0.05em]">{products.length > 0 ? `${products.length}+` : "50+"}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#8b8175]">Premium guides</p>
              </div>
              <div>
                <p className="font-serif text-3xl tracking-[-0.05em]">4.9<span className="text-lg text-[#d86f45]">/5</span></p>
                <p className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#8b8175]">
                  <Star size={11} fill="currentColor" className="text-[#e4a83d]" /> Reader rated
                </p>
              </div>
              <div>
                <p className="font-serif text-3xl tracking-[-0.05em]">12k</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#8b8175]">Empowered readers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Collection / Shop Grid ─── */}
      <section id="shop" className="scroll-mt-20 mx-auto max-w-[1320px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">Our Collection</p>
            <h2 className="section-title mt-3">Wisdom for every<br /><em>chapter of your life.</em></h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#736b61] lg:pb-1">
            Expertly curated digital books designed to offer clarity, inspire growth, and provide actionable advice for your most important decisions.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-2 border-y border-[#e5ddd2] py-5 sm:flex sm:flex-wrap">
          <button 
            onClick={() => setActiveCategory("All guides")} 
            className={`truncate rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition sm:px-4 sm:text-[11px] ${activeCategory === "All guides" ? "bg-[#26332f] text-[#fffaf2]" : "bg-white border border-[#d8d0c6] text-[#736b61] hover:bg-[#eee7dc]"}`}
          >
            All guides ({products.length})
          </button>
          {categories.map((category) => {
            const count = getCategoryCount(category.name, category.slug);
            return (
              <button 
                key={category.slug} 
                onClick={() => setActiveCategory(category.name)} 
                className={`truncate rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition sm:px-4 sm:text-[11px] ${activeCategory === category.name ? "bg-[#26332f] text-[#fffaf2]" : "bg-white border border-[#d8d0c6] text-[#736b61] hover:bg-[#eee7dc]"}`}
              >
                {category.name} ({count})
              </button>
            );
          })}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-[#d8d0c6] px-6 py-20 text-center">
            <p className="font-serif text-3xl">No guides found in this category.</p>
            <p className="mt-3 text-sm text-[#736b61]">Try selecting another category or browsing all available guides.</p>
            <button 
              onClick={() => { setQuery(""); setActiveCategory("All guides"); }} 
              className="mt-6 rounded-full bg-[#26332f] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#3b4b45]"
            >
              Show all guides
            </button>
          </div>
        )}

        <div className="mt-12 text-center">
          <button 
            onClick={() => { setQuery(""); setActiveCategory("All guides"); }} 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#d86f45] transition hover:text-[#26332f]"
          >
            View all guides <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* ─── Discover What Matters Most To You Today ─── */}
      <section id="focus-categories" className="scroll-mt-20 border-y border-[#e5ddd2] bg-[#eee7dc] px-5 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-[1320px]">
          <div>
            <p className="section-kicker">Find Your Focus</p>
            <h2 className="section-title mt-3">Discover what matters most to you today.</h2>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
            {categories.map((category) => {
              const count = getCategoryCount(category.name, category.slug);
              const countText = loading ? "..." : `${count} ${count === 1 ? "guide" : "guides"}`;

              return (
                <button
                  key={category.slug}
                  onClick={() => {
                    setActiveCategory(category.name);
                    const shopEl = document.getElementById("shop");
                    if (shopEl) {
                      shopEl.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="group relative min-h-[150px] overflow-hidden rounded-2xl p-5 text-left transition hover:-translate-y-1 hover:shadow-md md:min-h-[190px]"
                  style={{ backgroundColor: category.color }}
                >
                  <span className="absolute -right-2 -top-6 font-serif text-[8rem] leading-none text-white/20 transition group-hover:scale-110 select-none pointer-events-none">
                    {category.icon}
                  </span>
                  <span className="relative flex h-full flex-col justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-sm shadow-sm">
                      {category.icon}
                    </span>
                    <span>
                      <span className="block max-w-[8rem] font-serif text-[1.35rem] leading-[0.95] tracking-[-0.04em] text-[#26332f]">
                        {category.name}
                      </span>
                      <span className="mt-2 inline-flex items-center rounded-full bg-white/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#26332f]">
                        {countText}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Story / Why ApexMindReads ─── */}
      <section id="story" className="scroll-mt-20 border-y border-[#e5ddd2] bg-[#26332f] px-5 py-20 text-[#f8f4ec] lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1320px] gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-28">
          <div>
            <p className="section-kicker text-[#f0bc58]">Why ApexMindReads</p>
            <h2 className="mt-4 max-w-md font-serif text-[3.6rem] leading-[0.88] tracking-[-0.07em] sm:text-[5rem]">
              Transformative insights, <em className="text-[#e58a61]">beautifully delivered.</em>
            </h2>
          </div>
          <div className="grid gap-9 sm:grid-cols-2">
            <div className="border-t border-[#53625b] pt-5">
              <Zap size={22} className="text-[#f0bc58]" />
              <h3 className="mt-5 font-serif text-2xl">Rooted in Real Experience</h3>
              <p className="mt-3 text-sm leading-6 text-[#bec5bb]">Our guides are crafted with deep empathy and practical wisdom. Dive in, find the exact guidance you need, and start experiencing meaningful change.</p>
            </div>
            <div className="border-t border-[#53625b] pt-5">
              <ShieldCheck size={22} className="text-[#f0bc58]" />
              <h3 className="mt-5 font-serif text-2xl">Instant Access Anywhere</h3>
              <p className="mt-3 text-sm leading-6 text-[#bec5bb]">Secure your purchase and receive immediate lifetime access to your digital library. Your wisdom is always just a tap away, whenever you need it.</p>
            </div>
            <div className="border-t border-[#53625b] pt-5">
              <Sparkles size={22} className="text-[#f0bc58]" />
              <h3 className="mt-5 font-serif text-2xl">Actionable & Empowering</h3>
              <p className="mt-3 text-sm leading-6 text-[#bec5bb]">Every book is designed to move you forward. Expect thought-provoking exercises, clear strategies, and gentle nudges toward a better you.</p>
            </div>
            <div className="border-t border-[#53625b] pt-5">
              <span className="font-serif text-2xl text-[#f0bc58]">✦</span>
              <h3 className="mt-5 font-serif text-2xl">Designed for Your Growth</h3>
              <p className="mt-3 text-sm leading-6 text-[#bec5bb]">We believe in authentic personal development. Our mission isn't perfection—it's helping you cultivate a richer, more peaceful, and fulfilling life.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials (Categories & Results Focused) ─── */}
      <section className="mx-auto max-w-[1320px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Trusted by Thousands</p>
            <h2 className="section-title mt-3">Real stories from people<br /><em>just like you.</em></h2>
          </div>
          <div className="flex gap-1 pb-1 text-[#e4a83d]">
            {[1, 2, 3, 4, 5].map((item) => <Star key={item} size={15} fill="currentColor" />)}
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote key={testimonial.name} className="flex min-h-[280px] flex-col justify-between rounded-[1.4rem] border border-[#e5ddd2] bg-[#fffaf2] p-6 sm:p-7 shadow-sm transition hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-full bg-[#f2ecdf] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#26332f]">
                    {testimonial.category}
                  </span>
                  <div className="flex gap-1 text-[#e4a83d]">
                    {[1, 2, 3, 4, 5].map((item) => <Star key={item} size={12} fill="currentColor" />)}
                  </div>
                </div>
                <p className="mt-6 font-serif text-[1.35rem] leading-[1.12] tracking-[-0.03em]">“{testimonial.quote}”</p>
              </div>
              <footer className="mt-8 flex items-center gap-3 border-t border-[#f0eae0] pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: testimonial.color }}>
                  {testimonial.initials}
                </span>
                <span>
                  <cite className="block text-sm font-bold not-italic">{testimonial.name}</cite>
                  <span className="mt-0.5 block text-xs text-[#8b8175]">{testimonial.role}</span>
                </span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* ─── Newsletter ─── */}
      <section className="mx-5 mb-16 overflow-hidden rounded-[1.6rem] bg-[#f0bc58] px-6 py-14 sm:px-12 lg:mx-10 lg:mb-24 lg:px-20 lg:py-16">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#26332f]/60">Join Our Inner Circle</p>
            <h2 className="mt-3 max-w-lg font-serif text-[3.3rem] leading-[0.88] tracking-[-0.07em] text-[#26332f] sm:text-[4.5rem]">
              Inspiration delivered<br /><em>directly to you.</em>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-[#26332f]/70">
              Receive early access to our newest guides, exclusive insights, and gentle reminders to prioritize your growth.
            </p>
          </div>
          <div className="w-full max-w-md">
            {subscribed ? (
              <div className="flex items-center gap-3 rounded-2xl bg-[#26332f] p-4 text-[#fffaf2]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b8c7b2] text-[#26332f]"><Check size={17} /></span>
                <div>
                  <p className="font-semibold">You are on the list.</p>
                  <p className="mt-1 text-xs text-[#bec5bb]">Welcome to the family. Watch your inbox for inspiration.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); if (email) setSubscribed(true); }} className="flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="newsletter-email">Email address</label>
                <input id="newsletter-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" className="h-14 min-w-0 flex-1 rounded-full border border-[#26332f]/20 bg-[#f8f4ec]/70 px-5 text-sm text-[#26332f] outline-none placeholder:text-[#736b61] focus:border-[#26332f]" />
                <button type="submit" className="h-14 rounded-full bg-[#26332f] px-6 text-xs font-bold uppercase tracking-[0.12em] text-[#fffaf2] transition hover:bg-[#d86f45]">Join the list</button>
              </form>
            )}
            <p className="mt-3 text-[10px] text-[#26332f]/55">We respect your peace. Unsubscribe at any time.</p>
          </div>
        </div>
      </section>
    </StorefrontShell>
  );
}
