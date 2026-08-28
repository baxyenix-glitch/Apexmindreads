import { useState } from "react";
import { ArrowRight, ChevronDown, LogOut, Menu, ShoppingBag, User, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatCurrency, useCurrency } from "@/lib/currency";
import { type Product } from "@/lib/store";
import { CoverArt } from "./CoverArt";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { AddToCartToast } from "./AddToCartToast";

type StorefrontShellProps = {
  children: React.ReactNode;
  cart?: Product[];
  onRemove?: (productId: string) => void;
};

export function StorefrontShell({ children, cart: propCart, onRemove: propOnRemove }: StorefrontShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const cartContext = useCart();
  const cart = propCart ?? cartContext.cart;
  const onRemove = propOnRemove ?? cartContext.removeFromCart;
  const isCartOpen = cartContext.isCartOpen;
  const setIsCartOpen = cartContext.setIsCartOpen;
  const cartCountAnimation = cartContext.cartCountAnimation;

  const cartTotal = cart.reduce((sum, product) => sum + (product.price || 0), 0);
  const { currency, setCurrency, options } = useCurrency();
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f4ec] text-[#26332f]">
      {/* Toast Notification Container */}
      <AddToCartToast />

      {/* Announcement Bar */}
      <div className="bg-[#26332f] px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.17em] text-[#f8e3b6] sm:text-[11px]">
        Free delivery on every guide · Instant access after checkout
      </div>

      {/* Navigation Header */}
      <header className="relative z-40 border-b border-[#e5ddd2] bg-[#f8f4ec]/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1320px] items-center justify-between px-3 sm:h-[74px] sm:px-5 lg:h-[84px] lg:px-10">
          <Link
            to="/"
            className="group flex min-w-0 items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d86f45] sm:gap-2.5"
            onClick={() => setMenuOpen(false)}
          >
            <img
              src="/logo.png"
              alt="ApexMindReads logo"
              className="h-9 w-9 shrink-0 object-contain transition-transform group-hover:rotate-3 sm:h-10 sm:w-10"
            />
            <span className="truncate font-serif text-[1.15rem] font-semibold tracking-[-0.05em] text-[#26332f] sm:text-[1.45rem]">
              ApexMind<span className="text-[#d86f45]">Reads</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            <Link className={location.pathname === "/" ? "nav-link-active nav-link" : "nav-link"} to="/">
              Home
            </Link>
            <button
              className="nav-link"
              onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}
            >
              Shop all
            </button>
            <button
              className="nav-link"
              onClick={() => document.getElementById("story")?.scrollIntoView({ behavior: "smooth" })}
            >
              Our story
            </button>
            {isLoggedIn ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="nav-link flex items-center gap-1.5">
                  <User size={15} /> {user?.name?.split(" ")[0]} <ChevronDown size={13} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[#e5ddd2] bg-[#fffaf2] py-2 shadow-xl">
                    <Link
                      to="/my-orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm hover:bg-[#f0ebe1]"
                    >
                      My orders
                    </Link>
                    <button
                      onClick={async () => {
                        await logout();
                        setUserMenuOpen(false);
                        navigate("/");
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#b91c1c] hover:bg-[#fef2f2]"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link className="nav-link" to="/auth">
                Sign in
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Currency Selector */}
            <label className="flex h-10 items-center gap-1 rounded-full px-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#736b61] transition hover:bg-[#eee7dc] sm:px-3 sm:text-xs cursor-pointer">
              <span className="hidden text-base sm:inline">
                {options.find((o) => o.code === currency)?.symbol || currency}
              </span>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as typeof currency)}
                aria-label="Choose currency"
                className="appearance-none bg-transparent outline-none cursor-pointer pr-1"
              >
                <option value="NGN">NGN</option>
                {options
                  .filter((option) => option.code !== "NGN")
                  .map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.code}
                    </option>
                  ))}
              </select>
              <ChevronDown size={13} className="-ml-1" />
            </label>

            {/* Shopping Basket Button with Bounce Animation */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative flex h-10 items-center gap-2 rounded-full bg-[#26332f] px-3.5 text-[#fffaf2] transition-all duration-300 hover:bg-[#d86f45] active:scale-95 ${
                cartCountAnimation ? "scale-105 bg-[#d86f45] ring-4 ring-[#d86f45]/20 shadow-md" : ""
              }`}
              aria-label={`Open basket with ${cart.length} items`}
            >
              <ShoppingBag
                size={17}
                strokeWidth={1.8}
                className={`transition-transform duration-300 ${cartCountAnimation ? "rotate-[-12deg] scale-110" : ""}`}
              />
              <span className="hidden text-xs font-bold uppercase tracking-[0.1em] sm:inline">Basket</span>
              {cart.length > 0 && (
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f0bc58] px-1 text-[10px] font-extrabold text-[#26332f] transition-transform duration-300 ${
                    cartCountAnimation ? "scale-125 bg-white text-[#d86f45]" : ""
                  }`}
                >
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#26332f] lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="border-t border-[#e5ddd2] bg-[#f8f4ec] px-5 py-5 lg:hidden">
            <nav className="mx-auto flex max-w-[1320px] flex-col gap-1" aria-label="Mobile navigation">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl px-3 py-3 text-left font-serif text-xl hover:bg-[#eee7dc]"
              >
                Shop all
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  document.getElementById("story")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl px-3 py-3 text-left font-serif text-xl hover:bg-[#eee7dc]"
              >
                Our story
              </button>
              {isLoggedIn ? (
                <>
                  <Link
                    to="/my-orders"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-3 font-serif text-xl hover:bg-[#eee7dc]"
                  >
                    My orders
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      setMenuOpen(false);
                      navigate("/");
                    }}
                    className="rounded-xl px-3 py-3 text-left font-serif text-xl text-[#b91c1c] hover:bg-[#fef2f2]"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 font-serif text-xl hover:bg-[#eee7dc]"
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-[#26332f] px-5 py-14 text-[#f8f4ec] lg:px-10 lg:py-20">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
            <div>
              <Link to="/" className="font-serif text-2xl tracking-[-0.05em]">
                ApexMind<span className="text-[#e58a61]">Reads</span>
              </Link>
              <p className="mt-5 max-w-xs text-sm leading-6 text-[#bec5bb]">
                PDF guides for money, work, boundaries, home, and everyday life.
              </p>
            </div>
            <div>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0bc58]">Explore</p>
              <div className="flex flex-col gap-3 text-sm text-[#d8ddd5]">
                <button
                  onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-left transition hover:text-[#f0bc58]"
                >
                  All guides
                </button>
                <button
                  onClick={() => document.getElementById("story")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-left transition hover:text-[#f0bc58]"
                >
                  Our story
                </button>
              </div>
            </div>
            <div>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0bc58]">Need help?</p>
              <div className="flex flex-col gap-3 text-sm text-[#d8ddd5]">
                <a href="mailto:hello@apexmindreads.com" className="transition hover:text-[#f0bc58]">
                  hello@apexmindreads.com
                </a>
                <Link to="/contact" className="transition hover:text-[#f0bc58]">
                  FAQs
                </Link>
                <Link to="/contact" className="transition hover:text-[#f0bc58]">
                  Contact us
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0bc58]">Stay in the know</p>
              <p className="mb-4 text-sm leading-6 text-[#bec5bb]">
                Fresh guides, practical notes and a little encouragement.
              </p>
              <div className="flex rounded-full border border-[#53625b] p-1">
                <input
                  type="email"
                  placeholder="Your email address"
                  aria-label="Email address"
                  className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white placeholder:text-[#91a098] focus:outline-none"
                />
                <button
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0bc58] text-[#26332f] transition hover:bg-[#f8d88f]"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-14 flex flex-col gap-3 border-t border-[#53625b] pt-6 text-[11px] text-[#91a098] sm:flex-row sm:items-center sm:justify-between">
            <span>© 2025 ApexMindReads. Built for the becoming.</span>
            <div className="flex gap-5">
              <Link to="/privacy" className="hover:text-white">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-white">
                Terms
              </Link>
              <Link to="/refunds" className="hover:text-white">
                Refunds
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Drawer Slide-out */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-[#26332f]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close basket overlay"
          />
          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-[#f8f4ec] p-5 shadow-2xl transition-transform duration-300 sm:p-8"
            aria-label="Shopping basket"
          >
            <div className="flex items-center justify-between border-b border-[#e5ddd2] pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d86f45]">Your basket</p>
                <h2 className="mt-1 font-serif text-3xl tracking-[-0.05em]">Ready when you are.</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#eee7dc]"
                aria-label="Close basket"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#eee7dc]">
                    <ShoppingBag size={25} />
                  </div>
                  <h3 className="font-serif text-2xl">Your basket is empty</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-[#736b61]">
                    Choose a guide, pay once, and keep it in your library.
                  </p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="mt-6 rounded-full bg-[#26332f] px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#3b4b45]"
                  >
                    Explore guides
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {cart.map((product) => (
                    <div key={product.id} className="flex gap-4">
                      <CoverArt
                        cover={product.cover}
                        imageUrl={product.imageUrl}
                        compact
                        className="h-28 w-[84px] shrink-0 shadow-sm"
                      />
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b8175]">
                            {product.category}
                          </p>
                          <h3 className="mt-1 font-serif text-xl leading-none">{product.title}</h3>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{formatCurrency(product.price, currency)}</span>
                          <button
                            onClick={() => onRemove(product.id)}
                            className="text-xs font-bold text-[#a99d91] underline underline-offset-2 hover:text-[#d86f45]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-[#e5ddd2] pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-[#736b61]">Subtotal</span>
                  <strong className="text-xl">{formatCurrency(cartTotal, currency)}</strong>
                </div>
                <Link
                  to="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d86f45] py-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#be5935]"
                >
                  Continue to checkout <ArrowRight size={16} />
                </Link>
                <p className="mt-3 text-center text-[11px] text-[#8b8175]">Secure payment · Instant PDF delivery</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
