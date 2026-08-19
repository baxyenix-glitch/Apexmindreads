import { useState } from "react";
import { ArrowRight, ChevronDown, LogOut, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatCurrency, useCurrency } from "@/lib/currency";
import { type Product } from "@/lib/store";
import { CoverArt } from "./CoverArt";
import { useAuth } from "@/lib/auth";

type StorefrontShellProps = { children: React.ReactNode; cart: Product[]; onRemove: (productId: string) => void };

export function StorefrontShell({ children, cart, onRemove }: StorefrontShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const cartTotal = cart.reduce((sum, product) => sum + product.price, 0);
  const { currency, setCurrency, options } = useCurrency();
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
      <div className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.17em] sm:text-[11px]" style={{ backgroundColor: "var(--theme-text)", color: "var(--theme-bg)" }}>
        Free delivery on every guide · Instant access after checkout
      </div>
      <header className="relative z-40 border-b backdrop-blur" style={{ backgroundColor: "var(--theme-bg)", borderColor: "var(--theme-border)" }}>
        <div className="mx-auto flex h-[68px] max-w-[1320px] items-center justify-between px-3 sm:h-[74px] sm:px-5 lg:h-[84px] lg:px-10">
          <Link to="/" className="group flex min-w-0 items-center gap-1.5 focus:outline-none focus-visible:ring-2 sm:gap-2.5" onClick={() => setMenuOpen(false)}>
            <img src="https://cdn.builder.io/api/v1/image/assets%2F65219c2b646c40599cdbfb399c78ee49%2F25bc89c4be474445946731673dbce175?format=webp&width=800&height=1200" alt="ApexMindReads logo" className="h-9 w-9 shrink-0 object-contain transition-transform group-hover:rotate-3 sm:h-10 sm:w-10" />
            <span className="truncate font-serif text-[1.15rem] font-semibold tracking-[-0.05em] sm:text-[1.45rem]">ApexMind<span style={{ color: "var(--theme-accent)" }}>Reads</span></span>
          </Link>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            <Link className={location.pathname === "/" ? "nav-link-active nav-link" : "nav-link"} to="/">Home</Link>
            <button className="nav-link" onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}>Shop all</button>
            <button className="nav-link" onClick={() => document.getElementById("story")?.scrollIntoView({ behavior: "smooth" })}>Our story</button>
            {isLoggedIn ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="nav-link flex items-center gap-1.5"><User size={15} /> {user?.name?.split(" ")[0]} <ChevronDown size={13} /></button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border py-2 shadow-xl" style={{ backgroundColor: "var(--theme-bg-card)", borderColor: "var(--theme-border)" }}>
                    <Link to="/my-orders" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:opacity-80">My orders</Link>
                    <button onClick={async () => { await logout(); setUserMenuOpen(false); navigate("/"); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#b91c1c] hover:bg-[#fef2f2]"><LogOut size={14} /> Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link className="nav-link" to="/auth">Sign in</Link>
            )}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <label className="flex h-10 items-center gap-1 rounded-full px-2 text-[10px] font-bold uppercase tracking-[0.1em] transition sm:px-3 sm:text-xs cursor-pointer" style={{ color: "var(--theme-text-muted)" }}>
              <span className="hidden text-base sm:inline">{options.find(o => o.code === currency)?.symbol || currency}</span>
              <select value={currency} onChange={(event) => setCurrency(event.target.value as typeof currency)} aria-label="Choose currency" className="appearance-none bg-transparent outline-none cursor-pointer pr-1">
                <option value="NGN" className="bg-white text-black">NGN</option>
                {options.filter((option) => option.code !== "NGN").map((option) => (
                  <option key={option.code} value={option.code} className="bg-white text-black">{option.code}</option>
                ))}
              </select>
              <ChevronDown size={13} className="-ml-1" />
            </label>
            <button onClick={() => setCartOpen(true)} className="relative flex h-10 items-center gap-2 rounded-full px-3.5 text-white transition hover:opacity-90 shadow-sm" style={{ backgroundColor: "var(--theme-accent)" }} aria-label={`Open basket with ${cart.length} items`}>
              <ShoppingBag size={17} strokeWidth={1.8} />
              <span className="hidden text-xs font-bold uppercase tracking-[0.1em] sm:inline">Basket</span>
              {cart.length > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-[#26332f]" style={{ backgroundColor: "var(--theme-accent-badge)" }}>{cart.length}</span>}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-full lg:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t px-5 py-5 lg:hidden" style={{ backgroundColor: "var(--theme-bg)", borderColor: "var(--theme-border)" }}>
            <nav className="mx-auto flex max-w-[1320px] flex-col gap-1" aria-label="Mobile navigation">
              <button onClick={() => { setMenuOpen(false); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-xl px-3 py-3 text-left font-serif text-xl hover:opacity-80">Shop all</button>
              <button onClick={() => { setMenuOpen(false); document.getElementById("story")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-xl px-3 py-3 text-left font-serif text-xl hover:opacity-80">Our story</button>
              {isLoggedIn ? (
                <>
                  <Link to="/my-orders" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 font-serif text-xl hover:opacity-80">My orders</Link>
                  <button onClick={async () => { await logout(); setMenuOpen(false); navigate("/"); }} className="rounded-xl px-3 py-3 text-left font-serif text-xl text-[#b91c1c] hover:bg-[#fef2f2]">Sign out</button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 font-serif text-xl hover:opacity-80">Sign in</Link>
              )}
            </nav>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="px-5 py-14 lg:px-10 lg:py-20" style={{ backgroundColor: "var(--theme-text)", color: "var(--theme-bg)" }}>
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
            <div>
              <Link to="/" className="font-serif text-2xl tracking-[-0.05em]">ApexMind<span style={{ color: "var(--theme-accent)" }}>Reads</span></Link>
              <p className="mt-5 max-w-xs text-sm leading-6 opacity-80">PDF guides for money, work, boundaries, home, and everyday life.</p>
            </div>
            <div>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--theme-accent-badge)" }}>Explore</p>
              <div className="flex flex-col gap-3 text-sm opacity-90">
                <button onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })} className="text-left transition hover:opacity-100">All guides</button>
                <button onClick={() => document.getElementById("story")?.scrollIntoView({ behavior: "smooth" })} className="text-left transition hover:opacity-100">Our story</button>
              </div>
            </div>
            <div>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--theme-accent-badge)" }}>Need help?</p>
              <div className="flex flex-col gap-3 text-sm opacity-90">
                <a href="mailto:hello@apexmindreads.com" className="transition hover:opacity-100">hello@apexmindreads.com</a>
                <Link to="/contact" className="transition hover:opacity-100">FAQs</Link>
                <Link to="/contact" className="transition hover:opacity-100">Contact us</Link>
              </div>
            </div>
            <div>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--theme-accent-badge)" }}>Stay in the know</p>
              <p className="mb-4 text-sm leading-6 opacity-80">Fresh guides, practical notes and a little encouragement.</p>
              <div className="flex rounded-full border p-1" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                <input type="email" placeholder="Your email address" aria-label="Email address" className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white placeholder:opacity-60 focus:outline-none" />
                <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90" style={{ backgroundColor: "var(--theme-accent)" }} aria-label="Subscribe"><ArrowRight size={17} /></button>
              </div>
            </div>
          </div>
          <div className="mt-14 flex flex-col gap-3 border-t pt-6 text-[11px] opacity-70 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
            <span>© 2025 ApexMindReads. Built for the becoming.</span>
            <div className="flex gap-5">
              <Link to="/privacy" className="hover:underline">Privacy</Link>
              <Link to="/terms" className="hover:underline">Terms</Link>
              <Link to="/refunds" className="hover:underline">Refunds</Link>
            </div>
          </div>
        </div>
      </footer>
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} aria-label="Close basket overlay" />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col p-5 shadow-2xl sm:p-8" style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }} aria-label="Shopping basket">
            <div className="flex items-center justify-between border-b pb-5" style={{ borderColor: "var(--theme-border)" }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--theme-kicker)" }}>Your basket</p>
                <h2 className="mt-1 font-serif text-3xl tracking-[-0.05em]">Ready when you are.</h2>
              </div>
              <button onClick={() => setCartOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full hover:opacity-75" aria-label="Close basket"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-6">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "var(--theme-bg-muted)" }}>
                    <ShoppingBag size={25} style={{ color: "var(--theme-accent)" }} />
                  </div>
                  <h3 className="font-serif text-2xl">Your basket is empty</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6" style={{ color: "var(--theme-text-muted)" }}>Choose a guide, pay once, and keep it in your library.</p>
                  <button onClick={() => { setCartOpen(false); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-6 rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-sm" style={{ backgroundColor: "var(--theme-text)", color: "var(--theme-bg)" }}>
                    Explore guides
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {cart.map((product) => (
                    <div key={product.id} className="flex gap-4 p-3 rounded-xl border" style={{ backgroundColor: "var(--theme-bg-card)", borderColor: "var(--theme-border)" }}>
                      <CoverArt cover={product.cover} imageUrl={product.imageUrl} compact className="h-28 w-[84px] shrink-0" />
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--theme-text-muted)" }}>{product.category}</p>
                          <h3 className="mt-1 font-serif text-xl leading-none">{product.title}</h3>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{formatCurrency(product.price, currency)}</span>
                          <button onClick={() => onRemove(product.id)} className="text-xs font-bold underline underline-offset-2 hover:opacity-80" style={{ color: "var(--theme-accent)" }}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t pt-5" style={{ borderColor: "var(--theme-border)" }}>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--theme-text-muted)" }}>Subtotal</span>
                  <strong className="text-xl">{formatCurrency(cartTotal, currency)}</strong>
                </div>
                <Link to="/checkout" onClick={() => setCartOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:opacity-90 shadow-md" style={{ backgroundColor: "var(--theme-accent)" }}>
                  Continue to checkout <ArrowRight size={16} />
                </Link>
                <p className="mt-3 text-center text-[11px]" style={{ color: "var(--theme-text-muted)" }}>Secure payment · Instant PDF delivery</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
