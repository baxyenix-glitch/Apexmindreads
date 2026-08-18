import { useCallback, useEffect, useState } from "react";
import { 
  AlertCircle, 
  BarChart3, 
  BookOpen, 
  Check, 
  ChevronDown, 
  Download, 
  Eye, 
  FileCheck, 
  FileText, 
  LayoutDashboard, 
  Loader2, 
  LogOut, 
  Menu, 
  MoreHorizontal, 
  Package, 
  Pencil, 
  Plus, 
  Search, 
  Settings, 
  ShoppingBag, 
  Star,
  Trash2, 
  UploadCloud, 
  Users, 
  Wallet, 
  X 
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { currencyOptions, formatCurrency, useCurrency, type Currency } from "@/lib/currency";
import { useAdminAuth, adminAuthHeaders } from "@/lib/admin-auth";
import type { AnalyticsResponse, OrderListResponse, CustomerListResponse, PromotionListResponse, ProductListResponse, SettingsResponse } from "@shared/api";
import type { Product, Order, CustomerView, Promotion, StoreSettings } from "@shared/schema";

const navItems = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Orders", path: "/admin/orders", icon: ShoppingBag },
  { label: "Products", path: "/admin/products", icon: BookOpen },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "Promotions", path: "/admin/promotions", icon: Package },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

type Section = "Overview" | "Orders" | "Products" | "Customers" | "Analytics" | "Promotions" | "Settings";

const sectionIntro: Record<Section, string> = {
  Overview: "",
  Orders: "Keep every sale in one place.",
  Products: "Manage the guides in your store and attach actual PDF ebooks.",
  Customers: "Know who is buying from you.",
  Analytics: "Understand what is working.",
  Promotions: "Keep offers clear and current.",
  Settings: "Set the details for your store.",
};

// ─── Helpers ─────────────────────────────────────────────
async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const headers = await adminAuthHeaders();
  const res = await fetch(url, { ...opts, headers: { ...headers, "Content-Type": "application/json", ...opts?.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// ─── Main ────────────────────────────────────────────────
export default function AdminDashboard() {
  const location = useLocation();
  const [currency] = useState<Currency>("NGN");
  const { admin, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const active = navItems.find((item) => item.path === location.pathname)?.label ?? "Overview";
  const closeNav = () => setMobileNavOpen(false);

  const handleLogout = async () => {
    await adminLogout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#26332f]">
      <DesktopSidebar active={active} onLogout={handleLogout} />
      <div className="lg:pl-[245px]">
        <header className="sticky top-0 z-20 border-b border-[#e2dfd8] bg-[#fbfaf7]/95 px-4 py-4 backdrop-blur sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMobileNavOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8d0c6] bg-white lg:hidden" aria-label="Open admin navigation">
                <Menu size={19} />
              </button>
              <div className="min-w-0">
                <p className="hidden text-xs text-[#8b8175] sm:block">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                <h1 className="truncate font-serif text-2xl tracking-[-0.05em] sm:mt-1 sm:text-4xl">
                  {active === "Overview" ? `Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${admin?.name?.split(" ")[0] ?? "Admin"}.` : active}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d86f45] text-xs font-bold text-white">
                {admin?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "AD"}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button onClick={closeNav} className="absolute inset-0 bg-[#26332f]/45" aria-label="Close admin navigation overlay" />
            <div className="absolute inset-y-0 left-0 w-[290px] overflow-y-auto bg-[#26332f] px-5 py-6 text-[#f8f4ec] shadow-2xl">
              <div className="flex items-center justify-between">
                <Link to="/" onClick={closeNav} className="flex items-center gap-2 font-serif text-xl tracking-[-0.05em]">
                  <img src="https://cdn.builder.io/api/v1/image/assets%2F65219c2b646c40599cdbfb399c78ee49%2F25bc89c4be474445946731673dbce175?format=webp&width=800&height=1200" alt="ApexMindReads logo" className="h-8 w-8 object-contain" />
                  ApexMind<span className="text-[#e58a61]">Reads</span>
                </Link>
                <button onClick={closeNav} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b4b45]" aria-label="Close admin navigation">
                  <X size={18} />
                </button>
              </div>
              <AdminNav active={active} onNavigate={closeNav} mobile />
            </div>
          </div>
        )}

        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 lg:px-10 lg:py-10">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#d86f45]">{active}</p>
              <h2 className="mt-2 max-w-xl font-serif text-3xl leading-none tracking-[-0.06em] sm:text-4xl">
                {sectionIntro[active as Section]}
              </h2>
            </div>
          </div>

          {active === "Overview" && <OverviewSection currency={currency} />}
          {active === "Orders" && <OrdersSection currency={currency} />}
          {active === "Products" && <ProductsSection currency={currency} />}
          {active === "Customers" && <CustomersSection currency={currency} />}
          {active === "Analytics" && <AnalyticsSection currency={currency} />}
          {active === "Promotions" && <PromotionsSection />}
          {active === "Settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}

// ─── Sidebar & Nav ───────────────────────────────────────
function DesktopSidebar({ active, onLogout }: { active: string; onLogout: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[245px] flex-col bg-[#26332f] px-5 py-6 text-[#f8f4ec] lg:flex">
      <Link to="/" className="flex items-center gap-2 font-serif text-[1.25rem] tracking-[-0.05em]">
        <img src="https://cdn.builder.io/api/v1/image/assets%2F65219c2b646c40599cdbfb399c78ee49%2F25bc89c4be474445946731673dbce175?format=webp&width=800&height=1200" alt="ApexMindReads logo" className="h-8 w-8 object-contain" />
        ApexMind<span className="text-[#e58a61]">Reads</span>
      </Link>
      <AdminNav active={active} />
      <div className="mt-auto">
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#bec5bb] hover:bg-[#3b4b45] hover:text-white">
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </aside>
  );
}

function AdminNav({ active, onNavigate, mobile = false }: { active: string; onNavigate?: () => void; mobile?: boolean }) {
  return (
    <>
      <p className={`${mobile ? "mt-10" : "mt-12"} px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-[#8da096]`}>Workspace</p>
      <nav className="mt-3 space-y-1">
        {navItems.map(({ label, path, icon: Icon }) => (
          <Link key={label} to={path} onClick={onNavigate} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active === label ? "bg-[#e58a61] text-white" : "text-[#bec5bb] hover:bg-[#3b4b45] hover:text-white"}`}>
            <Icon size={17} /> {label}
          </Link>
        ))}
      </nav>
    </>
  );
}

// ─── KPI Card ────────────────────────────────────────────
function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Wallet; tone: "orange" | "green" | "blue" | "gold" }) {
  const tones = { orange: "bg-[#f9e3d9] text-[#c76b4c]", green: "bg-[#dcebdd] text-[#5e8c67]", blue: "bg-[#dce8ed] text-[#5e8395]", gold: "bg-[#faedc9] text-[#ad842a]" };
  return (
    <div className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-4 sm:p-5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={17} /></span>
      <p className="mt-4 text-xs text-[#8b8175]">{label}</p>
      <p className="mt-1 truncate font-serif text-2xl tracking-[-0.04em] sm:text-3xl">{value}</p>
    </div>
  );
}

// ─── Loading / Error ─────────────────────────────────────
function LoadingBlock() {
  return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#d86f45]" /></div>;
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-8 text-center">
      <p className="text-sm text-[#b91c1c]">{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-4 rounded-full bg-[#26332f] px-4 py-2 text-xs font-bold text-white">Retry</button>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OVERVIEW SECTION
// ═══════════════════════════════════════════════════════════
function OverviewSection({ currency }: { currency: Currency }) {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, o, p] = await Promise.all([
        apiFetch<AnalyticsResponse>("/api/admin/analytics"),
        apiFetch<OrderListResponse>("/api/admin/orders"),
        apiFetch<ProductListResponse>("/api/products"),
      ]);
      setAnalytics(a);
      setOrders(o.orders.slice(0, 5));
      setProducts(p.products);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;
  if (error || !analytics) return <ErrorBlock message={error || "Failed to load"} onRetry={load} />;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Kpi label="Revenue" value={formatCurrency(analytics.totalRevenue, currency)} icon={Wallet} tone="orange" />
        <Kpi label="Paid orders" value={String(analytics.paidOrders)} icon={ShoppingBag} tone="green" />
        <Kpi label="Customers" value={String(analytics.totalCustomers)} icon={Users} tone="blue" />
        <Kpi label="Avg. order" value={formatCurrency(analytics.averageOrder, currency)} icon={BarChart3} tone="gold" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        {/* Revenue chart */}
        <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Revenue</p>
              <p className="mt-2 font-serif text-3xl">{formatCurrency(analytics.totalRevenue, currency)}</p>
            </div>
            <span className="rounded-lg border border-[#d8d0c6] bg-white px-2 py-2 text-xs text-[#736b61]">30 days</span>
          </div>
          <div className="mt-8 flex h-44 items-end gap-2 sm:gap-3">
            {analytics.revenueOverTime.slice(-15).map((d, i) => {
              const maxRev = Math.max(...analytics.revenueOverTime.map((x) => x.revenue), 1);
              const h = Math.max((d.revenue / maxRev) * 100, 4);
              return (
                <div key={i} className="group relative flex h-full flex-1 items-end">
                  <div className={`w-full rounded-t-md transition group-hover:bg-[#d86f45] ${i > 11 ? "bg-[#d86f45]" : "bg-[#d8e0d4]"}`} style={{ height: `${h}%` }} />
                  <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-[#26332f] px-1.5 py-1 text-[9px] text-white group-hover:block">
                    {formatCurrency(d.revenue, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Top guides */}
        <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Top guides</p>
          <div className="mt-6 space-y-5">
            {analytics.topProducts.slice(0, 4).map((tp, i) => {
              const prod = products.find((p) => p.id === tp.productId);
              return (
                <div key={tp.productId} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#a99d91]">0{i + 1}</span>
                  <div className="h-10 w-8 overflow-hidden rounded-md" style={{ background: prod?.cover.tone ?? "#ccc" }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{tp.title}</p>
                    <p className="text-[10px] text-[#8b8175]">{tp.sales} sales</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(tp.revenue, currency)}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Recent orders */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7]">
        <div className="flex items-center justify-between border-b border-[#e2dfd8] p-5 sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Latest activity</p>
            <h3 className="mt-1 font-serif text-2xl">Recent orders</h3>
          </div>
          <Link to="/admin/orders" className="text-xs font-bold uppercase tracking-[0.1em] text-[#d86f45]">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-[#f5f3ee] text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b8175]">
              <tr>
                <th className="px-5 py-3 sm:px-7">Order</th>
                <th className="px-5 py-3 sm:px-7">Customer</th>
                <th className="px-5 py-3 sm:px-7">Guide</th>
                <th className="px-5 py-3 sm:px-7">Amount</th>
                <th className="px-5 py-3 sm:px-7">Status</th>
                <th className="px-5 py-3 sm:px-7">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-[#eae7e0]">
                  <td className="px-5 py-4 font-semibold sm:px-7">{order.id}</td>
                  <td className="px-5 py-4 sm:px-7">{order.customerName}</td>
                  <td className="px-5 py-4 text-[#736b61] sm:px-7">{order.items.map((i) => i.title).join(", ")}</td>
                  <td className="px-5 py-4 font-semibold sm:px-7">{formatCurrency(order.total, currency)}</td>
                  <td className="px-5 py-4 sm:px-7">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${order.status === "Paid" ? "bg-[#dcebdd] text-[#4c7b55]" : order.status === "Refunded" ? "bg-[#fde8e8] text-[#b91c1c]" : "bg-[#faedc9] text-[#9d7922]"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#8b8175] sm:px-7">{relativeDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// ORDERS SECTION
// ═══════════════════════════════════════════════════════════
function OrdersSection({ currency }: { currency: Currency }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<OrderListResponse>("/api/admin/orders");
      setOrders(data.orders);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await apiFetch(`/api/admin/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: status as Order["status"] } : o));
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  const filtered = orders.filter((o) => {
    const matchesSearch = !search || `${o.id} ${o.customerName} ${o.customerEmail}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2 rounded-full border border-[#d8d0c6] bg-white px-4 py-2.5 text-sm focus-within:border-[#d86f45]">
          <Search size={15} className="text-[#8b8175]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…" className="w-full bg-transparent outline-none placeholder:text-[#9d9387]" />
        </label>
        <div className="flex gap-2">
          {["All", "Paid", "Pending", "Refunded"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-2 text-xs font-bold ${statusFilter === s ? "bg-[#26332f] text-white" : "text-[#8b8175] hover:bg-[#eae7e0]"}`}>{s}</button>
          ))}
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-[#f5f3ee] text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b8175]">
              <tr>
                <th className="px-5 py-3 sm:px-7">Order</th>
                <th className="px-5 py-3 sm:px-7">Customer</th>
                <th className="px-5 py-3 sm:px-7">Guides</th>
                <th className="px-5 py-3 sm:px-7">Amount</th>
                <th className="px-5 py-3 sm:px-7">Status</th>
                <th className="px-5 py-3 sm:px-7">Date</th>
                <th className="px-5 py-3 sm:px-7">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-t border-[#eae7e0]">
                  <td className="px-5 py-4 font-semibold sm:px-7">{order.id}</td>
                  <td className="px-5 py-4 sm:px-7">
                    <p>{order.customerName}</p>
                    <p className="text-[10px] text-[#8b8175]">{order.customerEmail}</p>
                  </td>
                  <td className="max-w-[180px] truncate px-5 py-4 text-[#736b61] sm:px-7">{order.items.map((i) => i.title).join(", ")}</td>
                  <td className="px-5 py-4 font-semibold sm:px-7">{formatCurrency(order.total, currency)}</td>
                  <td className="px-5 py-4 sm:px-7">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`rounded-full border-0 px-2.5 py-1 text-[10px] font-bold outline-none ${order.status === "Paid" ? "bg-[#dcebdd] text-[#4c7b55]" : order.status === "Refunded" ? "bg-[#fde8e8] text-[#b91c1c]" : "bg-[#faedc9] text-[#9d7922]"}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-[#8b8175] sm:px-7">{relativeDate(order.createdAt)}</td>
                  <td className="px-5 py-4 sm:px-7">
                    <button aria-label={`More options for ${order.id}`}><MoreHorizontal size={18} className="text-[#8b8175]" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-7 py-12 text-center text-sm text-[#8b8175]">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// PRODUCTS SECTION
// ═══════════════════════════════════════════════════════════
function ProductsSection({ currency }: { currency: Currency }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ProductListResponse>("/api/products");
      setProducts(data.products);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await apiFetch(`/api/admin/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  if (showForm || editProduct) {
    return (
      <ProductForm
        product={editProduct}
        onSaved={() => { setShowForm(false); setEditProduct(null); load(); }}
        onCancel={() => { setShowForm(false); setEditProduct(null); }}
      />
    );
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs text-[#8b8175]">Total: {products.length} product{products.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-full bg-[#26332f] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#3b4b45]">
          <Plus size={14} /> Add product
        </button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7]">
        <div className="divide-y divide-[#eae7e0]">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-3 p-5 sm:px-7">
              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-[#e2dfd8] shadow-sm">
                <img
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm sm:text-base">{product.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#8b8175]">
                  <span>{product.category} · {product.pages} pages</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf8ee] border border-[#faedd3] px-2 py-0.5 text-[10px] font-bold text-[#ad842a]">
                    <Star size={10} fill="currentColor" className="text-[#e4a83d]" /> {product.rating} ({product.reviews} reviews)
                  </span>
                  {product.pdfFileUrl ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef1eb] px-2 py-0.5 text-[10px] font-bold text-[#5e8c67]">
                      <FileCheck size={11} /> PDF Attached
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5f5] px-2 py-0.5 text-[10px] font-bold text-[#b91c1c]">
                      <AlertCircle size={11} /> No PDF Attached
                    </span>
                  )}
                </div>
              </div>

              <span className="hidden rounded-full bg-[#eef1eb] px-2.5 py-1 text-[10px] font-bold text-[#5e8c67] sm:inline-flex">
                {product.bestseller ? "Bestseller" : product.isNew ? "New" : "Published"}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(product.price, currency)}</span>
              <button onClick={() => setEditProduct(product)} className="p-1 text-[#8b8175] hover:text-[#d86f45]" aria-label={`Edit ${product.title}`}>
                <Pencil size={15} />
              </button>
              <button onClick={() => deleteProduct(product.id)} className="p-1 text-[#8b8175] hover:text-[#b91c1c]" aria-label={`Delete ${product.title}`}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {products.length === 0 && (
            <div className="px-7 py-14 text-center text-sm text-[#8b8175]">No products yet. Click "Add product" above to create your first ebook guide.</div>
          )}
        </div>
      </section>
    </>
  );
}

// ─── Product Form ────────────────────────────────────────
function ProductForm({ product, onSaved, onCancel }: { product: Product | null; onSaved: () => void; onCancel: () => void }) {
  const isEdit = !!product;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(product?.title ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [pdfFileUrl, setPdfFileUrl] = useState(product?.pdfFileUrl ?? "");
  const [pdfFileName, setPdfFileName] = useState(product?.pdfFileName ?? "");
  const [pdfFileSize, setPdfFileSize] = useState<number | undefined>(product?.pdfFileSize);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [slug, setSlug] = useState(product?.slug ?? "");
  const [eyebrow, setEyebrow] = useState(product?.eyebrow ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [longDescription, setLongDescription] = useState(product?.longDescription ?? "");
  const [category, setCategory] = useState(product?.category ?? "Financial Freedom");
  const [categorySlug, setCategorySlug] = useState(product?.categorySlug ?? "financial-freedom");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [oldPrice, setOldPrice] = useState(String(product?.oldPrice ?? ""));
  const [rating, setRating] = useState(String(product?.rating ?? "4.9"));
  const [reviews, setReviews] = useState(String(product?.reviews ?? "128"));
  const [pages, setPages] = useState(String(product?.pages ?? ""));
  const [format, setFormat] = useState(product?.format ?? "PDF guide");
  const [benefits, setBenefits] = useState(product?.benefits.join("\n") ?? "");
  const [coverTone, setCoverTone] = useState(product?.cover?.tone ?? "#d86f45");
  const [coverAccent, setCoverAccent] = useState(product?.cover?.accent ?? "#f4c16e");
  const [coverPattern, setCoverPattern] = useState(product?.cover?.pattern ?? "grid");
  const [coverAuthor, setCoverAuthor] = useState(product?.cover?.author ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [bestseller, setBestseller] = useState(product?.bestseller ?? false);
  const [isNew, setIsNew] = useState(product?.isNew ?? false);

  const categories = [
    { name: "Financial Freedom", slug: "financial-freedom" },
    { name: "Career & Productivity", slug: "career-productivity" },
    { name: "Health & Wellness", slug: "health-wellness" },
    { name: "Relationships", slug: "relationships" },
    { name: "Mindset & Growth", slug: "mindset-growth" },
    { name: "Business & Entrepreneurship", slug: "business-entrepreneurship" },
    { name: "Parenting", slug: "parenting" },
  ];

  const autoSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WebP)");
      return;
    }

    setUploadingImage(true);
    setError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedUrl = canvas.toDataURL("image/webp", 0.9);
          setImageUrl(optimizedUrl);
        } else {
          setImageUrl(rawDataUrl);
        }
        setUploadingImage(false);
      };
      img.onerror = () => {
        setImageUrl(rawDataUrl);
        setUploadingImage(false);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setError("Failed to read image file");
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid .pdf ebook file");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      setUploadingPdf(true);
      setError("");
      const headers = await adminAuthHeaders();
      const res = await fetch("/api/admin/upload-pdf", {
        method: "POST",
        headers,
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "PDF upload failed" }));
        throw new Error(err.error || "PDF upload failed");
      }
      const data = await res.json();
      setPdfFileUrl(data.url);
      setPdfFileName(data.fileName || file.name);
      setPdfFileSize(data.fileSize || file.size);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      slug: slug || autoSlug(title),
      title,
      imageUrl,
      pdfFileUrl: pdfFileUrl || undefined,
      pdfFileName: pdfFileName || undefined,
      pdfFileSize: pdfFileSize || undefined,
      eyebrow,
      description,
      longDescription,
      category,
      categorySlug,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      rating: Number(rating) > 0 ? Number(Number(rating).toFixed(1)) : 4.9,
      reviews: Number(reviews) >= 0 ? Math.floor(Number(reviews)) : 0,
      pages: Number(pages) || 45,
      format,
      featured,
      bestseller,
      isNew,
      benefits: benefits.split("\n").map((b) => b.trim()).filter(Boolean),
      cover: {
        kicker: `APEXMINDREADS / ${String(Date.now()).slice(-2)}`,
        title: title.replace(/ /g, "\n"),
        subtitle: eyebrow,
        author: coverAuthor || `BY ${title.split(" ")[0]?.toUpperCase() ?? "AUTHOR"}`,
        tone: coverTone,
        accent: coverAccent,
        pattern: coverPattern as "grid" | "sun" | "lines" | "circle",
      },
    };

    try {
      if (isEdit) {
        await apiFetch(`/api/admin/products/${product!.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/api/admin/products", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-2xl">{isEdit ? "Edit product" : "New product"}</h3>
          <p className="text-xs text-[#8b8175] mt-1">Fill in product details, customer ratings, and upload the PDF ebook for instant customer download.</p>
        </div>
        <button onClick={onCancel} className="text-xs font-bold text-[#8b8175] hover:text-[#d86f45]">Cancel</button>
      </div>

      {error && <div className="mb-5 rounded-xl bg-[#fef2f2] p-3.5 text-sm font-medium text-[#b91c1c]">{error}</div>}

      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
        <Input label="Title" value={title} onChange={(v) => { setTitle(v); if (!isEdit) setSlug(autoSlug(v)); }} required placeholder="e.g. The Focus Architecture" />
        <Input label="Slug" value={slug} onChange={setSlug} required placeholder="the-focus-architecture" />
        <Input label="Eyebrow" value={eyebrow} onChange={setEyebrow} placeholder="A complete operating system for deep work" />
        
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">Category</label>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setCategorySlug(categories.find((c) => c.name === e.target.value)?.slug ?? ""); }} className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-white px-4 text-sm outline-none focus:border-[#d86f45]">
            {categories.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="lg:col-span-2">
          <Input label="Short description" value={description} onChange={setDescription} required placeholder="Concise summary for catalog cards" />
        </div>

        <div className="lg:col-span-2">
          <TextArea label="Long description" value={longDescription} onChange={setLongDescription} />
        </div>

        {/* ─── PDF EBOOK ATTACHMENT SECTION ─── */}
        <div className="lg:col-span-2 rounded-2xl border-2 border-[#e2dfd8] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="text-[#d86f45]" size={18} />
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#26332f]">
                  PDF Ebook File Attachment
                </label>
              </div>
              <p className="text-xs text-[#8b8175] mt-1">
                Upload the actual PDF from your computer. Customers will automatically download this file after completing checkout.
              </p>
            </div>
            {pdfFileUrl && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#eef1eb] px-3 py-1 text-[11px] font-bold text-[#5e8c67]">
                <FileCheck size={13} /> Attached
              </span>
            )}
          </div>

          {pdfFileUrl ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#b8c7b2] bg-[#f8f6f0] p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d86f45] text-white shadow-sm">
                  <FileText size={22} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate text-[#26332f]">
                    {pdfFileName || "Attached Ebook.pdf"}
                  </p>
                  <p className="text-xs text-[#8b8175] mt-0.5">
                    {pdfFileSize ? `${(pdfFileSize / (1024 * 1024)).toFixed(2)} MB · ` : ""}Ready for instant customer download
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={pdfFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d8d0c6] bg-white px-3.5 py-1.5 text-xs font-bold text-[#26332f] transition hover:bg-[#eee7dc]"
                >
                  <Eye size={13} /> View PDF
                </a>
                <button
                  type="button"
                  onClick={() => { setPdfFileUrl(""); setPdfFileName(""); setPdfFileSize(undefined); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#fca5a5] bg-[#fff5f5] px-3.5 py-1.5 text-xs font-bold text-[#b91c1c] transition hover:bg-[#fee2e2]"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d8d0c6] bg-[#fcfbf9] p-7 text-center cursor-pointer transition hover:border-[#d86f45] hover:bg-[#fffaf2]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eee7dc] text-[#d86f45] mb-3">
                  {uploadingPdf ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
                </div>
                <span className="text-sm font-semibold text-[#26332f]">
                  {uploadingPdf ? "Uploading PDF ebook to server..." : "Click or drag to attach PDF ebook from your computer"}
                </span>
                <span className="text-xs text-[#8b8175] mt-1">
                  Supports .pdf files up to 100MB
                </span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={uploadingPdf}
                  onChange={handlePdfUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>

        {/* ─── CUSTOMER RATINGS & REVIEWS SECTION ─── */}
        <div className="lg:col-span-2 rounded-2xl border-2 border-[#e2dfd8] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Star className="text-[#e4a83d] fill-[#e4a83d]" size={18} />
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#26332f]">
                  Customer Rating & Reviews Display
                </label>
              </div>
              <p className="text-xs text-[#8b8175] mt-1">
                Set the star rating and reader review count that will be showcased to customers on storefront catalog cards and the product page.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbfaf7] border border-[#e2dfd8] px-3 py-1 text-xs font-bold text-[#26332f]">
              <Star size={13} fill="currentColor" className="text-[#e4a83d]" /> {rating || "4.9"} ({reviews || "0"} reviews)
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">
                Star Rating (1.0 - 5.0)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="h-12 w-28 rounded-xl border border-[#d8d0c6] bg-white px-4 text-sm font-semibold text-[#26332f] outline-none focus:border-[#d86f45]"
                  placeholder="4.9"
                />
                <div className="flex items-center gap-1 text-[#e4a83d]">
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const r = Number(rating) || 0;
                    return (
                      <button
                        type="button"
                        key={starIndex}
                        onClick={() => setRating(starIndex.toFixed(1))}
                        className="p-1 transition hover:scale-110"
                        title={`Set to ${starIndex}.0 stars`}
                      >
                        <Star
                          size={18}
                          className={r >= starIndex ? "fill-[#e4a83d] text-[#e4a83d]" : "text-[#d8d0c6]"}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <Input
                label="Number of Reviews"
                value={reviews}
                onChange={setReviews}
                placeholder="e.g. 128"
              />
            </div>
          </div>
        </div>

        <Input label="Price (NGN)" type="number" value={price} onChange={setPrice} required placeholder="5000" />
        <Input label="Old Price (NGN, optional)" type="number" value={oldPrice} onChange={setOldPrice} placeholder="7500" />
        <Input label="Page count" type="number" value={pages} onChange={setPages} placeholder="45" />
        <Input label="Format" value={format} onChange={setFormat} placeholder="PDF guide" />

        <div className="lg:col-span-2">
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">
            Key Benefits (one per line)
          </label>
          <textarea
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-[#d8d0c6] bg-white px-4 py-3 text-sm outline-none focus:border-[#d86f45]"
            placeholder="Step-by-step frameworks&#10;Actionable templates&#10;Lifetime access"
          />
        </div>

        <div className="lg:col-span-2 rounded-2xl border-2 border-[#e2dfd8] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <UploadCloud className="text-[#d86f45]" size={18} />
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#26332f]">
                  Product Cover Image
                </label>
              </div>
              <p className="text-xs text-[#8b8175] mt-1">
                Upload your product cover photo from your computer (JPG, PNG, WebP) or paste an image link.
              </p>
            </div>
            {imageUrl && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eef1eb] px-3 py-1 text-[11px] font-bold text-[#5e8c67]">
                <FileCheck size={13} /> Cover Selected
              </span>
            )}
          </div>

          {imageUrl ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-[#b8c7b2] bg-[#f8f6f0] p-4">
              <img
                src={imageUrl}
                alt="Cover Preview"
                className="h-28 w-20 object-cover rounded-lg shadow-sm border border-[#d8d0c6]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#26332f]">Product Cover Photo</p>
                <p className="text-xs text-[#8b8175] mt-0.5 truncate max-w-md">
                  {imageUrl.startsWith("data:") ? "Image loaded from computer (ready to publish)" : imageUrl}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#fca5a5] bg-[#fff5f5] px-3.5 py-1.5 text-xs font-bold text-[#b91c1c] transition hover:bg-[#fee2e2]"
              >
                <Trash2 size={13} /> Change / Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d8d0c6] bg-[#fcfbf9] p-6 text-center cursor-pointer transition hover:border-[#d86f45] hover:bg-[#fffaf2]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eee7dc] text-[#d86f45] mb-2">
                  {uploadingImage ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                </div>
                <span className="text-sm font-semibold text-[#26332f]">
                  {uploadingImage ? "Processing image..." : "Click or drag to select cover image from your computer"}
                </span>
                <span className="text-xs text-[#8b8175] mt-0.5">
                  Supports JPG, PNG, or WebP
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImage}
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8b8175]">Or image URL:</span>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-10 flex-1 rounded-xl border border-[#d8d0c6] bg-white px-3 text-xs outline-none focus:border-[#d86f45]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-wrap items-center gap-6 py-2">
          <Checkbox label="Featured on Home" checked={featured} onChange={setFeatured} />
          <Checkbox label="Bestseller Badge" checked={bestseller} onChange={setBestseller} />
          <Checkbox label="New Release Badge" checked={isNew} onChange={setIsNew} />
        </div>

        <div className="lg:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-[#e2dfd8]">
          <button type="button" onClick={onCancel} className="rounded-xl border border-[#d8d0c6] px-5 py-2.5 text-xs font-bold text-[#736b61] hover:bg-[#eee7dc]">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-xl bg-[#d86f45] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#bf5937] disabled:opacity-50">
            {saving ? "Saving..." : isEdit ? "Update product" : "Create product"}
          </button>
        </div>
      </form>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// CUSTOMERS SECTION
// ═══════════════════════════════════════════════════════════
function CustomersSection({ currency }: { currency: Currency }) {
  const [customers, setCustomers] = useState<CustomerView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<CustomerListResponse>("/api/admin/customers");
      setCustomers(data.customers);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.country || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b8175]" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#d8d0c6] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#d86f45]"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7]">
        <div className="divide-y divide-[#e2dfd8]">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-5 sm:px-7">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eee7dc] text-xs font-bold">
                {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="mt-1 truncate text-xs text-[#8b8175]">{c.email} · {c.country} · {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}</p>
              </div>
              <span className={`hidden rounded-full px-2.5 py-1 text-[10px] font-bold sm:inline-flex ${c.status === "Active" ? "bg-[#eef1eb] text-[#5e8c67]" : "bg-[#faedc9] text-[#9d7922]"}`}>
                {c.status}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(c.totalSpent, currency)}</span>
            </div>
          ))}
          {filtered.length === 0 && <div className="px-7 py-12 text-center text-sm text-[#8b8175]">No customers found</div>}
        </div>
      </section>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS SECTION
// ═══════════════════════════════════════════════════════════
function AnalyticsSection({ currency }: { currency: Currency }) {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AnalyticsResponse>("/api/admin/analytics");
      setAnalytics(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;
  if (error || !analytics) return <ErrorBlock message={error || "Failed"} onRetry={load} />;

  const countryEntries = Object.entries(analytics.revenueByCountry).sort((a, b) => b[1] - a[1]);
  const totalCountryRev = countryEntries.reduce((s, [, v]) => s + v, 0) || 1;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Revenue by country</p>
        <div className="mt-6 space-y-4">
          {countryEntries.map(([country, rev]) => (
            <div key={country}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{country}</span>
                <span className="text-[#8b8175]">{Math.round((rev / totalCountryRev) * 100)}% · {formatCurrency(rev, currency)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#eae7e0]">
                <div className="h-full rounded-full bg-[#d86f45]" style={{ width: `${(rev / totalCountryRev) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-5">
        <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Repeat customers</p>
          <p className="mt-3 font-serif text-4xl">{analytics.repeatCustomerRate}%</p>
          <p className="mt-2 text-xs text-[#8b8175]">Customers who purchased twice or more</p>
        </section>
        <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Top category</p>
          <p className="mt-3 font-serif text-4xl">{analytics.topCategory}</p>
          <p className="mt-2 text-xs text-[#8b8175]">Best performing category by revenue</p>
        </section>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROMOTIONS SECTION
// ═══════════════════════════════════════════════════════════
function PromotionsSection() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PromotionListResponse>("/api/admin/promotions");
      setPromotions(data.promotions);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deletePromo = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    try {
      await apiFetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  if (showForm || editPromo) {
    return <PromoForm promo={editPromo} onSaved={() => { setShowForm(false); setEditPromo(null); load(); }} onCancel={() => { setShowForm(false); setEditPromo(null); }} />;
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-full bg-[#26332f] px-4 py-2.5 text-xs font-semibold text-white">
          <Plus size={14} /> New promotion
        </button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7]">
        <div className="divide-y divide-[#eae7e0]">
          {promotions.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-5 sm:px-7">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.title}</p>
                <p className="mt-1 truncate text-xs text-[#8b8175]">{p.description} · {p.discountPercent}% off</p>
              </div>
              <span className={`hidden rounded-full px-2.5 py-1 text-[10px] font-bold sm:inline-flex ${p.status === "Active" ? "bg-[#eef1eb] text-[#5e8c67]" : p.status === "Draft" ? "bg-[#faedc9] text-[#9d7922]" : "bg-[#eae7e0] text-[#8b8175]"}`}>
                {p.status}
              </span>
              <button onClick={() => setEditPromo(p)} className="p-1 text-[#8b8175] hover:text-[#d86f45]"><Pencil size={15} /></button>
              <button onClick={() => deletePromo(p.id)} className="p-1 text-[#8b8175] hover:text-[#b91c1c]"><Trash2 size={15} /></button>
            </div>
          ))}
          {promotions.length === 0 && <div className="px-7 py-12 text-center text-sm text-[#8b8175]">No promotions yet</div>}
        </div>
      </section>
    </>
  );
}

function PromoForm({ promo, onSaved, onCancel }: { promo: Promotion | null; onSaved: () => void; onCancel: () => void }) {
  const isEdit = !!promo;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(promo?.title ?? "");
  const [description, setDescription] = useState(promo?.description ?? "");
  const [discountPercent, setDiscountPercent] = useState(String(promo?.discountPercent ?? ""));
  const [startDate, setStartDate] = useState(promo?.startDate ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(promo?.endDate ?? "");
  const [status, setStatus] = useState(promo?.status ?? "Draft");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = { title, description, discountPercent: Number(discountPercent), startDate, endDate, status };
    try {
      if (isEdit) {
        await apiFetch(`/api/admin/promotions/${promo!.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/api/admin/promotions", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-serif text-2xl">{isEdit ? "Edit promotion" : "New promotion"}</h3>
        <button onClick={onCancel} className="text-xs font-bold text-[#8b8175] hover:text-[#d86f45]">Cancel</button>
      </div>
      {error && <div className="mb-5 rounded-xl bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">{error}</div>}
      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
        <Input label="Title" value={title} onChange={setTitle} required />
        <Input label="Discount %" value={discountPercent} onChange={setDiscountPercent} type="number" required />
        <div className="lg:col-span-2"><Input label="Description" value={description} onChange={setDescription} /></div>
        <Input label="Start date" value={startDate} onChange={setStartDate} type="date" required />
        <Input label="End date" value={endDate} onChange={setEndDate} type="date" required />
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Promotion["status"])} className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-white px-4 text-sm outline-none focus:border-[#d86f45]">
            <option value="Active">Active</option><option value="Draft">Draft</option><option value="Expired">Expired</option>
          </select>
        </div>
        <div className="lg:col-span-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-full bg-[#d86f45] px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isEdit ? "Save changes" : "Create promotion"}
          </button>
        </div>
      </form>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// SETTINGS SECTION
// ═══════════════════════════════════════════════════════════
function SettingsSection() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [downloadMode, setDownloadMode] = useState<"instant" | "email">("instant");
  const [storeCurrency, setStoreCurrency] = useState<Currency>("NGN");
  
  // Credentials update state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [credSaving, setCredSaving] = useState(false);
  const [credSuccess, setCredSuccess] = useState("");
  const [credError, setCredError] = useState("");

  useEffect(() => {
    apiFetch<SettingsResponse>("/api/admin/settings")
      .then((data) => {
        setSettings(data.settings);
        setStoreName(data.settings.storeName);
        setSupportEmail(data.settings.supportEmail);
        setDownloadMode(data.settings.downloadMode);
        setStoreCurrency((data.settings.currency as Currency) || "NGN");
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const data = await apiFetch<SettingsResponse>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ storeName, supportEmail, downloadMode, currency: storeCurrency }),
      });
      setSettings(data.settings);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingBlock />;

  const updateCredentials = async () => {
    if (!adminEmail && !adminPassword) return;
    setCredSaving(true);
    setCredSuccess("");
    setCredError("");
    try {
      await apiFetch("/api/admin/credentials", {
        method: "PUT",
        body: JSON.stringify({ email: adminEmail || undefined, password: adminPassword || undefined }),
      });
      setCredSuccess("Credentials updated successfully. You will use these next time you log in.");
      setAdminPassword("");
    } catch (e: any) {
      setCredError(e.message);
    } finally {
      setCredSaving(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d86f45]">Store defaults</p>
        <h3 className="mt-2 font-serif text-3xl tracking-[-0.05em]">What customers see at checkout</h3>
        <div className="mt-8 max-w-md space-y-5">
          <Input label="Store name" value={storeName} onChange={setStoreName} />
          <Input label="Support email" value={supportEmail} onChange={setSupportEmail} type="email" />
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">Store currency</label>
            <select value={storeCurrency} onChange={(e) => setStoreCurrency(e.target.value as Currency)} className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-white px-4 text-sm outline-none focus:border-[#d86f45]">
              {currencyOptions.map((option) => <option key={option.code} value={option.code}>{option.symbol} {option.label} ({option.code})</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">Download access</label>
            <select value={downloadMode} onChange={(e) => setDownloadMode(e.target.value as "instant" | "email")} className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-white px-4 text-sm outline-none focus:border-[#d86f45]">
              <option value="instant">Instant after payment</option>
              <option value="email">Email delivery</option>
            </select>
          </div>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-full bg-[#d86f45] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save settings
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Current settings</p>
        <div className="mt-6 space-y-5">
          <div><p className="text-xs text-[#8b8175]">Store name</p><p className="mt-1 font-semibold">{settings?.storeName ?? "—"}</p></div>
          <div><p className="text-xs text-[#8b8175]">Support email</p><p className="mt-1 font-semibold">{settings?.supportEmail ?? "—"}</p></div>
          <div><p className="text-xs text-[#8b8175]">Download access</p><p className="mt-1 font-semibold capitalize">{settings?.downloadMode ?? "—"}</p></div>
          <div><p className="text-xs text-[#8b8175]">Currency</p><p className="mt-1 font-semibold">{settings?.currency ?? "—"}</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7 lg:col-span-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d86f45]">Security</p>
        <h3 className="mt-2 font-serif text-3xl tracking-[-0.05em]">Admin Login Credentials</h3>
        <p className="mt-2 max-w-xl text-sm text-[#8b8175]">Update your admin email or password. Leave password blank if you only want to change your email.</p>
        
        {credSuccess && <div className="mt-5 max-w-md rounded-xl bg-[#ecfdf5] p-3 text-sm text-[#059669]">{credSuccess}</div>}
        {credError && <div className="mt-5 max-w-md rounded-xl bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">{credError}</div>}

        <div className="mt-8 max-w-md space-y-5">
          <Input label="Admin Email" value={adminEmail} onChange={setAdminEmail} type="email" placeholder="Leave blank to keep current" />
          <Input label="New Password" value={adminPassword} onChange={setAdminPassword} type="password" placeholder="Leave blank to keep current" />
          
          <button onClick={updateCredentials} disabled={credSaving} className="flex items-center gap-2 rounded-full bg-[#26332f] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60">
            {credSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Update credentials
          </button>
        </div>
      </section>
    </div>
  );
}

// ─── Shared form controls ────────────────────────────────
function Input({ label, value, onChange, type = "text", required = false, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-white px-4 text-sm outline-none focus:border-[#d86f45]" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full rounded-xl border border-[#d8d0c6] bg-white px-4 py-3 text-sm outline-none focus:border-[#d86f45]" />
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded accent-[#d86f45]" />
      <span className="text-sm text-[#26332f]">{label}</span>
    </label>
  );
}
