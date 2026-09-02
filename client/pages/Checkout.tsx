import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Globe, LockKeyhole, Loader2, ShieldCheck, ShoppingBag, Sparkles, UserCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { CoverArt } from "@/components/storefront/CoverArt";
import { type Product } from "@/lib/store";
import { formatCurrency, useCurrency, countryToCurrencyMap } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { authHeaders } from "@/lib/firebase";
import type { 
  Order, 
  OrderResponse, 
  PaystackInitResponse, 
  PaystackVerifyResponse,
  FlutterwaveInitResponse,
  FlutterwaveVerifyResponse,
  PublicStoreConfigResponse,
  PaymentGateway
} from "@shared/api";

declare global {
  interface Window {
    PaystackPop?: any;
    FlutterwaveCheckout?: any;
  }
}

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_live_59aa3a5df5556d85bf2d983a952d26b4b36f1678";
const FLUTTERWAVE_PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "FLWPUBK-d8262581bc1777745d463d8dbbbccc5d-X";

const GLOBAL_COUNTRIES = [
  { code: "US", name: "United States (US)" },
  { code: "GB", name: "United Kingdom (UK)" },
  { code: "CA", name: "Canada (CA)" },
  { code: "AU", name: "Australia (AU)" },
  { code: "BR", name: "Brazil (BR)" },
  { code: "NG", name: "Nigeria (NG)" },
  { code: "GH", name: "Ghana (GH)" },
  { code: "KE", name: "Kenya (KE)" },
  { code: "ZA", name: "South Africa (ZA)" },
  { code: "DE", name: "Germany (DE)" },
  { code: "FR", name: "France (FR)" },
  { code: "IT", name: "Italy (IT)" },
  { code: "ES", name: "Spain (ES)" },
  { code: "NL", name: "Netherlands (NL)" },
  { code: "CH", name: "Switzerland (CH)" },
  { code: "SE", name: "Sweden (SE)" },
  { code: "NO", name: "Norway (NO)" },
  { code: "DK", name: "Denmark (DK)" },
  { code: "IE", name: "Ireland (IE)" },
  { code: "NZ", name: "New Zealand (NZ)" },
  { code: "IN", name: "India (IN)" },
  { code: "JP", name: "Japan (JP)" },
  { code: "CN", name: "China (CN)" },
  { code: "SG", name: "Singapore (SG)" },
  { code: "MY", name: "Malaysia (MY)" },
  { code: "PH", name: "Philippines (PH)" },
  { code: "ID", name: "Indonesia (ID)" },
  { code: "MX", name: "Mexico (MX)" },
  { code: "AE", name: "United Arab Emirates (UAE)" },
  { code: "SA", name: "Saudi Arabia (SA)" },
  { code: "QA", name: "Qatar (QA)" },
  { code: "KW", name: "Kuwait (KW)" },
  { code: "EG", name: "Egypt (EG)" },
  { code: "RW", name: "Rwanda (RW)" },
  { code: "UG", name: "Uganda (UG)" },
  { code: "TZ", name: "Tanzania (TZ)" },
  { code: "ZM", name: "Zambia (ZM)" },
  { code: "ZW", name: "Zimbabwe (ZW)" },
  { code: "BW", name: "Botswana (BW)" },
  { code: "SL", name: "Sierra Leone (SL)" },
  { code: "LR", name: "Liberia (LR)" },
  { code: "GM", name: "Gambia (GM)" },
  { code: "CM", name: "Cameroon (CM)" },
  { code: "CI", name: "Ivory Coast (CI)" },
  { code: "SN", name: "Senegal (SN)" },
  { code: "OTHER", name: "Other / Worldwide" },
];

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const { cart, clearCart } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<{ productId: string; title: string; downloadUrl: string }[]>([]);
  const [error, setError] = useState("");
  const { currency, detectedCountry, setCurrency, options } = useCurrency();
  const { user } = useAuth();
  const subtotal = useMemo(() => cart.reduce((total, item) => total + (item.price || 0), 0), [cart]);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState(() => detectedCountry || "NG");
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("apexmind_payment_gateway");
      if (stored === "flutterwave" || stored === "paystack") return stored;
    }
    return "paystack";
  });
  const [flwPubKey, setFlwPubKey] = useState(FLUTTERWAVE_PUBLIC_KEY);

  // Match currency to country dynamically for ALL global countries (e.g. Brazil -> BRL, Australia -> AUD, etc.)
  const effectiveCurrency = useMemo(() => {
    const isManual = typeof window !== "undefined" && window.localStorage.getItem("apexmindreads-currency-manual") === "true";
    if (isManual && currency) {
      return currency;
    }
    if (country && countryToCurrencyMap[country.toUpperCase()]) {
      return countryToCurrencyMap[country.toUpperCase()];
    }
    return currency || "USD";
  }, [currency, country]);

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const matched = countryToCurrencyMap[newCountry.toUpperCase()];
    if (matched) {
      setCurrency(matched, true);
    }
  };

  useEffect(() => {
    fetch("/api/store/config")
      .then((res) => res.json())
      .then((data: PublicStoreConfigResponse) => {
        if (data.paymentGateway) {
          setPaymentGateway(data.paymentGateway);
          if (typeof window !== "undefined") {
            localStorage.setItem("apexmind_payment_gateway", data.paymentGateway);
          }
        }
        if (data.flutterwavePublicKey) {
          setFlwPubKey(data.flutterwavePublicKey);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (detectedCountry) {
      setCountry(detectedCountry);
      const isManual = typeof window !== "undefined" && window.localStorage.getItem("apexmindreads-currency-manual") === "true";
      if (!isManual) {
        const matched = countryToCurrencyMap[detectedCountry.toUpperCase()];
        if (matched) {
          setCurrency(matched, false);
        }
      }
    }
  }, [detectedCountry, setCurrency]);

  // Pre-fill from auth if available
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name);
    }
  }, [user]);

  // Check if returning from redirect (Paystack ?reference=... or Flutterwave ?gateway=flutterwave...)
  useEffect(() => {
    const gatewayParam = searchParams.get("gateway");
    const flwTxRef = searchParams.get("tx_ref");
    const flwTxId = searchParams.get("transaction_id");
    const flwStatus = searchParams.get("status");
    const orderIdParam = searchParams.get("orderId");

    if (gatewayParam === "flutterwave" || (flwTxRef && flwStatus)) {
      verifyFlutterwaveTransaction(flwTxId || undefined, flwTxRef || undefined, orderIdParam || undefined);
      return;
    }

    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (reference) {
      verifyPaystackTransaction(reference);
    }
  }, [searchParams]);

  const verifyPaystackTransaction = async (reference: string, orderId?: string) => {
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
      clearCart();
    } catch (err: any) {
      setError(err.message || "Failed to verify transaction. Please contact support.");
    } finally {
      setVerifying(false);
      setSubmitting(false);
    }
  };

  const verifyFlutterwaveTransaction = async (transaction_id?: string, tx_ref?: string, orderId?: string) => {
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/flutterwave/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id, tx_ref, orderId }),
      });

      const data: FlutterwaveVerifyResponse = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error((data as any).error || "Flutterwave payment verification failed");
      }

      setCompletedOrder(data.order);
      setDownloadLinks(data.downloadUrls || []);
      setSubmitted(true);
      clearCart();
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

      // ─── Step 2: Route to Active Payment Gateway ────────────
      if (paymentGateway === "flutterwave") {
        // Initialize Flutterwave
        const flwInitRes = await fetch("/api/flutterwave/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            email: customerEmail,
            customerName,
            amount: subtotal,
            currency: effectiveCurrency,
            callbackUrl: `${window.location.origin}/checkout?gateway=flutterwave&orderId=${orderId}`,
          }),
        });

        const initData: FlutterwaveInitResponse = await flwInitRes.json();

        if (!flwInitRes.ok) {
          throw new Error((initData as any).error || "Could not start Flutterwave transaction");
        }

        // Trigger Flutterwave Inline Modal
        if (typeof window !== "undefined" && typeof window.FlutterwaveCheckout === "function") {
          try {
            window.FlutterwaveCheckout({
              public_key: initData.publicKey || flwPubKey,
              tx_ref: initData.tx_ref,
              amount: initData.amount,
              currency: initData.currency,
              payment_options: initData.currency === "NGN" ? "card,mobilemoney,ussd,banktransfer" : "card",
              customer: {
                email: customerEmail,
                name: customerName,
              },
              customizations: {
                title: "ApexMindReads",
                description: `Order ${orderId}`,
                logo: `${window.location.origin}/logo.png`,
              },
              callback: function (data: any) {
                verifyFlutterwaveTransaction(
                  data.transaction_id ? String(data.transaction_id) : undefined, 
                  data.tx_ref || initData.tx_ref, 
                  orderId
                );
              },
              onclose: function () {
                setSubmitting(false);
              },
            });
            return;
          } catch (flwErr) {
            console.warn("Flutterwave inline error, falling back to redirect:", flwErr);
          }
        }

        if (initData.link) {
          window.location.href = initData.link;
        } else {
          throw new Error("Unable to open Flutterwave checkout. Please try again.");
        }
        return;
      }

      // Default: Paystack
      const paystackInitRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          email: customerEmail,
          amount: subtotal,
          currency: effectiveCurrency,
          callbackUrl: `${window.location.origin}/checkout`,
        }),
      });

      const initData: PaystackInitResponse = await paystackInitRes.json();

      if (!paystackInitRes.ok) {
        throw new Error((initData as any).error || "Could not start Paystack transaction");
      }

      // Trigger Paystack Popup or redirect
      if (typeof window !== "undefined" && window.PaystackPop) {
        try {
          if (typeof window.PaystackPop === "function") {
            const popup = new window.PaystackPop();
            if (initData.access_code && typeof popup.resumeTransaction === "function") {
              popup.resumeTransaction(initData.access_code, {
                onSuccess: (transaction: any) => {
                  verifyPaystackTransaction(transaction.reference || initData.reference, orderId);
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
      setError(err.message ?? "Something went wrong during checkout.");
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f4ec] px-5 text-center text-[#26332f]">
        <Loader2 size={36} className="animate-spin text-[#d86f45]" />
        <h2 className="mt-5 font-serif text-3xl">Verifying your payment...</h2>
        <p className="mt-2 text-sm text-[#736b61]">Unlocking your guide downloads. Please wait a second.</p>
      </div>
    );
  }

  if (submitted && completedOrder) {
    return (
      <div className="min-h-screen bg-[#f8f4ec] px-5 py-12 text-[#26332f] sm:py-20">
        <div className="mx-auto max-w-[640px] rounded-[1.8rem] border border-[#e5ddd2] bg-[#fffaf2] p-7 text-center shadow-[0_24px_60px_-36px_rgba(32,35,29,.6)] sm:p-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#b8c7b2] text-[#26332f]">
            <Check size={28} />
          </span>

          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#f0bc58]/20 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[#9b6e14]">
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
            {(completedOrder.items || []).map((item) => (
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
            <img src="/logo.png" alt="ApexMindReads logo" className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9" />
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
          <p className="mt-5 max-w-lg text-sm leading-6 text-[#736b61]">
            Complete your purchase securely from anywhere in the world. You'll receive instant download access to your PDF guides immediately after payment.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 max-w-[650px] rounded-[1.5rem] border border-[#e5ddd2] bg-[#fffaf2] p-6 sm:p-8">
            <div className="mb-7 flex items-center justify-between border-b border-[#e5ddd2] pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#26332f] text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <h2 className="font-serif text-2xl">Your details</h2>
                  <p className="text-xs text-[#8b8175]">Where should we send your download receipt?</p>
                </div>
              </div>

              {user && (
                <span className="hidden items-center gap-1.5 rounded-full bg-[#b8c7b2]/30 px-3 py-1 text-xs font-semibold text-[#26332f] sm:inline-flex">
                  <UserCheck size={14} className="text-[#557053]" /> Logged in
                </span>
              )}
            </div>

            {error && (
              <div className="mb-5 rounded-xl bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">
                {error}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">
                  Email address
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-[#f8f4ec] px-4 text-sm outline-none focus:border-[#d86f45]"
                />
              </label>
              <label className="sm:col-span-2">
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
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">
                  Country
                </span>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-[#f8f4ec] px-4 text-sm font-medium outline-none transition focus:border-[#d86f45]"
                >
                  {GLOBAL_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">
                  <span>Billing Currency</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#d86f45]">
                    <Globe size={10} /> Auto-synced
                  </span>
                </span>
                <select
                  value={effectiveCurrency}
                  onChange={(e) => setCurrency(e.target.value as any, true)}
                  className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-[#f8f4ec] px-4 text-sm font-semibold outline-none transition focus:border-[#d86f45]"
                >
                  {options.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.code} ({opt.symbol}) - {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Section 2: Payment method */}
            <div className="my-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-y border-[#e5ddd2] py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#26332f] text-xs font-bold text-white shadow-sm">
                  2
                </span>
                <div>
                  <h2 className="font-serif text-2xl font-medium text-[#26332f]">Payment method</h2>
                </div>
              </div>

              {/* Payment Logo - beautifully fitted for both Mobile and Desktop */}
              <div className="flex items-center justify-center sm:justify-end">
                <div className="flex items-center justify-center rounded-xl border border-[#ded5c7] bg-white px-5 py-2.5 shadow-sm sm:w-auto w-full min-h-[48px]">
                  <img 
                    src={paymentGateway === "flutterwave" ? "/flutterwave-logo.png" : "/paystack-logo.png"} 
                    alt={paymentGateway === "flutterwave" ? "Flutterwave" : "Paystack"} 
                    className="h-8 sm:h-9 w-auto max-w-[170px] sm:max-w-[190px] object-contain" 
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#d86f45] text-xs font-bold uppercase tracking-[0.14em] text-white shadow-sm transition hover:bg-[#bf5937] active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={17} className="animate-spin" /> Connecting to {paymentGateway === "flutterwave" ? "Flutterwave" : "Paystack"}...
                </span>
              ) : (
                <>
                  Pay {formatCurrency(subtotal, effectiveCurrency)} with {paymentGateway === "flutterwave" ? "Flutterwave" : "Paystack"} <ArrowRight size={17} />
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
            <ShoppingBag size={20} className="text-[#f0bc58]" />
          </div>

          <div className="my-7 space-y-5">
            {cart.map((product) => (
              <div key={product.id} className="flex gap-3">
                <CoverArt cover={product.cover} imageUrl={product.imageUrl} compact className="h-24 w-[72px] shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <p className="font-serif text-lg leading-none">{product.title}</p>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-xs text-[#aeb9b0]">PDF guide</span>
                    <span className="text-sm font-semibold">{formatCurrency(product.price, currency)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-[#53625b] pt-5 text-sm">
            <div className="flex justify-between text-[#bec5bb]">
              <span>Subtotal ({effectiveCurrency})</span>
              <span>{formatCurrency(subtotal, effectiveCurrency)}</span>
            </div>
            <div className="flex justify-between text-[#bec5bb]">
              <span>Delivery</span>
              <span className="text-[#b8c7b2]">Instant PDF Download</span>
            </div>
            <div className="flex justify-between border-t border-[#53625b] pt-4 text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(subtotal, effectiveCurrency)}</span>
            </div>
          </div>

          <div className="mt-7 flex gap-2 text-xs leading-5 text-[#bec5bb]">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#b8c7b2]" /> Worldwide secure payment & instant digital delivery.
          </div>
        </aside>
      </main>
    </div>
  );
}
