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
      <section className="relative overflow-hidden border-b transition-colors" style={{ backgroundColor: "var(--theme-bg-hero)", borderColor: "var(--theme-border)" }}>
        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-10 sm:px-5 sm:pb-14 sm:pt-14 lg:px-10 lg:pb-16 lg:pt-16">
          <div className="mx-auto max-w-[780px] text-center">
            <h1 className="font-serif text-[2.25rem] leading-[1.06] tracking-[-0.04em] min-[380px]:text-[2.55rem] min-[420px]:text-[2.85rem] sm:text-[4.7rem] sm:leading-[0.92] sm:tracking-[-0.065em] lg:text-[5.7rem]" style={{ color: "var(--theme-text)" }}>
              <span className="block sm:inline">Practical Guides for </span>
              <span className="relative inline-block" style={{ color: "var(--theme-accent)" }}>
                Real-Life Problems
                <span className="absolute -bottom-1 left-1/2 h-1.5 w-[92%] -translate-x-1/2 rotate-[-2deg] rounded-[50%] border-b-2" style={{ borderColor: "var(--theme-accent-badge)" }} />.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-[580px] text-sm leading-6 sm:mt-6 sm:text-base sm:leading-7" style={{ color: "var(--theme-text-muted)" }}>
              Simple, actionable digital guides designed to help you solve everyday challenges in money, relationships, personal growth, parenting, career and more.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="#shop" className="group flex items-center justify-center gap-3 rounded-full px-5 py-3.5 text-xs font-bold uppercase tracking-[0.13em] text-white transition hover:opacity-90 shadow-md" style={{ backgroundColor: "var(--theme-accent)" }}>
                Explore the Collection <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#focus-categories" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] transition hover:opacity-80" style={{ color: "var(--theme-text-muted)" }}>
                Explore Categories <ArrowRight size={14} />
              </a>
            </div>
            <div className="mx-auto mt-8 flex max-w-[430px] items-center justify-center gap-5 border-t pt-5 sm:gap-8" style={{ borderColor: "var(--theme-border)" }}>
              <div>
                <p className="font-serif text-3xl tracking-[-0.05em]">{products.length > 0 ? `${products.length}+` : "50+"}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: "var(--theme-text-muted)" }}>Premium guides</p>
              </div>
              <div>
                <p className="font-serif text-3xl tracking-[-0.05em]">4.9<span className="text-lg" style={{ color: "var(--theme-accent)" }}>/5</span></p>
                <p className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: "var(--theme-text-muted)" }}>
                  <Star size={11} fill="currentColor" style={{ color: "var(--theme-star)" }} /> Reader rated
                </p>
              </div>
              <div>
                <p className="font-serif text-3xl tracking-[-0.05em]">12k</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: "var(--theme-text-muted)" }}>Empowered readers</p>
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
          <p className="max-w-sm text-sm leading-6 lg:pb-1" style={{ color: "var(--theme-text-muted)" }}>
            Expertly curated digital books designed to offer clarity, inspire growth, and provide actionable advice for your most important decisions.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-2 border-y py-5 sm:flex sm:flex-wrap" style={{ borderColor: "var(--theme-border)" }}>
          <button 
            onClick={() => setActiveCategory("All guides")} 
            className="truncate rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition sm:px-4 sm:text-[11px] border"
            style={activeCategory === "All guides" 
              ? { backgroundColor: "var(--theme-text)", color: "var(--theme-bg)", borderColor: "var(--theme-text)" }
              : { backgroundColor: "var(--theme-bg-card)", borderColor: "var(--theme-border)", color: "var(--theme-text-muted)" }
            }
          >
            All guides ({products.length})
          </button>
          {categories.map((category) => {
            const count = getCategoryCount(category.name, category.slug);
            const isSelected = activeCategory === category.name;
            return (
              <button 
                key={category.slug} 
                onClick={() => setActiveCategory(category.name)} 
                className="truncate rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition sm:px-4 sm:text-[11px] border"
                style={isSelected
                  ? { backgroundColor: "var(--theme-text)", color: "var(--theme-bg)", borderColor: "var(--theme-text)" }
                  : { backgroundColor: "var(--theme-bg-card)", borderColor: "var(--theme-border)", color: "var(--theme-text-muted)" }
                }
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
          <div className="mt-10 rounded-3xl border border-dashed px-6 py-20 text-center" style={{ borderColor: "var(--theme-border)", backgroundColor: "var(--theme-bg-card)" }}>
            <p className="font-serif text-3xl">No guides found in this category.</p>
            <p className="mt-3 text-sm" style={{ color: "var(--theme-text-muted)" }}>Try selecting another category or browsing all available guides.</p>
            <button 
              onClick={() => { setQuery(""); setActiveCategory("All guides"); }} 
              className="mt-6 rounded-full px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:opacity-90 shadow-sm"
              style={{ backgroundColor: "var(--theme-accent)" }}
            >
              Show all guides
            </button>
          </div>
        )}

        <div className="mt-12 text-center">
          <button 
            onClick={() => { setQuery(""); setActiveCategory("All guides"); }} 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] transition hover:opacity-80"
            style={{ color: "var(--theme-accent)" }}
          >
            View all guides <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* ─── Discover What Matters Most To You Today ─── */}
      <section id="focus-categories" className="scroll-mt-20 border-y px-5 py-16 lg:px-10 lg:py-20" style={{ backgroundColor: "var(--theme-bg-muted)", borderColor: "var(--theme-border)" }}>
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
      <section id="story" className="scroll-mt-20 border-y px-5 py-20 lg:px-10 lg:py-28" style={{ backgroundColor: "var(--theme-text)", borderColor: "var(--theme-border)", color: "var(--theme-bg)" }}>
        <div className="mx-auto grid max-w-[1320px] gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-28">
          <div>
            <p className="section-kicker" style={{ color: "var(--theme-accent-badge)" }}>Why ApexMindReads</p>
            <h2 className="mt-4 max-w-md font-serif text-[3.6rem] leading-[0.88] tracking-[-0.07em] sm:text-[5rem]">
              Transformative insights, <em style={{ color: "var(--theme-accent)" }}>beautifully delivered.</em>
            </h2>
          </div>
          <div className="grid gap-9 sm:grid-cols-2">
            <div className="border-t pt-5" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
              <Zap size={22} style={{ color: "var(--theme-accent-badge)" }} />
              <h3 className="mt-5 font-serif text-2xl">Rooted in Real Experience</h3>
              <p className="mt-3 text-sm leading-6 opacity-80">Our guides are crafted with deep empathy and practical wisdom. Dive in, find the exact guidance you need, and start experiencing meaningful change.</p>
            </div>
            <div className="border-t pt-5" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
              <ShieldCheck size={22} style={{ color: "var(--theme-accent-badge)" }} />
              <h3 className="mt-5 font-serif text-2xl">Instant Access Anywhere</h3>
              <p className="mt-3 text-sm leading-6 opacity-80">Secure your purchase and receive immediate lifetime access to your digital library. Your wisdom is always just a tap away, whenever you need it.</p>
            </div>
            <div className="border-t pt-5" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
              <Sparkles size={22} style={{ color: "var(--theme-accent-badge)" }} />
              <h3 className="mt-5 font-serif text-2xl">Actionable & Empowering</h3>
              <p className="mt-3 text-sm leading-6 opacity-80">Every book is designed to move you forward. Expect thought-provoking exercises, clear strategies, and gentle nudges toward a better you.</p>
            </div>
            <div className="border-t pt-5" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
              <span className="font-serif text-2xl" style={{ color: "var(--theme-accent-badge)" }}>✦</span>
              <h3 className="mt-5 font-serif text-2xl">Designed for Your Growth</h3>
              <p className="mt-3 text-sm leading-6 opacity-80">We believe in authentic personal development. Our mission isn't perfection—it's helping you cultivate a richer, more peaceful, and fulfilling life.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="mx-auto max-w-[1320px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Trusted by Thousands</p>
            <h2 className="section-title mt-3">Real stories from people<br /><em>just like you.</em></h2>
          </div>
          <div className="flex gap-1 pb-1" style={{ color: "var(--theme-star)" }}>
            {[1, 2, 3, 4, 5].map((item) => <Star key={item} size={15} fill="currentColor" />)}
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote key={testimonial.name} className="flex min-h-[280px] flex-col justify-between rounded-[1.4rem] border p-6 sm:p-7 shadow-sm transition hover:-translate-y-1" style={{ backgroundColor: "var(--theme-bg-card)", borderColor: "var(--theme-border)" }}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ backgroundColor: "var(--theme-bg-muted)", color: "var(--theme-text)" }}>
                    {testimonial.category}
                  </span>
                  <div className="flex gap-1" style={{ color: "var(--theme-star)" }}>
                    {[1, 2, 3, 4, 5].map((item) => <Star key={item} size={12} fill="currentColor" />)}
                  </div>
                </div>
                <p className="mt-6 font-serif text-[1.35rem] leading-[1.12] tracking-[-0.03em]">“{testimonial.quote}”</p>
              </div>
              <footer className="mt-8 flex items-center gap-3 border-t pt-4" style={{ borderColor: "var(--theme-border)" }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: testimonial.color }}>
                  {testimonial.initials}
                </span>
                <span>
                  <cite className="block text-sm font-bold not-italic">{testimonial.name}</cite>
                  <span className="mt-0.5 block text-xs" style={{ color: "var(--theme-text-muted)" }}>{testimonial.role}</span>
                </span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* ─── Newsletter ─── */}
      <section className="mx-5 mb-16 overflow-hidden rounded-[1.6rem] px-6 py-14 sm:px-12 lg:mx-10 lg:mb-24 lg:px-20 lg:py-16 shadow-lg" style={{ backgroundColor: "var(--theme-accent)", color: "#ffffff" }}>
        <div className="mx-auto flex max-w-[1120px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-white/80">Join Our Inner Circle</p>
            <h2 className="mt-3 max-w-lg font-serif text-[3.3rem] leading-[0.88] tracking-[-0.07em] text-white sm:text-[4.5rem]">
              Inspiration delivered<br /><em>directly to you.</em>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/90">
              Receive early access to our newest guides, exclusive insights, and gentle reminders to prioritize your growth.
            </p>
          </div>
          <div className="w-full max-w-md">
            {subscribed ? (
              <div className="flex items-center gap-3 rounded-2xl p-4 text-white" style={{ backgroundColor: "rgba(0,0,0,0.25)" }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black"><Check size={17} /></span>
                <div>
                  <p className="font-semibold">You are on the list.</p>
                  <p className="mt-1 text-xs opacity-80">Welcome to the family. Watch your inbox for inspiration.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); if (email) setSubscribed(true); }} className="flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="newsletter-email">Email address</label>
                <input id="newsletter-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" className="h-14 min-w-0 flex-1 rounded-full border border-white/30 bg-white/20 px-5 text-sm text-white outline-none placeholder:text-white/70 focus:border-white focus:bg-white/30" />
                <button type="submit" className="h-14 rounded-full px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:opacity-90 shadow-md" style={{ backgroundColor: "var(--theme-text)", color: "var(--theme-bg)" }}>Join the list</button>
              </form>
            )}
            <p className="mt-3 text-[10px] text-white/75">We respect your peace. Unsubscribe at any time.</p>
          </div>
        </div>
      </section>
    </StorefrontShell>
  );
}
