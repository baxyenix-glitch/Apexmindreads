import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Globe, LockKeyhole, Loader2, ShieldCheck, ShoppingBag, Sparkles, UserCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { CoverArt } from "@/components/storefront/CoverArt";
import { type Product } from "@/lib/store";
import { formatCurrency, useCurrency, ALL_COUNTRIES, countryToCurrencyMap } from "@/lib/currency";
import { loadCart, saveCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { authHeaders } from "@/lib/firebase";
import type { Order, OrderResponse, PaystackInitResponse, PaystackVerifyResponse } from "@shared/api";

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_adcfbac2b26d102c6107634886d6c4edbf7e87ef";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const [cart, setCart] = useState<Product[]>(() => loadCart());
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<{ productId: string; title: string; downloadUrl: string }[]>([]);
  const [error, setError] = useState("");
  const { currency, setCurrency, detectedCountry } = useCurrency();
  const { user } = useAuth();
  const subtotal = useMemo(() => cart.reduce((total, item) => total + (item.price || 0), 0), [cart]);

  useEffect(() => saveCart(cart), [cart]);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState(() => detectedCountry || "NG");

  useEffect(() => {
    if (detectedCountry) {
      setCountry(detectedCountry);
    }
  }, [detectedCountry]);

  // Pre-fill from auth if available
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name);
    }
  }, [user]);

  // Automatically update currency when country changes
  const handleCountryChange = (selectedCountryCode: string) => {
    setCountry(selectedCountryCode);
    const mappedCurrency = countryToCurrencyMap[selectedCountryCode];
    if (mappedCurrency) {
      setCurrency(mappedCurrency, true);
    }
  };

  // Check if returning from Paystack redirect (e.g. ?reference=...)
  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (reference) {
      verifyTransaction(reference);
    }
  }, [searchParams]);

  const verifyTransaction = async (reference: string, orderId?: string) => {
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, orderId }),
      });

      const data: PaystackVerifyResponse = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error((data as any).error || "Payment verification failed");
      }

      setCompletedOrder(data.order);
      setDownloadLinks(data.downloadUrls || []);
      setSubmitted(true);
      saveCart([]);
      setCart([]);
    } catch (err: any) {
      setError(err.message || "Failed to verify transaction. Please contact support.");
    } finally {
      setVerifying(false);
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const customerEmail = (email || user?.email || "").trim();
      const customerName = (name || user?.name || "").trim() || "Valued Customer";

      if (!customerEmail) {
        throw new Error("Please enter your email address");
      }

      if (cart.length === 0) {
        throw new Error("Your basket is empty. Please add a guide first.");
      }

      // Step 1: Create Order in DB
      const authHdrs = await authHeaders();
      const headers: HeadersInit = { "Content-Type": "application/json", ...authHdrs };
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          customerEmail,
          customerName,
          country: country || "NG",
          items: cart.map((p) => ({
            productId: String(p.id || p.slug || "guide-1"),
            title: String(p.title || "ApexMindReads Guide"),
            price: Number(p.price || 0),
          })),
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({ error: "Failed to create order" }));
        throw new Error(err.error || "Failed to create order");
      }

      const orderData: OrderResponse = await orderRes.json();
      const orderId = orderData.order.id;

      // Step 2: Initialize Paystack transaction with global currency support
      const paystackInitRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          email: customerEmail,
          amount: subtotal,
          currency: currency,
          callbackUrl: `${window.location.origin}/checkout`,
        }),
      });

      const initData: PaystackInitResponse = await paystackInitRes.json();

      if (!paystackInitRes.ok) {
        throw new Error((initData as any).error || "Could not start Paystack transaction");
      }

      // Step 3: Trigger Paystack Popup or redirect
      if (typeof window !== "undefined" && window.PaystackPop) {
        try {
          if (typeof window.PaystackPop === "function") {
            const popup = new window.PaystackPop();
            if (initData.access_code && typeof popup.resumeTransaction === "function") {
              popup.resumeTransaction(initData.access_code, {
                onSuccess: (transaction: any) => {
                  verifyTransaction(transaction.reference || initData.reference, orderId);
                },
                onCancel: () => {
                  setSubmitting(false);
                },
              });
              return;
            }
          }
        } catch (popErr) {
          console.warn("Paystack popup error, falling back to redirect:", popErr);
        }
      }

      if (initData.authorization_url) {
        window.location.href = initData.authorization_url;
      } else {
        throw new Error("Unable to open payment gateway. Please try again.");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f4ec] px-5 py-20 text-center">
        <div className="max-w-md">
          <Loader2 size={40} className="mx-auto animate-spin text-[#d86f45]" />
          <h2 className="mt-6 font-serif text-3xl">Confirming your transaction...</h2>
          <p className="mt-2 text-sm text-[#736b61]">
            Please wait while we verify your payment with Paystack and prepare your digital ebook downloads.
          </p>
        </div>
      </div>
    );
  }

  if (submitted && completedOrder) {
    return (
      <div className="min-h-screen bg-[#f8f4ec] px-5 py-16 text-[#26332f]">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dcebdd] text-[#4c7b55]">
            <Check size={32} />
          </div>

          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#eef1eb] px-3.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#5e8c67]">
            <Sparkles size={13} /> Payment Confirmed
          </div>

          <h1 className="mt-4 font-serif text-4xl leading-[0.92] tracking-[-0.06em] sm:text-5xl">
            Your guides are ready.<br />
            <em>Welcome to the journey.</em>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#736b61]">
            Thank you, <strong>{completedOrder.customerName}</strong>! Your order <strong>{completedOrder.id}</strong> has been successfully processed. You have lifetime access to your guides below.
          </p>

          <div className="my-8 space-y-4 rounded-2xl bg-[#f8f4ec] p-5 text-left">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8b8175]">Your Downloads</p>
            {completedOrder.items.map((item) => (
              <div key={item.productId} className="flex flex-col gap-3 rounded-xl border border-[#e5ddd2] bg-[#fffaf2] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-lg leading-tight text-[#26332f]">{item.title}</h3>
                  <p className="mt-1 text-xs text-[#8b8175]">PDF Format · Instant Digital Edition</p>
                </div>
                <a
                  href={`/api/orders/${completedOrder.id}/download/${item.productId}`}
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d86f45] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[#bf5937] active:scale-95"
                >
                  <Download size={15} /> Download PDF
                </a>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#e5ddd2] bg-[#f8f4ec] p-4 text-xs text-[#736b61]">
            <p>
              📧 A confirmation has also been recorded for <strong>{completedOrder.customerEmail}</strong>.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/#shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#26332f] px-6 py-4 text-xs font-bold uppercase tracking-[0.13em] text-white transition hover:bg-[#384843]"
            >
              Browse more guides <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f4ec] text-[#26332f]">
      <header className="border-b border-[#e5ddd2] bg-[#f8f4ec]">
        <div className="mx-auto flex h-[66px] max-w-[1180px] items-center justify-between px-3.5 sm:h-[74px] sm:px-6 lg:px-10">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-serif text-[1.15rem] font-semibold tracking-[-0.04em] sm:text-[1.35rem]">
            <img src="https://cdn.builder.io/api/v1/image/assets%2F65219c2b646c40599cdbfb399c78ee49%2F25bc89c4be474445946731673dbce175?format=webp&width=800&height=1200" alt="ApexMindReads logo" className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9" />
            <span className="whitespace-nowrap">ApexMind<span className="text-[#d86f45]">Reads</span></span>
          </Link>
          <Link to="/" className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b8175] transition hover:text-[#d86f45] sm:text-xs sm:tracking-[0.12em]">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Continue shopping</span>
            <span className="sm:hidden">Back to shop</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1180px] gap-8 px-5 py-10 lg:grid-cols-[1fr_390px] lg:px-10 lg:py-16">
        <div>
          <p className="section-kicker">Global Secure Checkout</p>
          <h1 className="mt-3 font-serif text-5xl leading-[0.88] tracking-[-0.06em] sm:text-6xl">
            Your journey<br />
            <em>begins here.</em>
          </h1>

          {error && (
            <div className="mt-6 rounded-2xl border border-[#fca5a5] bg-[#fff5f5] p-4 text-sm font-medium text-[#b91c1c]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-10 max-w-xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#26332f] text-xs font-bold text-white">
                1
              </span>
              <div>
                <h2 className="font-serif text-2xl">Customer information</h2>
                <p className="text-xs text-[#8b8175]">Your download links will be generated for this name & email.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">
                  Email address
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-[#f8f4ec] px-4 text-sm outline-none focus:border-[#d86f45]"
                />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">
                  Full name
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Amara"
                  className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-[#f8f4ec] px-4 text-sm outline-none focus:border-[#d86f45]"
                />
              </label>
              <label>
                <div className="mb-2 flex items-center justify-between">
                  <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">
                    Country
                  </span>
                  <span className="text-[11px] font-semibold text-[#8b8175]">
                    Currency auto-set: <strong className="text-[#d86f45]">{currency}</strong>
                  </span>
                </div>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-[#f8f4ec] px-4 text-sm font-medium outline-none focus:border-[#d86f45]"
                >
                  {ALL_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code}) — {c.currency}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="my-8 flex items-center justify-between border-y border-[#e5ddd2] py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#26332f] text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <h2 className="font-serif text-2xl">Payment method</h2>
                  <p className="text-xs text-[#8b8175]">International Cards (Visa, Mastercard, Amex), Apple Pay & Bank</p>
                </div>
              </div>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Paystack_Logo.png"
                alt="Paystack"
                className="h-6 object-contain opacity-80"
                onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#d86f45] text-xs font-bold uppercase tracking-[0.14em] text-white shadow-sm transition hover:bg-[#bf5937] active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={17} className="animate-spin" /> Connecting to Paystack...
                </span>
              ) : (
                <>
                  Pay {formatCurrency(subtotal, currency)} with Paystack <ArrowRight size={17} />
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#8b8175]">
              <LockKeyhole size={13} /> 256-bit encrypted secure checkout · Worldwide payments accepted
            </div>
          </form>
        </div>

        <aside className="h-fit rounded-[1.5rem] bg-[#26332f] p-6 text-[#f8f4ec] lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#f0bc58]">Order summary</p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-0.05em]">Your guides</h2>
            </div>
            <ShoppingBag size={24} className="text-[#f0bc58]" />
          </div>

          <div className="my-6 space-y-4 divide-y divide-[#384843]">
            {cart.map((item) => (
              <div key={item.id} className="flex items-start gap-4 pt-4 first:pt-0">
                <CoverArt cover={item.cover} imageUrl={item.imageUrl} className="h-20 w-14 shrink-0 rounded-lg shadow-md" compact />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-serif text-base leading-snug">{item.title}</p>
                  <p className="mt-1 text-xs text-[#a3b3ae]">Digital PDF Edition</p>
                  <p className="mt-2 font-serif text-base font-bold text-[#f0bc58]">
                    {formatCurrency(item.price, currency)}
                  </p>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <p className="py-8 text-center text-sm text-[#a3b3ae]">Your basket is empty.</p>
            )}
          </div>

          <div className="border-t border-[#384843] pt-4">
            <div className="flex items-center justify-between text-xs text-[#a3b3ae]">
              <span>Subtotal ({cart.length} item{cart.length !== 1 ? "s" : ""})</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#a3b3ae]">
              <span>Delivery</span>
              <span className="font-semibold text-[#82c99b]">Instant Download (Free)</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-[#384843] pt-4 font-serif">
              <span className="text-lg">Total</span>
              <span className="text-3xl font-bold text-[#f0bc58]">{formatCurrency(subtotal, currency)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-2.5 rounded-xl bg-[#1d2724] p-4 text-xs text-[#a3b3ae]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#82c99b]" />
              <span>Official Lifetime Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-[#82c99b]" />
              <span>Instant Worldwide PDF Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck size={14} className="text-[#82c99b]" />
              <span>Paystack Verified Payment Gateway</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
