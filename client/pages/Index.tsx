import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Globe,
  LockKeyhole,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CoverArt } from "@/components/storefront/CoverArt";
import { categories, useProducts, testimonials, type Product } from "@/lib/store";
import { formatCurrency, useCurrency } from "@/lib/currency";
import { loadCart, saveCart } from "@/lib/cart";

type SortOption = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

export default function Index() {
  const [cart, setCart] = useState<Product[]>(loadCart);
  useEffect(() => saveCart(cart), [cart]);

  const [activeCategory, setActiveCategory] = useState("All guides");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const { products, loading } = useProducts();
  const { currency } = useCurrency();
  const navigate = useNavigate();

  const addToCart = (product: Product) =>
    setCart((current) =>
      current.some((item) => item.id === product.id) ? current : [...current, product]
    );

  const removeFromCart = (productId: string) =>
    setCart((current) => current.filter((item) => item.id !== productId));

  const handleBuyNow = (product: Product) => {
    addToCart(product);
    navigate("/checkout");
  };

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

  // Top featured hero product (fallback to first bestseller or first item)
  const heroFeatured = useMemo(() => {
    if (products.length === 0) return null;
    return products.find((p) => p.featured || p.bestseller) || products[0];
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((product) => {
      if (!product) return false;
      const pCat = (product.category || "").trim().toLowerCase();
      const pSlug = (product.categorySlug || "").trim().toLowerCase();
      const activeLower = activeCategory.trim().toLowerCase();
      const activeSlug = activeLower.replace(/[^a-z0-9]+/g, "-");

      const matchesCategory =
        activeCategory === "All guides" ||
        pCat === activeLower ||
        pSlug === activeSlug ||
        pCat.replace(/[^a-z0-9]+/g, "-") === activeSlug;

      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        `${product.title} ${product.description} ${product.category}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });

    // Apply sorting
    result = [...result].sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      // default: featured first
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

    return result;
  }, [products, activeCategory, query, sortBy]);

  const scrollToShopWithCategory = (catName: string) => {
    setActiveCategory(catName);
    const el = document.getElementById("shop");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <StorefrontShell cart={cart} onRemove={removeFromCart}>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[#e5ddd2] bg-gradient-to-b from-[#fcfbf9] via-[#f8f4ec] to-[#f4ede2] pt-8 pb-14 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24">
        {/* Ambient warm radial glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#d86f45]/10 via-[#f0bc58]/10 to-transparent blur-3xl" />

        <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            {/* Left Content Column */}
            <div className="text-center lg:text-left">
              {/* Trust Badge Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d8d0c6]/70 bg-white/90 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#736b61] shadow-sm backdrop-blur-md sm:text-[11px]">
                <span className="flex h-2 w-2 rounded-full bg-[#5e8c67] animate-pulse" />
                <span>Instant Digital Guides</span>
                <span className="text-[#c2b8aa]">·</span>
                <span className="text-[#d86f45]">4.9★ Rated</span>
              </div>

              {/* Main Headline */}
              <h1 className="mt-5 font-serif text-[2.4rem] leading-[1.06] tracking-[-0.045em] text-[#26332f] min-[380px]:text-[2.75rem] min-[420px]:text-[3rem] sm:text-[4.5rem] sm:leading-[0.92] sm:tracking-[-0.065em] lg:text-[5.4rem]">
                <span className="block sm:inline">Practical Guides for </span>
                <span className="relative inline-block text-[#d86f45]">
                  Real-Life Problems
                  <span className="absolute -bottom-1 left-1/2 h-1.5 w-[94%] -translate-x-1/2 rotate-[-1.5deg] rounded-[50%] border-b-[3px] border-[#f0bc58]" />
                </span>
                .
              </h1>

              {/* Sub-headline */}
              <p className="mx-auto mt-6 max-w-[620px] text-sm leading-relaxed text-[#736b61] sm:text-base sm:leading-7 lg:mx-0">
                Simple, actionable digital guides designed to help you solve everyday challenges in
                money, relationships, personal growth, parenting, career and more.
              </p>

              {/* Trending Topic Quick Pills */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold lg:justify-start">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b8175]">
                  Trending:
                </span>
                {categories.slice(0, 4).map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => scrollToShopWithCategory(c.name)}
                    className="rounded-full border border-[#d8d0c6]/80 bg-white/80 px-3 py-1 text-xs text-[#26332f] transition-all hover:border-[#d86f45] hover:bg-[#d86f45] hover:text-white"
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Primary Call to Action Buttons */}
              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row lg:justify-start">
                <a
                  href="#shop"
                  className="group flex h-13 w-full items-center justify-center gap-2.5 rounded-full bg-[#d86f45] px-7 text-xs font-extrabold uppercase tracking-[0.13em] text-white shadow-[0_12px_24px_-8px_rgba(216,111,69,0.45)] transition-all hover:bg-[#bf5937] hover:shadow-[0_16px_32px_-8px_rgba(216,111,69,0.55)] active:scale-[0.99] sm:w-auto"
                >
                  Explore Collection
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="#shop"
                  onClick={() => {
                    setSortBy("featured");
                    setActiveCategory("All guides");
                  }}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-full border border-[#26332f]/20 bg-white/70 px-6 text-xs font-bold uppercase tracking-[0.12em] text-[#26332f] backdrop-blur-md transition-colors hover:bg-white hover:border-[#26332f] sm:w-auto"
                >
                  <Sparkles size={14} className="text-[#e4a83d]" /> View Bestsellers
                </a>
              </div>

              {/* Social Proof & Metrics */}
              <div className="mx-auto mt-10 grid max-w-[460px] grid-cols-3 gap-4 border-t border-[#e5ddd2]/80 pt-6 text-center lg:mx-0 lg:text-left">
                <div>
                  <p className="font-serif text-2xl font-bold tracking-tight text-[#26332f] sm:text-3xl">
                    {products.length > 0 ? `${products.length}+` : "50+"}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b8175]">
                    Digital Guides
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold tracking-tight text-[#26332f] sm:text-3xl">
                    4.9<span className="text-base text-[#d86f45]">/5</span>
                  </p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b8175] lg:justify-start">
                    <Star size={11} fill="currentColor" className="text-[#e4a83d]" /> 12k+ Reviews
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold tracking-tight text-[#26332f] sm:text-3xl">
                    100%
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b8175]">
                    Instant Access
                  </p>
                </div>
              </div>
            </div>

            {/* Right Showcase Column (Featured 3D Book Card) */}
            {heroFeatured && (
              <div className="relative mx-auto w-full max-w-[420px] lg:mx-0 lg:max-w-none">
                {/* Decorative Glowing Card Background */}
                <div className="relative rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/90 via-[#f8f5ee]/90 to-[#ede5d8]/80 p-6 shadow-[0_24px_50px_-20px_rgba(38,51,47,0.18)] backdrop-blur-xl sm:p-8">
                  {/* Floating Top Tag */}
                  <div className="mb-5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#26332f] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
                      <Sparkles size={11} className="text-[#f0bc58]" /> Editor's Choice
                    </span>
                    <span className="text-xs font-semibold text-[#8b8175]">
                      {heroFeatured.category}
                    </span>
                  </div>

                  {/* 3D Cover Art */}
                  <div className="group relative mx-auto w-full max-w-[260px] cursor-pointer">
                    <Link to={`/products/${heroFeatured.slug}`}>
                      <CoverArt
                        cover={heroFeatured.cover}
                        imageUrl={heroFeatured.imageUrl}
                        className="rounded-[1.25rem] shadow-[0_20px_40px_-16px_rgba(38,51,47,0.35)] transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-[1deg]"
                      />
                    </Link>
                  </div>

                  {/* Book Card Bottom Details */}
                  <div className="mt-6 text-center sm:text-left">
                    <Link
                      to={`/products/${heroFeatured.slug}`}
                      className="block font-serif text-xl font-semibold leading-tight text-[#26332f] transition-colors hover:text-[#d86f45] sm:text-2xl"
                    >
                      {heroFeatured.title}
                    </Link>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#736b61]">
                      {heroFeatured.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-[#e2dad0] pt-4">
                      <div>
                        <span className="font-serif text-2xl font-bold text-[#26332f]">
                          {formatCurrency(heroFeatured.price, currency)}
                        </span>
                        {heroFeatured.oldPrice && (
                          <span className="ml-2 text-xs text-[#a99d91] line-through">
                            {formatCurrency(heroFeatured.oldPrice, currency)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleBuyNow(heroFeatured)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#26332f] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#d86f45]"
                      >
                        <ShoppingBag size={13} /> Buy Guide
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CATALOG & SHOP SECTION */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="shop" className="scroll-mt-20 mx-auto max-w-[1320px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        {/* Section Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">Digital Library</p>
            <h2 className="section-title mt-2">
              Wisdom for every<br />
              <em>chapter of your life.</em>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#736b61]">
            Expertly crafted digital books designed to deliver clarity, actionable step-by-step
            strategies, and life-changing perspective.
          </p>
        </div>

        {/* ─── Search & Sort Bar ─── */}
        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-[#e5ddd2] bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b8175]" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by topic, keyword, or book title..."
              className="h-11 w-full rounded-xl bg-[#f8f4ec] pl-10 pr-10 text-xs font-medium text-[#26332f] outline-none placeholder:text-[#8b8175] focus:bg-white focus:ring-2 focus:ring-[#d86f45]/30"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8175] hover:text-[#26332f]"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-[#8b8175] hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-11 rounded-xl border border-[#d8d0c6] bg-[#f8f4ec] px-3.5 text-xs font-semibold text-[#26332f] outline-none focus:border-[#d86f45]"
            >
              <option value="featured">Featured First</option>
              <option value="rating">Highest Rated (★ 5.0)</option>
              <option value="newest">New Releases</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* ─── Category Filter Tabs ─── */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-[#e5ddd2] pb-6">
          <button
            onClick={() => setActiveCategory("All guides")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-all ${
              activeCategory === "All guides"
                ? "bg-[#26332f] text-white shadow-sm"
                : "border border-[#d8d0c6] bg-white text-[#736b61] hover:border-[#26332f] hover:text-[#26332f]"
            }`}
          >
            All Guides
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeCategory === "All guides"
                  ? "bg-white/20 text-white"
                  : "bg-[#f0ece4] text-[#736b61]"
              }`}
            >
              {products.length}
            </span>
          </button>

          {categories.map((category) => {
            const count = getCategoryCount(category.name, category.slug);
            const isSelected = activeCategory === category.name;

            return (
              <button
                key={category.slug}
                onClick={() => setActiveCategory(category.name)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-all ${
                  isSelected
                    ? "bg-[#26332f] text-white shadow-sm"
                    : "border border-[#d8d0c6] bg-white text-[#736b61] hover:border-[#26332f] hover:text-[#26332f]"
                }`}
              >
                {category.name}
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-[#f0ece4] text-[#736b61]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── Product Cards Grid ─── */}
        {filteredAndSortedProducts.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-7">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={addToCart}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border-2 border-dashed border-[#d8d0c6] bg-white/50 px-6 py-20 text-center">
            <p className="font-serif text-2xl text-[#26332f] sm:text-3xl">
              No digital guides match your search.
            </p>
            <p className="mt-2 text-sm text-[#736b61]">
              Try adjusting your search terms or clearing your category filters.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setActiveCategory("All guides");
              }}
              className="mt-6 rounded-full bg-[#d86f45] px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#bf5937]"
            >
              Reset Filters & Show All
            </button>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4-PILLAR TRUST & VALUE BANNER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-[#e5ddd2] bg-white py-14">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-4 rounded-2xl bg-[#fcfbf9] p-5 border border-[#eee7dc]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d86f45]/10 text-[#d86f45]">
                <Zap size={22} />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#26332f]">Instant Download</h4>
                <p className="mt-1 text-xs text-[#736b61]">
                  Receive high-resolution PDF download links right after checkout.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl bg-[#fcfbf9] p-5 border border-[#eee7dc]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4c7b55]/10 text-[#4c7b55]">
                <LockKeyhole size={22} />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#26332f]">Paystack 256-bit Security</h4>
                <p className="mt-1 text-xs text-[#736b61]">
                  Bank-grade encrypted checkout with global Visa, Mastercard & Apple Pay.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl bg-[#fcfbf9] p-5 border border-[#eee7dc]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e4a83d]/10 text-[#e4a83d]">
                <Globe size={22} />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#26332f]">Worldwide Pricing</h4>
                <p className="mt-1 text-xs text-[#736b61]">
                  Auto-detected local currency with zero conversion surprises.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl bg-[#fcfbf9] p-5 border border-[#eee7dc]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#26332f]/10 text-[#26332f]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#26332f]">Lifetime Access</h4>
                <p className="mt-1 text-xs text-[#736b61]">
                  Read on mobile, iPad, Kindle, or laptop with permanent cloud access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* QUICK VIEW PREVIEW MODAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {quickViewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setQuickViewProduct(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-[#fbfaf7] p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#736b61] shadow-sm hover:bg-[#eee7dc] hover:text-[#26332f]"
            >
              <X size={18} />
            </button>

            <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:gap-8">
              <div>
                <CoverArt
                  cover={quickViewProduct.cover}
                  imageUrl={quickViewProduct.imageUrl}
                  className="rounded-2xl shadow-xl"
                />
              </div>

              <div>
                <span className="inline-block rounded-full bg-[#eef1eb] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5e8c67]">
                  {quickViewProduct.category}
                </span>

                <h3 className="mt-2 font-serif text-2xl font-bold leading-tight text-[#26332f] sm:text-3xl">
                  {quickViewProduct.title}
                </h3>

                <div className="mt-3 flex items-center gap-2 text-xs text-[#736b61]">
                  <div className="flex items-center text-[#e4a83d]">
                    <Star size={13} fill="currentColor" />
                  </div>
                  <span className="font-bold text-[#26332f]">{quickViewProduct.rating}</span>
                  <span>({quickViewProduct.reviews} reader reviews)</span>
                  <span>·</span>
                  <span>{quickViewProduct.pages} pages PDF</span>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[#736b61]">
                  {quickViewProduct.description}
                </p>

                {quickViewProduct.benefits && quickViewProduct.benefits.length > 0 && (
                  <div className="mt-4 space-y-1.5 rounded-xl bg-white p-3.5 border border-[#eee7dc]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#26332f]">
                      Key Highlights:
                    </p>
                    {quickViewProduct.benefits.slice(0, 3).map((b, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#736b61]">
                        <Check size={13} className="text-[#5e8c67] shrink-0" />
                        <span className="line-clamp-1">{b}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex items-baseline gap-3">
                  <span className="font-serif text-3xl font-bold text-[#26332f]">
                    {formatCurrency(quickViewProduct.price, currency)}
                  </span>
                  {quickViewProduct.oldPrice && (
                    <span className="text-sm text-[#a99d91] line-through">
                      {formatCurrency(quickViewProduct.oldPrice, currency)}
                    </span>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      addToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 rounded-full border border-[#26332f] bg-white py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#26332f] transition hover:bg-[#26332f] hover:text-white"
                  >
                    Add to Bag
                  </button>
                  <button
                    onClick={() => {
                      handleBuyNow(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 rounded-full bg-[#d86f45] py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-md transition hover:bg-[#bf5937]"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </StorefrontShell>
  );
}
