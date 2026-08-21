import { useCallback, useEffect, useState } from "react";
import { 
  AlertCircle, 
  ArrowUpRight,
  BarChart3, 
  BookOpen, 
  Check, 
  ChevronRight, 
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
  ShieldCheck,
  ShoppingBag, 
  Sparkles,
  Star,
  Trash2, 
  TrendingUp,
  UploadCloud, 
  Users, 
  Wallet, 
  X 
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatCurrency, type Currency, currencyOptions } from "@/lib/currency";
import { useAdminAuth, adminAuthHeaders } from "@/lib/admin-auth";
import type { 
  AnalyticsResponse, 
  OrderListResponse, 
  CustomerListResponse, 
  PromotionListResponse, 
  ProductListResponse, 
  SettingsResponse 
} from "@shared/api";
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
  Overview: "Store performance and real-time activity.",
  Orders: "Track payments, customer orders, and downloads.",
  Products: "Manage your digital ebook catalog and file attachments.",
  Customers: "View buyer profiles, purchase history, and spend.",
  Analytics: "Review revenue growth and customer retention.",
  Promotions: "Create and manage promotional discount campaigns.",
  Settings: "Store configuration, currency defaults, and security.",
};

// ─── Helpers ─────────────────────────────────────────────
async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const headers = await adminAuthHeaders();
  const res = await fetch(url, { 
    ...opts, 
    headers: { ...headers, "Content-Type": "application/json", ...opts?.headers } 
  });
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

// ─── Main Admin Dashboard Component ──────────────────────
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
    <div className="min-h-screen bg-[#f5f3ee] text-[#26332f] pb-20 lg:pb-10">
      {/* Desktop Sidebar */}
      <DesktopSidebar active={active} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="lg:pl-[245px]">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 border-b border-[#e2dfd8] bg-[#fbfaf7]/95 px-4 py-3.5 backdrop-blur sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button 
                onClick={() => setMobileNavOpen(true)} 
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8d0c6] bg-white text-[#26332f] transition hover:bg-[#eee7dc] lg:hidden shadow-sm" 
                aria-label="Open admin navigation menu"
              >
                <Menu size={20} />
              </button>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block h-2 w-2 rounded-full bg-[#5e8c67] animate-pulse" />
                  <p className="text-[11px] font-semibold text-[#8b8175] hidden sm:block">
                    {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <h1 className="truncate font-serif text-xl sm:text-2xl lg:text-3xl tracking-tight text-[#26332f]">
                  {active === "Overview" ? `Welcome back, ${admin?.name?.split(" ")[0] ?? "Admin"}` : active}
                </h1>
              </div>
            </div>

            {/* Quick Actions / Avatar */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#d8d0c6] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#26332f] transition hover:bg-[#eee7dc]"
              >
                <Eye size={13} /> View Storefront
              </Link>
              
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#d86f45] text-xs font-bold text-white shadow-sm ring-2 ring-[#f5f3ee]">
                  {admin?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "AD"}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <p className="font-bold leading-none text-[#26332f]">{admin?.name ?? "Store Admin"}</p>
                  <p className="text-[10px] text-[#8b8175] mt-0.5">{admin?.email ?? "admin@apexmindreads.com"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button 
              onClick={closeNav} 
              className="absolute inset-0 bg-[#26332f]/60 backdrop-blur-sm transition-opacity" 
              aria-label="Close admin navigation overlay" 
            />
            <div className="absolute inset-y-0 left-0 w-[285px] max-w-[85vw] overflow-y-auto bg-[#26332f] px-5 py-6 text-[#f8f4ec] shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-[#3b4b45]">
                  <Link to="/" onClick={closeNav} className="flex items-center gap-2.5 font-serif text-lg tracking-tight">
                    <img 
                      src="https://cdn.builder.io/api/v1/image/assets%2F65219c2b646c40599cdbfb399c78ee49%2F25bc89c4be474445946731673dbce175?format=webp&width=800&height=1200" 
                      alt="ApexMindReads logo" 
                      className="h-7 w-7 object-contain" 
                    />
                    <span>ApexMind<span className="text-[#e58a61]">Reads</span></span>
                  </Link>
                  <button 
                    onClick={closeNav} 
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b4b45] text-[#bec5bb] hover:text-white" 
                    aria-label="Close navigation"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-6">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8da096]">Management</p>
                  <nav className="mt-2.5 space-y-1">
                    {navItems.map(({ label, path, icon: Icon }) => (
                      <Link 
                        key={label} 
                        to={path} 
                        onClick={closeNav} 
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                          active === label 
                            ? "bg-[#e58a61] text-white shadow-sm font-semibold" 
                            : "text-[#bec5bb] hover:bg-[#3b4b45] hover:text-white"
                        }`}
                      >
                        <Icon size={18} />
                        <span>{label}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>

              <div className="pt-6 border-t border-[#3b4b45] space-y-2">
                <Link
                  to="/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={closeNav}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs text-[#bec5bb] hover:bg-[#3b4b45] hover:text-white"
                >
                  <Eye size={15} /> Open Storefront
                </Link>
                <button 
                  onClick={() => { closeNav(); handleLogout(); }} 
                  className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#f87171] hover:bg-[#3b4b45]"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Section Content */}
        <main className="mx-auto max-w-[1280px] px-3.5 py-5 sm:px-8 lg:px-10 lg:py-8">
          {/* Section Description Header */}
          <div className="mb-5 sm:mb-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d86f45]">{active}</p>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl tracking-tight text-[#26332f]">
              {sectionIntro[active as Section]}
            </h2>
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#fbfaf7]/95 border-t border-[#e2dfd8] px-2 py-2 backdrop-blur lg:hidden flex items-center justify-around shadow-lg">
        {[
          { label: "Overview", path: "/admin", icon: LayoutDashboard },
          { label: "Orders", path: "/admin/orders", icon: ShoppingBag },
          { label: "Products", path: "/admin/products", icon: BookOpen },
          { label: "Customers", path: "/admin/customers", icon: Users },
          { label: "More", path: "/admin/settings", icon: Settings },
        ].map(({ label, path, icon: Icon }) => {
          const isItemActive = label === "More" 
            ? ["Analytics", "Promotions", "Settings"].includes(active)
            : active === label;
          return (
            <Link
              key={label}
              to={path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isItemActive 
                  ? "text-[#d86f45] font-bold" 
                  : "text-[#8b8175] hover:text-[#26332f]"
              }`}
            >
              <Icon size={18} />
              <span className="text-[10px] mt-0.5">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Desktop Sidebar ─────────────────────────────────────
function DesktopSidebar({ active, onLogout }: { active: string; onLogout: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[245px] flex-col bg-[#26332f] px-5 py-6 text-[#f8f4ec] lg:flex justify-between">
      <div>
        <Link to="/" className="flex items-center gap-2.5 font-serif text-[1.25rem] tracking-tight">
          <img 
            src="https://cdn.builder.io/api/v1/image/assets%2F65219c2b646c40599cdbfb399c78ee49%2F25bc89c4be474445946731673dbce175?format=webp&width=800&height=1200" 
            alt="ApexMindReads logo" 
            className="h-8 w-8 object-contain" 
          />
          <span>ApexMind<span className="text-[#e58a61]">Reads</span></span>
        </Link>
        <AdminNav active={active} />
      </div>

      <div className="pt-4 border-t border-[#3b4b45] space-y-1">
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-[#bec5bb] hover:bg-[#3b4b45] hover:text-white transition"
        >
          <Eye size={16} /> Open Storefront
        </Link>
        <button 
          onClick={onLogout} 
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-[#bec5bb] hover:bg-[#3b4b45] hover:text-[#f87171] transition"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}

function AdminNav({ active, onNavigate, mobile = false }: { active: string; onNavigate?: () => void; mobile?: boolean }) {
  return (
    <>
      <p className={`${mobile ? "mt-8" : "mt-10"} px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8da096]`}>
        Store Menu
      </p>
      <nav className="mt-2.5 space-y-1">
        {navItems.map(({ label, path, icon: Icon }) => (
          <Link 
            key={label} 
            to={path} 
            onClick={onNavigate} 
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              active === label 
                ? "bg-[#e58a61] text-white shadow-sm font-semibold" 
                : "text-[#bec5bb] hover:bg-[#3b4b45] hover:text-white"
            }`}
          >
            <Icon size={17} /> 
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

// ─── KPI Card ────────────────────────────────────────────
function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Wallet; tone: "orange" | "green" | "blue" | "gold" }) {
  const tones = { 
    orange: "bg-[#f9e3d9] text-[#c76b4c]", 
    green: "bg-[#dcebdd] text-[#5e8c67]", 
    blue: "bg-[#dce8ed] text-[#5e8395]", 
    gold: "bg-[#faedc9] text-[#ad842a]" 
  };
  return (
    <div className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-4 sm:p-5 shadow-sm transition hover:shadow">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b8175]">{label}</p>
        <span className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 truncate font-serif text-2xl sm:text-3xl tracking-tight text-[#26332f] font-bold">
        {value}
      </p>
    </div>
  );
}

// ─── Loading / Error Blocks ──────────────────────────────
function LoadingBlock() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={28} className="animate-spin text-[#d86f45]" />
      <p className="text-xs font-semibold text-[#8b8175]">Loading data...</p>
    </div>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-8 text-center max-w-md mx-auto my-10 shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#fef2f2] text-[#b91c1c] mb-3">
        <AlertCircle size={22} />
      </div>
      <p className="text-sm font-semibold text-[#b91c1c]">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="mt-4 rounded-full bg-[#26332f] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#3b4b45]"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OVERVIEW SECTION (REDESIGNED FOR MOBILE & DESKTOP)
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
      setOrders(o.orders.slice(0, 6));
      setProducts(p.products);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;
  if (error || !analytics) return <ErrorBlock message={error || "Failed to load dashboard"} onRetry={load} />;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Kpi label="Total Revenue" value={formatCurrency(analytics.totalRevenue, currency)} icon={Wallet} tone="orange" />
        <Kpi label="Paid Orders" value={String(analytics.paidOrders)} icon={ShoppingBag} tone="green" />
        <Kpi label="Customers" value={String(analytics.totalCustomers)} icon={Users} tone="blue" />
        <Kpi label="Avg. Order" value={formatCurrency(analytics.averageOrder, currency)} icon={BarChart3} tone="gold" />
      </div>

      {/* Quick Actions Banner on Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Link
          to="/admin/products"
          className="flex items-center gap-2.5 rounded-xl border border-[#e2dfd8] bg-white p-3 text-xs font-bold text-[#26332f] transition hover:border-[#d86f45] shadow-sm"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eee7dc] text-[#d86f45]">
            <Plus size={16} />
          </div>
          <span>Add Product</span>
        </Link>
        <Link
          to="/admin/orders"
          className="flex items-center gap-2.5 rounded-xl border border-[#e2dfd8] bg-white p-3 text-xs font-bold text-[#26332f] transition hover:border-[#d86f45] shadow-sm"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef1eb] text-[#5e8c67]">
            <ShoppingBag size={16} />
          </div>
          <span>View Orders</span>
        </Link>
        <Link
          to="/admin/analytics"
          className="flex items-center gap-2.5 rounded-xl border border-[#e2dfd8] bg-white p-3 text-xs font-bold text-[#26332f] transition hover:border-[#d86f45] shadow-sm"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#faedc9] text-[#ad842a]">
            <TrendingUp size={16} />
          </div>
          <span>Analytics</span>
        </Link>
        <Link
          to="/admin/settings"
          className="flex items-center gap-2.5 rounded-xl border border-[#e2dfd8] bg-white p-3 text-xs font-bold text-[#26332f] transition hover:border-[#d86f45] shadow-sm"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#dce8ed] text-[#5e8395]">
            <Settings size={16} />
          </div>
          <span>Settings</span>
        </Link>
      </div>

      {/* Revenue & Top Products Grid */}
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        {/* Revenue chart */}
        <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-4 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Revenue Trajectory</p>
              <p className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#26332f]">
                {formatCurrency(analytics.totalRevenue, currency)}
              </p>
            </div>
            <span className="rounded-full border border-[#d8d0c6] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#736b61]">
              Past 30 Days
            </span>
          </div>

          <div className="mt-6 flex h-40 sm:h-48 items-end gap-1.5 sm:gap-2.5 pt-4">
            {analytics.revenueOverTime.slice(-14).map((d, i) => {
              const maxRev = Math.max(...analytics.revenueOverTime.map((x) => x.revenue), 1);
              const h = Math.max((d.revenue / maxRev) * 100, 6);
              return (
                <div key={i} className="group relative flex h-full flex-1 flex-col justify-end items-center">
                  <div 
                    className={`w-full rounded-t-md transition-all duration-300 group-hover:bg-[#d86f45] ${
                      i >= 11 ? "bg-[#d86f45]" : "bg-[#d8e0d4]"
                    }`} 
                    style={{ height: `${h}%` }} 
                  />
                  <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#26332f] px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover:block z-10">
                    {formatCurrency(d.revenue, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Top Selling Guides */}
        <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Top Selling Ebooks</p>
            <Link to="/admin/products" className="text-xs font-bold text-[#d86f45] hover:underline">Manage</Link>
          </div>

          <div className="space-y-3">
            {analytics.topProducts.slice(0, 4).map((tp, i) => {
              const prod = products.find((p) => p.id === tp.productId);
              return (
                <div key={tp.productId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/80 transition">
                  <span className="text-xs font-bold text-[#a99d91] w-4">0{i + 1}</span>
                  <div className="h-10 w-8 shrink-0 overflow-hidden rounded-md bg-[#e2dfd8] shadow-sm">
                    {prod?.imageUrl ? (
                      <img src={prod.imageUrl} alt={tp.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full" style={{ background: prod?.cover?.tone ?? "#d86f45" }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs sm:text-sm font-semibold text-[#26332f]">{tp.title}</p>
                    <p className="text-[10px] text-[#8b8175] mt-0.5">{tp.sales} sales completed</p>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#26332f]">
                    {formatCurrency(tp.revenue, currency)}
                  </span>
                </div>
              );
            })}
            {analytics.topProducts.length === 0 && (
              <p className="text-xs text-[#8b8175] py-6 text-center">No sales yet recorded.</p>
            )}
          </div>
        </section>
      </div>

      {/* Recent Orders Section */}
      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e2dfd8] p-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Real-time activity</p>
            <h3 className="mt-0.5 font-serif text-xl sm:text-2xl font-bold text-[#26332f]">Recent customer orders</h3>
          </div>
          <Link to="/admin/orders" className="text-xs font-bold uppercase tracking-[0.1em] text-[#d86f45] hover:underline">
            View all ({orders.length})
          </Link>
        </div>

        {/* Mobile View: Order Cards */}
        <div className="divide-y divide-[#eae7e0] md:hidden">
          {orders.map((order) => (
            <div key={order.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#26332f]">{order.id}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  order.status === "Paid" ? "bg-[#dcebdd] text-[#4c7b55]" : 
                  order.status === "Refunded" ? "bg-[#fde8e8] text-[#b91c1c]" : 
                  "bg-[#faedc9] text-[#9d7922]"
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#26332f]">{order.customerName}</p>
                  <p className="text-[10px] text-[#8b8175]">{order.items.map((i) => i.title).join(", ")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#26332f]">{formatCurrency(order.total, currency)}</p>
                  <p className="text-[10px] text-[#8b8175]">{relativeDate(order.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="p-8 text-center text-xs text-[#8b8175]">No customer orders placed yet.</div>
          )}
        </div>

        {/* Desktop View: Clean Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f3ee] text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b8175]">
              <tr>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Guide Title</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eae7e0]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-white/60 transition">
                  <td className="px-6 py-4 font-mono font-semibold text-xs">{order.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold">{order.customerName}</p>
                    <p className="text-[10px] text-[#8b8175]">{order.customerEmail}</p>
                  </td>
                  <td className="max-w-[200px] truncate px-6 py-4 text-[#736b61]">
                    {order.items.map((i) => i.title).join(", ")}
                  </td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(order.total, currency)}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      order.status === "Paid" ? "bg-[#dcebdd] text-[#4c7b55]" : 
                      order.status === "Refunded" ? "bg-[#fde8e8] text-[#b91c1c]" : 
                      "bg-[#faedc9] text-[#9d7922]"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#8b8175]">{relativeDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ORDERS SECTION (MOBILE & DESKTOP OPTIMIZED)
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
    <div className="space-y-4 sm:space-y-5">
      {/* Search & Status Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2.5 rounded-full border border-[#d8d0c6] bg-white px-4 py-2.5 text-sm shadow-sm focus-within:border-[#d86f45]">
          <Search size={16} className="text-[#8b8175]" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search by customer, email, or order ID..." 
            className="w-full bg-transparent text-xs sm:text-sm outline-none placeholder:text-[#9d9387]" 
          />
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Paid", "Pending", "Refunded"].map((s) => (
            <button 
              key={s} 
              onClick={() => setStatusFilter(s)} 
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                statusFilter === s 
                  ? "bg-[#26332f] text-white shadow-sm" 
                  : "bg-white border border-[#d8d0c6] text-[#736b61] hover:bg-[#eee7dc]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Container */}
      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] shadow-sm">
        {/* Mobile View: Order Cards */}
        <div className="divide-y divide-[#eae7e0] md:hidden">
          {filtered.map((order) => (
            <div key={order.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-[#26332f]">{order.id}</span>
                  <p className="text-[10px] text-[#8b8175]">{relativeDate(order.createdAt)}</p>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className={`rounded-full border-0 px-3 py-1 text-[11px] font-bold outline-none ${
                    order.status === "Paid" ? "bg-[#dcebdd] text-[#4c7b55]" : 
                    order.status === "Refunded" ? "bg-[#fde8e8] text-[#b91c1c]" : 
                    "bg-[#faedc9] text-[#9d7922]"
                  }`}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <div className="rounded-xl border border-[#eae7e0] bg-white p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-[#26332f]">{order.customerName}</span>
                  <span className="font-bold text-[#26332f]">{formatCurrency(order.total, currency)}</span>
                </div>
                <p className="text-[11px] text-[#8b8175]">{order.customerEmail}</p>
                <div className="pt-1.5 border-t border-[#f5f3ee] text-[11px] text-[#736b61]">
                  📚 {order.items.map((i) => i.title).join(", ")}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-xs text-[#8b8175]">No matching orders found.</div>
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f3ee] text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b8175]">
              <tr>
                <th className="px-6 py-3.5">Order</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Guides</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eae7e0]">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-white/60 transition">
                  <td className="px-6 py-4 font-mono font-semibold text-xs">{order.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold">{order.customerName}</p>
                    <p className="text-[10px] text-[#8b8175]">{order.customerEmail}</p>
                  </td>
                  <td className="max-w-[220px] truncate px-6 py-4 text-[#736b61]">
                    {order.items.map((i) => i.title).join(", ")}
                  </td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(order.total, currency)}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-bold outline-none cursor-pointer ${
                        order.status === "Paid" ? "bg-[#dcebdd] text-[#4c7b55]" : 
                        order.status === "Refunded" ? "bg-[#fde8e8] text-[#b91c1c]" : 
                        "bg-[#faedc9] text-[#9d7922]"
                      }`}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#8b8175]">{relativeDate(order.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-[#8b8175]">
                    No orders match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PRODUCTS SECTION & PRODUCT FORM (COMPLETELY FIXED & RESPONSIVE)
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
    if (!confirm("Are you sure you want to delete this product?")) return;
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
    <div className="space-y-4 sm:space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#8b8175]">
          {products.length} product{products.length !== 1 ? "s" : ""} in catalog
        </p>
        <button 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-2 rounded-full bg-[#d86f45] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#bf5937] shadow-sm"
        >
          <Plus size={15} /> Add new ebook
        </button>
      </div>

      {/* Products list */}
      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] shadow-sm">
        <div className="divide-y divide-[#eae7e0]">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col sm:flex-row sm:items-center gap-3.5 p-4 sm:p-5 hover:bg-white/60 transition">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Book Thumbnail */}
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-[#e2dfd8] shadow-sm border border-[#d8d0c6]">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: product.cover?.tone ?? "#d86f45" }}>
                      PDF
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm sm:text-base text-[#26332f] truncate">{product.title}</p>
                    {product.bestseller && (
                      <span className="rounded-full bg-[#fdf8ee] border border-[#faedd3] px-2 py-0.5 text-[9px] font-bold text-[#ad842a]">
                        Bestseller
                      </span>
                    )}
                    {product.isNew && (
                      <span className="rounded-full bg-[#eef1eb] px-2 py-0.5 text-[9px] font-bold text-[#5e8c67]">
                        New
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#8b8175]">
                    <span>{product.category}</span>
                    <span>·</span>
                    <span>{product.pages} pages</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#ad842a]">
                      <Star size={11} fill="currentColor" className="text-[#e4a83d]" /> {product.rating} ({product.reviews})
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2">
                    {product.pdfFileUrl ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef1eb] px-2.5 py-0.5 text-[10px] font-bold text-[#5e8c67]">
                        <FileCheck size={11} /> PDF Ebook Attached
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5f5] px-2.5 py-0.5 text-[10px] font-bold text-[#b91c1c]">
                        <AlertCircle size={11} /> No PDF Attached
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-[#f0eee8] sm:border-0">
                <span className="text-sm sm:text-base font-bold text-[#26332f]">
                  {formatCurrency(product.price, currency)}
                </span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setEditProduct(product)} 
                    className="flex items-center gap-1 rounded-lg border border-[#d8d0c6] bg-white px-3 py-1.5 text-xs font-semibold text-[#26332f] transition hover:bg-[#eee7dc]"
                    aria-label={`Edit ${product.title}`}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button 
                    onClick={() => deleteProduct(product.id)} 
                    className="flex items-center justify-center h-8 w-8 rounded-lg border border-[#fca5a5] bg-[#fff5f5] text-[#b91c1c] transition hover:bg-[#fee2e2]"
                    aria-label={`Delete ${product.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-[#8b8175]">
              No products found in store. Click "Add new ebook" to publish your first guide!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── PRODUCT EDIT / CREATE FORM ──────────────────────────
function ProductForm({ product, onSaved, onCancel }: { product: Product | null; onSaved: () => void; onCancel: () => void }) {
  const isEdit = !!product;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(product?.title ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [pdfFileUrl, setPdfFileUrl] = useState(product?.pdfFileUrl ?? "");
  const [pdfFileName, setPdfFileName] = useState(product?.pdfFileName ?? "");
  const [pdfFileSize, setPdfFileSize] = useState<number | undefined>(product?.pdfFileSize);
  const [pdfSourceMode, setPdfSourceMode] = useState<"automatic" | "manual">(
    product?.pdfFileUrl?.includes("drive.google.com") || product?.pdfFileUrl?.startsWith("http") ? "manual" : "automatic"
  );
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
  const [benefits, setBenefits] = useState(product?.benefits?.join("\n") ?? "");
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

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setError("Please select a valid .pdf ebook file");
      return;
    }

    setUploadingPdf(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const headers = await adminAuthHeaders();
      const res = await fetch("/api/admin/upload-pdf", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "PDF upload failed" }));
        throw new Error(data.error || "Failed to upload PDF");
      }

      const data = await res.json();
      setPdfFileUrl(data.url);
      setPdfFileName(data.fileName || file.name);
      setPdfFileSize(data.fileSize || file.size);
    } catch (err: any) {
      console.error("PDF upload error:", err);
      setError(err.message || "Failed to upload PDF ebook");
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
        kicker: `APEXMINDREADS`,
        title: title.replace(/ /g, "\n"),
        subtitle: eyebrow,
        author: "ApexMindReads Editorial",
        tone: "#d86f45",
        accent: "#f4c16e",
        pattern: "grid" as const,
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
    <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-4 sm:p-7 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b border-[#e2dfd8] pb-4">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#26332f]">
            {isEdit ? "Edit ebook product" : "Create new ebook"}
          </h3>
          <p className="text-xs text-[#8b8175] mt-1">
            Fill in product info, pricing, cover image, and attach the real PDF ebook file.
          </p>
        </div>
        <button 
          type="button" 
          onClick={onCancel} 
          className="text-xs font-bold text-[#8b8175] hover:text-[#d86f45] transition"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-[#fef2f2] p-3.5 text-sm font-semibold text-[#b91c1c] border border-[#fecaca]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Core Details */}
        <div className="rounded-xl border border-[#e2dfd8] bg-white p-4 sm:p-6 shadow-sm space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d86f45]">1. Ebook Details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input 
              label="Title" 
              value={title} 
              onChange={(v) => { setTitle(v); if (!isEdit) setSlug(autoSlug(v)); }} 
              required 
              placeholder="e.g. The Focus Architecture" 
            />
            <Input 
              label="Slug (URL Path)" 
              value={slug} 
              onChange={setSlug} 
              required 
              placeholder="the-focus-architecture" 
            />
            <Input 
              label="Eyebrow Subtitle" 
              value={eyebrow} 
              onChange={setEyebrow} 
              placeholder="A complete operating system for deep work" 
            />
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">Category</label>
              <select 
                value={category} 
                onChange={(e) => { 
                  setCategory(e.target.value); 
                  setCategorySlug(categories.find((c) => c.name === e.target.value)?.slug ?? ""); 
                }} 
                className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-white px-4 text-sm outline-none focus:border-[#d86f45]"
              >
                {categories.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Input 
                label="Short description" 
                value={description} 
                onChange={setDescription} 
                required 
                placeholder="Concise summary for catalog cards" 
              />
            </div>
            <div className="sm:col-span-2">
              <TextArea 
                label="Long description (Full Overview)" 
                value={longDescription} 
                onChange={setLongDescription} 
              />
            </div>
          </div>
        </div>

        {/* Card 2: PDF Ebook File Attachment (Automatic vs Manual) */}
        <div className="rounded-xl border-2 border-[#e2dfd8] bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="text-[#d86f45]" size={18} />
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#26332f]">
                  2. PDF Ebook Attachment
                </label>
              </div>
              <p className="text-xs text-[#8b8175] mt-1">
                Attach your PDF ebook file. Customers will receive this file immediately upon verified checkout.
              </p>
            </div>
            {pdfFileUrl && (
              <span className="inline-flex items-center gap-1 self-start sm:self-auto rounded-full bg-[#eef1eb] px-3 py-1 text-[11px] font-bold text-[#5e8c67]">
                <FileCheck size={13} /> Ebook Ready
              </span>
            )}
          </div>

          {/* Mode Switcher */}
          <div className="mb-4 flex rounded-xl border border-[#d8d0c6] bg-[#f8f6f0] p-1 gap-1">
            <button
              type="button"
              onClick={() => setPdfSourceMode("automatic")}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition ${
                pdfSourceMode === "automatic"
                  ? "bg-[#26332f] text-[#fffaf2] shadow-sm"
                  : "text-[#736b61] hover:text-[#26332f]"
              }`}
            >
              ⚡ Automatic (Upload PDF File)
            </button>
            <button
              type="button"
              onClick={() => setPdfSourceMode("manual")}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition ${
                pdfSourceMode === "manual"
                  ? "bg-[#26332f] text-[#fffaf2] shadow-sm"
                  : "text-[#736b61] hover:text-[#26332f]"
              }`}
            >
              🔗 Manual (Google Drive Link)
            </button>
          </div>

          {pdfFileUrl ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#b8c7b2] bg-[#f8f6f0] p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d86f45] text-white shadow-sm">
                  <FileText size={22} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate text-[#26332f]">
                    {pdfFileName || "Ebook Guide.pdf"}
                  </p>
                  <p className="text-xs text-[#8b8175] mt-0.5 truncate max-w-md">
                    {pdfFileSize ? `${(pdfFileSize / (1024 * 1024)).toFixed(2)} MB · ` : ""}
                    {pdfFileUrl.includes("drive.google.com") ? "Google Drive Cloud Stream" : "Store Cloud Storage (Instant buyer delivery)"}
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
                  <Eye size={13} /> Test / Open PDF
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
          ) : pdfSourceMode === "automatic" ? (
            <div>
              <input
                id="product-pdf-file-upload"
                type="file"
                accept=".pdf,application/pdf"
                disabled={uploadingPdf}
                onChange={handlePdfUpload}
                className="hidden"
              />
              <label 
                htmlFor="product-pdf-file-upload"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d8d0c6] bg-[#fcfbf9] p-6 text-center cursor-pointer transition hover:border-[#d86f45] hover:bg-[#fffaf2]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eee7dc] text-[#d86f45] mb-2">
                  {uploadingPdf ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
                </div>
                <span className="text-sm font-semibold text-[#26332f]">
                  {uploadingPdf ? "Saving PDF ebook to store..." : "Click to select PDF file from your device"}
                </span>
                <span className="text-xs text-[#8b8175] mt-1">
                  Supports .pdf files up to 50MB
                </span>
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-[#d8d0c6] bg-[#fcfbf9] p-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#736b61] mb-1">
                  Google Drive Sharing Link
                </label>
                <input
                  type="text"
                  value={pdfFileUrl}
                  onChange={(e) => {
                    let val = e.target.value.trim();
                    if (val.includes("drive.google.com/file/d/")) {
                      const fileId = val.split("/d/")[1]?.split("/")[0]?.split("?")[0];
                      if (fileId) {
                        val = `https://drive.google.com/uc?export=download&id=${fileId}`;
                      }
                    }
                    setPdfFileUrl(val);
                    if (val && !pdfFileName) setPdfFileName(`${title || "Guide"}.pdf`);
                  }}
                  placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing"
                  className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-white px-4 text-sm outline-none focus:border-[#d86f45]"
                />
              </div>
              <p className="text-[11px] text-[#8b8175]">
                💡 Tip: Make sure your Google Drive file's general access is set to <strong>"Anyone with the link can view"</strong> so customers can download it directly.
              </p>
            </div>
          )}
        </div>

        {/* Card 3: Rating & Social Proof */}
        <div className="rounded-xl border border-[#e2dfd8] bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d86f45]">3. Reader Rating & Reviews</p>
              <p className="text-xs text-[#8b8175] mt-1">Showcase real reader satisfaction metrics on storefront cards.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbfaf7] border border-[#e2dfd8] px-3 py-1 text-xs font-bold text-[#26332f] self-start sm:self-auto">
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
                  className="h-12 w-24 rounded-xl border border-[#d8d0c6] bg-white px-3 text-sm font-semibold text-[#26332f] outline-none focus:border-[#d86f45]"
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
                label="Number of Reader Reviews"
                value={reviews}
                onChange={setReviews}
                placeholder="e.g. 128"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Pricing, Format & Specifications */}
        <div className="rounded-xl border border-[#e2dfd8] bg-white p-4 sm:p-6 shadow-sm space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d86f45]">4. Pricing & Specifications</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Price (NGN)" type="number" value={price} onChange={setPrice} required placeholder="5000" />
            <Input label="Old Price (NGN, Strike-through)" type="number" value={oldPrice} onChange={setOldPrice} placeholder="7500" />
            <Input label="Page Count" type="number" value={pages} onChange={setPages} placeholder="45" />
            <Input label="Format" value={format} onChange={setFormat} placeholder="PDF guide" />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">
              Key Benefits & Takeaways (One per line)
            </label>
            <textarea
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[#d8d0c6] bg-white px-4 py-3 text-sm outline-none focus:border-[#d86f45]"
              placeholder="Step-by-step frameworks&#10;Actionable templates&#10;Lifetime access"
            />
          </div>
        </div>

        {/* Card 5: Product Cover Photo */}
        <div className="rounded-xl border border-[#e2dfd8] bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d86f45]">5. Product Cover Photo</p>
              <p className="text-xs text-[#8b8175] mt-1">Upload a cover image from your device or paste a photo link.</p>
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
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-sm font-bold text-[#26332f]">Cover Image Attached</p>
                <p className="text-xs text-[#8b8175] mt-0.5 truncate max-w-md">
                  {imageUrl.startsWith("data:") ? "Image loaded from computer (ready to publish)" : imageUrl}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#fca5a5] bg-[#fff5f5] px-3.5 py-1.5 text-xs font-bold text-[#b91c1c] transition hover:bg-[#fee2e2]"
              >
                <Trash2 size={13} /> Change Image
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                id="product-cover-image-upload"
                type="file"
                accept="image/*"
                disabled={uploadingImage}
                onChange={handleImageUpload}
                className="hidden"
              />
              <label 
                htmlFor="product-cover-image-upload"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d8d0c6] bg-[#fcfbf9] p-5 text-center cursor-pointer transition hover:border-[#d86f45] hover:bg-[#fffaf2]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eee7dc] text-[#d86f45] mb-2">
                  {uploadingImage ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                </div>
                <span className="text-sm font-semibold text-[#26332f]">
                  {uploadingImage ? "Processing cover photo..." : "Click to select cover photo from your device"}
                </span>
                <span className="text-xs text-[#8b8175] mt-0.5">
                  Supports JPG, PNG, or WebP
                </span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8b8175] whitespace-nowrap">Or Image URL:</span>
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

        {/* Card 6: Badges & Display Toggles */}
        <div className="rounded-xl border border-[#e2dfd8] bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d86f45] mb-3">6. Storefront Badges</p>
          <div className="flex flex-wrap items-center gap-6">
            <Checkbox label="Featured on Home" checked={featured} onChange={setFeatured} />
            <Checkbox label="Bestseller Badge" checked={bestseller} onChange={setBestseller} />
            <Checkbox label="New Release Badge" checked={isNew} onChange={setIsNew} />
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2dfd8]">
          <button 
            type="button" 
            onClick={onCancel} 
            className="rounded-xl border border-[#d8d0c6] bg-white px-5 py-2.5 text-xs font-bold text-[#736b61] hover:bg-[#eee7dc] transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving} 
            className="flex items-center gap-2 rounded-xl bg-[#d86f45] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#bf5937] transition disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
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
    <div className="space-y-4 sm:space-y-5">
      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b8175]" />
          <input
            type="text"
            placeholder="Search customers by name, email, or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#d8d0c6] bg-white pl-10 pr-4 text-xs sm:text-sm outline-none focus:border-[#d86f45] shadow-sm"
          />
        </div>
        <p className="text-xs font-semibold text-[#8b8175]">
          Total: {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Customer List */}
      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] shadow-sm">
        <div className="divide-y divide-[#e2dfd8]">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center gap-3.5 p-4 sm:p-5 hover:bg-white/60 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eee7dc] text-xs font-bold text-[#d86f45] shadow-sm">
                {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-sm text-[#26332f]">{c.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    c.status === "Active" ? "bg-[#eef1eb] text-[#5e8c67]" : "bg-[#faedc9] text-[#9d7922]"
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[#8b8175]">
                  {c.email} · {c.country || "Global"} · {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs sm:text-sm font-bold text-[#26332f]">
                  {formatCurrency(c.totalSpent, currency)}
                </span>
                <p className="text-[10px] text-[#8b8175]">Total spent</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-6 py-14 text-center text-sm text-[#8b8175]">No customers found.</div>
          )}
        </div>
      </section>
    </div>
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
  if (error || !analytics) return <ErrorBlock message={error || "Failed to load analytics"} onRetry={load} />;

  const countryEntries = Object.entries(analytics.revenueByCountry).sort((a, b) => b[1] - a[1]);
  const totalCountryRev = countryEntries.reduce((s, [, v]) => s + v, 0) || 1;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Revenue by Country */}
      <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Global Distribution</p>
        <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-[#26332f]">Revenue by country</h3>
        
        <div className="mt-6 space-y-4">
          {countryEntries.map(([country, rev]) => (
            <div key={country}>
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                <span className="font-semibold text-[#26332f]">{country}</span>
                <span className="text-[#8b8175]">
                  {Math.round((rev / totalCountryRev) * 100)}% · {formatCurrency(rev, currency)}
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-[#eae7e0] overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#d86f45] transition-all duration-500" 
                  style={{ width: `${(rev / totalCountryRev) * 100}%` }} 
                />
              </div>
            </div>
          ))}
          {countryEntries.length === 0 && (
            <p className="text-xs text-[#8b8175] py-6 text-center">No regional sales data available yet.</p>
          )}
        </div>
      </section>

      {/* Retention Metrics */}
      <div className="space-y-5">
        <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Retention</p>
          <h3 className="mt-1 font-serif text-xl font-bold text-[#26332f]">Repeat Customers</h3>
          <p className="mt-3 font-serif text-4xl font-bold text-[#26332f]">{analytics.repeatCustomerRate}%</p>
          <p className="mt-1.5 text-xs text-[#8b8175]">Percentage of customers who purchased 2 or more ebooks.</p>
        </section>

        <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Category Leader</p>
          <h3 className="mt-1 font-serif text-xl font-bold text-[#26332f]">Top Ebook Category</h3>
          <p className="mt-3 font-serif text-3xl font-bold text-[#26332f]">{analytics.topCategory || "General"}</p>
          <p className="mt-1.5 text-xs text-[#8b8175]">Best performing digital category by total sales volume.</p>
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
    if (!confirm("Delete this promotion campaign?")) return;
    try {
      await apiFetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  if (showForm || editPromo) {
    return (
      <PromoForm 
        promo={editPromo} 
        onSaved={() => { setShowForm(false); setEditPromo(null); load(); }} 
        onCancel={() => { setShowForm(false); setEditPromo(null); }} 
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex justify-end">
        <button 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-2 rounded-full bg-[#d86f45] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#bf5937] transition"
        >
          <Plus size={14} /> New promotion
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] shadow-sm">
        <div className="divide-y divide-[#eae7e0]">
          {promotions.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-4 sm:p-5 hover:bg-white/60 transition">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-sm sm:text-base text-[#26332f]">{p.title}</p>
                  <span className="rounded-full bg-[#faedc9] px-2.5 py-0.5 text-[10px] font-bold text-[#ad842a]">
                    {p.discountPercent}% OFF
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-[#8b8175]">
                  {p.description} · Valid {p.startDate} to {p.endDate}
                </p>
              </div>
              <span className={`hidden sm:inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                p.status === "Active" ? "bg-[#eef1eb] text-[#5e8c67]" : 
                p.status === "Draft" ? "bg-[#faedc9] text-[#9d7922]" : 
                "bg-[#eae7e0] text-[#8b8175]"
              }`}>
                {p.status}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditPromo(p)} className="p-1.5 text-[#8b8175] hover:text-[#d86f45]" aria-label="Edit promotion">
                  <Pencil size={15} />
                </button>
                <button onClick={() => deletePromo(p.id)} className="p-1.5 text-[#8b8175] hover:text-[#b91c1c]" aria-label="Delete promotion">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {promotions.length === 0 && (
            <div className="px-6 py-14 text-center text-sm text-[#8b8175]">No promotional campaigns active.</div>
          )}
        </div>
      </section>
    </div>
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
    <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-4 sm:p-7 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b border-[#e2dfd8] pb-4">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#26332f]">
          {isEdit ? "Edit promotion" : "New promotion"}
        </h3>
        <button onClick={onCancel} className="text-xs font-bold text-[#8b8175] hover:text-[#d86f45]">Cancel</button>
      </div>
      {error && <div className="mb-5 rounded-xl bg-[#fef2f2] p-3 text-sm font-semibold text-[#b91c1c]">{error}</div>}
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input label="Campaign Title" value={title} onChange={setTitle} required placeholder="e.g. Black Friday 2026" />
        <Input label="Discount %" value={discountPercent} onChange={setDiscountPercent} type="number" required placeholder="20" />
        <div className="sm:col-span-2">
          <Input label="Description" value={description} onChange={setDescription} placeholder="Special discount code banner" />
        </div>
        <Input label="Start Date" value={startDate} onChange={setStartDate} type="date" required />
        <Input label="End Date" value={endDate} onChange={setEndDate} type="date" required />
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Promotion["status"])} className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-white px-4 text-sm outline-none focus:border-[#d86f45]">
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
        <div className="sm:col-span-2 pt-3 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl border border-[#d8d0c6] bg-white px-5 py-2.5 text-xs font-bold text-[#736b61]">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#d86f45] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60 shadow-sm">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isEdit ? "Save changes" : "Create campaign"}
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
      alert("Settings saved successfully!");
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
      setCredSuccess("Credentials updated successfully. Use these next time you log in.");
      setAdminPassword("");
    } catch (e: any) {
      setCredError(e.message);
    } finally {
      setCredSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Store Defaults */}
        <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7 shadow-sm space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d86f45]">Store Defaults</p>
            <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-[#26332f]">Store Information</h3>
          </div>

          <div className="space-y-4">
            <Input label="Store Name" value={storeName} onChange={setStoreName} />
            <Input label="Support Email" value={supportEmail} onChange={setSupportEmail} type="email" />
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">Default Currency</label>
              <select 
                value={storeCurrency} 
                onChange={(e) => setStoreCurrency(e.target.value as Currency)} 
                className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-white px-4 text-sm outline-none focus:border-[#d86f45]"
              >
                {currencyOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.symbol} {option.label} ({option.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">Download Access</label>
              <select 
                value={downloadMode} 
                onChange={(e) => setDownloadMode(e.target.value as "instant" | "email")} 
                className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-white px-4 text-sm outline-none focus:border-[#d86f45]"
              >
                <option value="instant">Instant download after payment</option>
                <option value="email">Email delivery link</option>
              </select>
            </div>
            <button 
              onClick={save} 
              disabled={saving} 
              className="flex items-center gap-2 rounded-xl bg-[#d86f45] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60 shadow-sm hover:bg-[#bf5937] transition"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save settings
            </button>
          </div>
        </section>

        {/* Current Active Configuration */}
        <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175]">Configuration Summary</p>
            <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-[#26332f]">Active Store Setup</h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-white border border-[#eae7e0] p-3.5">
                <p className="text-xs text-[#8b8175]">Store Name</p>
                <p className="mt-0.5 font-bold text-[#26332f]">{settings?.storeName ?? "ApexMindReads"}</p>
              </div>
              <div className="rounded-xl bg-white border border-[#eae7e0] p-3.5">
                <p className="text-xs text-[#8b8175]">Support Email</p>
                <p className="mt-0.5 font-bold text-[#26332f]">{settings?.supportEmail ?? "support@apexmindreads.com"}</p>
              </div>
              <div className="rounded-xl bg-white border border-[#eae7e0] p-3.5">
                <p className="text-xs text-[#8b8175]">Default Currency</p>
                <p className="mt-0.5 font-bold text-[#26332f]">{settings?.currency ?? "NGN"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#eae7e0] flex items-center gap-2 text-xs text-[#5e8c67] font-semibold">
            <ShieldCheck size={16} /> Store secure & Paystack Live connected
          </div>
        </section>
      </div>

      {/* Admin Credentials Security Card */}
      <section className="rounded-2xl border border-[#e2dfd8] bg-[#fbfaf7] p-5 sm:p-7 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d86f45]">Security</p>
        <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-[#26332f]">Admin Login Credentials</h3>
        <p className="mt-1 max-w-xl text-xs text-[#8b8175]">Update your admin email address or password.</p>
        
        {credSuccess && <div className="mt-4 max-w-md rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] p-3 text-xs font-semibold text-[#059669]">{credSuccess}</div>}
        {credError && <div className="mt-4 max-w-md rounded-xl bg-[#fef2f2] border border-[#fecaca] p-3 text-xs font-semibold text-[#b91c1c]">{credError}</div>}

        <div className="mt-5 max-w-md space-y-4">
          <Input label="Admin Email" value={adminEmail} onChange={setAdminEmail} type="email" placeholder="Leave blank to keep current" />
          <Input label="New Password" value={adminPassword} onChange={setAdminPassword} type="password" placeholder="Leave blank to keep current" />
          
          <button 
            onClick={updateCredentials} 
            disabled={credSaving} 
            className="flex items-center gap-2 rounded-xl bg-[#26332f] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60 hover:bg-[#3b4b45] transition shadow-sm"
          >
            {credSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Update credentials
          </button>
        </div>
      </section>
    </div>
  );
}

// ─── Shared Form Controls (Safe, Scoped, Clean) ──────────
function Input({ label, value, onChange, type = "text", required = false, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div className="block">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        required={required} 
        placeholder={placeholder} 
        className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-white px-4 text-sm text-[#26332f] outline-none focus:border-[#d86f45] shadow-xs" 
      />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="block">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">{label}</label>
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        rows={4} 
        className="w-full rounded-xl border border-[#d8d0c6] bg-white px-4 py-3 text-sm text-[#26332f] outline-none focus:border-[#d86f45] shadow-xs" 
      />
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
        className="h-4 w-4 rounded accent-[#d86f45] cursor-pointer" 
      />
      <span className="text-xs sm:text-sm font-semibold text-[#26332f]">{label}</span>
    </label>
  );
}
