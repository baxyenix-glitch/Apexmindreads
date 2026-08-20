import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Loader2, ShoppingBag, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { authHeaders } from "@/lib/firebase";
import { formatCurrency, useCurrency } from "@/lib/currency";
import type { OrderListResponse } from "@shared/api";
import type { Order } from "@shared/schema";

export default function MyOrders() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate("/auth", { replace: true });
      return;
    }
    authHeaders().then((headers) => {
      fetch("/api/user/orders", { headers })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load orders"))))
        .then((data: OrderListResponse) => setOrders(data.orders))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    });
  }, [authLoading, isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-[#f8f4ec] text-[#26332f]">
      <header className="border-b border-[#e5ddd2]">
        <div className="mx-auto flex h-[74px] max-w-[1180px] items-center justify-between px-5 lg:px-10">
          <Link to="/" className="flex items-center gap-2 font-serif text-[1.35rem] font-semibold tracking-[-0.05em]">
            <img src="https://cdn.builder.io/api/v1/image/assets%2F65219c2b646c40599cdbfb399c78ee49%2F25bc89c4be474445946731673dbce175?format=webp&width=800&height=1200" alt="ApexMindReads logo" className="h-9 w-9 object-contain" />
            ApexMind<span className="text-[#d86f45]">Reads</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8b8175] transition hover:text-[#d86f45]">
            <ArrowLeft size={15} /> Back to shop
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[860px] px-5 py-10 lg:px-10 lg:py-16">
        <p className="section-kicker">Your Personal Collection</p>
        <h1 className="mt-3 font-serif text-5xl leading-[0.88] tracking-[-0.06em] sm:text-6xl">
          My <em className="text-[#d86f45]">orders</em>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-[#736b61]">
          Your collection of wisdom. Access your insights anytime.
        </p>

        {loading || authLoading ? (
          <div className="mt-16 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[#d86f45]" />
          </div>
        ) : !user?.emailVerified ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fde8e8] text-[#b91c1c]">
              <Mail size={25} />
            </div>
            <h2 className="mt-5 font-serif text-3xl">Verify your email</h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-[#736b61]">
              Please check your inbox for a verification link to access your orders.
            </p>
            <button
              onClick={async () => {
                const res = await useAuth().resendVerification();
                if (res.ok) alert("Verification email sent! Check your inbox.");
                else alert(res.error);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#d8d0c6] px-6 py-4 text-xs font-bold uppercase tracking-[0.13em] text-[#26332f] transition hover:bg-[#eee7dc]"
            >
              Resend verification email
            </button>
          </div>
        ) : error ? (
          <div className="mt-12 rounded-2xl border border-[#e2dfd8] bg-[#fffaf2] p-8 text-center">
            <p className="text-sm text-[#b91c1c]">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eee7dc]">
              <ShoppingBag size={25} />
            </div>
            <h2 className="mt-5 font-serif text-3xl">Your shelf is empty</h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-[#736b61]">
              Begin your journey by exploring our collection of guides.
            </p>
            <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#26332f] px-6 py-4 text-xs font-bold uppercase tracking-[0.13em] text-white transition hover:bg-[#d86f45]">
              Explore the Collection <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-5">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-[#e5ddd2] bg-[#fffaf2] p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{order.id}</p>
                    <p className="mt-1 text-xs text-[#8b8175]">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${order.status === "Paid" ? "bg-[#dcebdd] text-[#4c7b55]" : order.status === "Refunded" ? "bg-[#fde8e8] text-[#b91c1c]" : "bg-[#faedc9] text-[#9d7922]"}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-semibold">{formatCurrency(order.total, currency)}</span>
                  </div>
                </div>

                <div className="mt-5 space-y-3 border-t border-[#eae7e0] pt-5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eee7dc]">
                          <Check size={14} className="text-[#5e8c67]" />
                        </div>
                        <span className="text-sm">{item.title}</span>
                      </div>
                      {order.status === "Paid" && (
                        <a
                          href={`/api/orders/${order.id}/download/${item.productId}`}
                          download
                          className="flex items-center gap-1.5 text-xs font-bold text-[#d86f45] hover:underline"
                        >
                          <Download size={13} /> Download
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
