import { useCallback, useEffect, useState } from "react";
import { 
  AlertCircle, 
  ArrowUpRight,
  BarChart3, 
  Bell,
  BellOff,
  BellRing,
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
  Moon,
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
  Sun,
  Trash2, 
  TrendingUp,
  UploadCloud, 
  Users, 
  Volume2,
  Wallet, 
  X 
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatCurrency, type Currency, currencyOptions } from "@/lib/currency";
import { useAdminAuth, adminAuthHeaders } from "@/lib/admin-auth";
import { useOrderLiveAlerts } from "@/lib/adminNotifications";
import type { 
  AnalyticsResponse, 
  OrderListResponse, 
  CustomerListResponse, 
  PromotionListResponse, 
  ProductListResponse, 
  SettingsResponse 
} from "@shared/api";
import type { Product, Order, CustomerView, Promotion, StoreSettings, PaymentGateway } from "@shared/schema";

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

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("apexmind_admin_theme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((curr) => {
      const next = curr === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("apexmind_admin_theme", next);
      }
      return next;
    });
  };

  const {
    notifEnabled,
    toggleNotifications,
    testNotification,
  } = useOrderLiveAlerts(currency);

  const handleLogout = async () => {
    await adminLogout();
    navigate("/admin/login");
  };

  return (
    <div className={`min-h-screen pb-20 lg:pb-10 transition-colors duration-200 ${theme === "dark" ? "dark bg-[#0a0a0a] text-[#f4f4f5]" : "bg-[#f5f3ee] text-[#26332f]"}`}>
      {/* Desktop Sidebar */}
      <DesktopSidebar active={active} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />

      {/* Main Content Area */}
      <div className="lg:pl-[245px]">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 border-b border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7]/95 dark:bg-[#0f0f0f]/95 px-4 py-3.5 backdrop-blur sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button 
                onClick={() => setMobileNavOpen(true)} 
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] text-[#26332f] dark:text-[#f4f4f5] transition hover:bg-[#eee7dc] dark:hover:bg-[#222222] lg:hidden shadow-sm" 
                aria-label="Open admin navigation menu"
              >
                <Menu size={20} />
              </button>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block h-2 w-2 rounded-full bg-[#5e8c67] animate-pulse" />
                  <p className="text-[11px] font-semibold text-[#8b8175] dark:text-[#a1a1aa] hidden sm:block">
                    {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <h1 className="truncate font-serif text-xl sm:text-2xl lg:text-3xl tracking-tight text-[#26332f] dark:text-[#f4f4f5]">
                  {active === "Overview" ? `Welcome back, ${admin?.name?.split(" ")[0] ?? "Admin"}` : active}
                </h1>
              </div>
            </div>

            {/* Notification Toggle and Quick Test Sound Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleNotifications}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition shadow-sm active:scale-95 ${
                  notifEnabled
                    ? "border-[#5e8c67]/40 bg-[#f0f7f2] dark:bg-[#0f2415] text-[#2d5a37] dark:text-[#4ade80] hover:bg-[#e2f0e6] dark:hover:bg-[#163520]"
                    : "border-[#d86f45]/50 bg-[#fff5f0] dark:bg-[#2e170f] text-[#d86f45] hover:bg-[#ffece4] dark:hover:bg-[#3d1e14] animate-pulse"
                }`}
                title={notifEnabled ? "Order alerts are enabled on this device" : "Click to enable real-time order alerts on this device"}
              >
                {notifEnabled ? <BellRing size={13} className="text-[#5e8c67]" /> : <BellOff size={13} className="text-[#d86f45]" />}
                <span className="hidden min-[480px]:inline">{notifEnabled ? "Alerts Active" : "Enable Alerts"}</span>
                <span className="min-[480px]:hidden">{notifEnabled ? "On" : "Enable"}</span>
              </button>

              <button
                onClick={testNotification}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-3.5 py-1.5 text-xs font-bold text-[#26332f] dark:text-[#f4f4f5] transition hover:bg-[#faedc9] dark:hover:bg-[#262626] hover:border-[#d86f45] shadow-sm active:scale-95"
                title="Test cash register sound and mobile notification"
              >
                <Volume2 size={13} className="text-[#d86f45]" />
                <span className="hidden min-[480px]:inline">Test Sound</span>
                <span className="min-[480px]:hidden">Test</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button 
              onClick={closeNav} 
              className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
              aria-label="Close admin navigation overlay" 
            />
            <div className="absolute inset-y-0 left-0 w-[285px] max-w-[85vw] overflow-y-auto bg-[#26332f] dark:bg-[#0a0a0a] dark:border-r dark:border-[#222222] px-5 py-6 text-[#f8f4ec] shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-[#3b4b45] dark:border-[#222222]">
                  <Link to="/" onClick={closeNav} className="flex items-center gap-2.5 font-serif text-lg tracking-tight">
                    <img 
                      src="/logo.png" 
                      alt="ApexMindReads logo" 
                      className="h-7 w-7 object-contain" 
                    />
                    <span>ApexMind<span className="text-[#e58a61]">Reads</span></span>
                  </Link>
                  <button 
                    onClick={closeNav} 
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b4b45] dark:bg-[#1a1a1a] text-[#bec5bb] dark:text-[#a1a1aa] hover:text-white" 
                    aria-label="Close navigation"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-6">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8da096] dark:text-[#71717a]">Management</p>
                  <nav className="mt-2.5 space-y-1">
                    {navItems.map(({ label, path, icon: Icon }) => (
                      <Link 
                        key={label} 
                        to={path} 
                        onClick={closeNav} 
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                          active === label 
                            ? "bg-[#e58a61] text-white shadow-sm font-semibold" 
                            : "text-[#bec5bb] dark:text-[#a1a1aa] hover:bg-[#3b4b45] dark:hover:bg-[#1a1a1a] hover:text-white"
                        }`}
                      >
                        <Icon size={18} />
                        <span>{label}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>

              <div className="pt-6 border-t border-[#3b4b45] dark:border-[#222222] space-y-2">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
                <Link
                  to="/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={closeNav}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs text-[#bec5bb] dark:text-[#a1a1aa] hover:bg-[#3b4b45] dark:hover:bg-[#1a1a1a] hover:text-white"
                >
                  <Eye size={15} /> Open Storefront
                </Link>
                <button 
                  onClick={() => { closeNav(); handleLogout(); }} 
                  className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#f87171] hover:bg-[#3b4b45] dark:hover:bg-[#1a1a1a]"
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
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl tracking-tight text-[#26332f] dark:text-[#f4f4f5]">
              {sectionIntro[active as Section]}
            </h2>
          </div>

          {active === "Overview" && <OverviewSection currency={currency} />}
          {active === "Orders" && <OrdersSection currency={currency} />}
          {active === "Products" && <ProductsSection currency={currency} />}
          {active === "Customers" && <CustomersSection currency={currency} />}
          {active === "Analytics" && <AnalyticsSection currency={currency} />}
          {active === "Promotions" && <PromotionsSection />}
          {active === "Settings" && (
            <SettingsSection 
              notifEnabled={notifEnabled} 
              toggleNotifications={toggleNotifications} 
              testNotification={testNotification} 
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#fbfaf7]/95 dark:bg-[#0f0f0f]/95 border-t border-[#e2dfd8] dark:border-[#222222] px-2 py-2 backdrop-blur lg:hidden flex items-center justify-around shadow-lg">
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
                  : "text-[#8b8175] dark:text-[#a1a1aa] hover:text-[#26332f] dark:hover:text-[#f4f4f5]"
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

// ─── Theme Toggle Component ──────────────────────────────
function ThemeToggle({ theme, onToggle }: { theme: "light" | "dark"; onToggle: () => void }) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-xl border border-[#3b4b45] dark:border-[#262626] bg-[#1a2320] dark:bg-[#141414] px-3.5 py-2.5 text-xs font-semibold text-[#f8f4ec] transition hover:bg-[#283632] dark:hover:bg-[#1f1f1f] hover:border-[#526a62] dark:hover:border-[#383838] shadow-sm active:scale-[0.98]"
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      aria-label={`Toggle theme, current is ${theme}`}
    >
      <div className="flex items-center gap-2.5">
        {isDark ? (
          <Moon size={15} className="text-[#f0bc58]" />
        ) : (
          <Sun size={15} className="text-[#e58a61]" />
        )}
        <span className="font-medium">{isDark ? "Dark Theme" : "Light Theme"}</span>
      </div>

      {/* Modern pill slider toggle */}
      <div
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300 ${
          isDark ? "bg-[#e58a61]" : "bg-[#455850]"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
            isDark ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}

// ─── Desktop Sidebar ─────────────────────────────────────
function DesktopSidebar({ active, onLogout, theme, onToggleTheme }: { active: string; onLogout: () => void; theme: "light" | "dark"; onToggleTheme: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[245px] flex-col bg-[#26332f] dark:bg-[#0a0a0a] dark:border-r dark:border-[#222222] px-5 py-6 text-[#f8f4ec] lg:flex justify-between">
      <div>
        <Link to="/" className="flex items-center gap-2.5 font-serif text-[1.25rem] tracking-tight">
          <img 
            src="/logo.png" 
            alt="ApexMindReads logo" 
            className="h-8 w-8 object-contain" 
          />
          <span>ApexMind<span className="text-[#e58a61]">Reads</span></span>
        </Link>
        <AdminNav active={active} />
      </div>

      <div className="pt-4 border-t border-[#3b4b45] dark:border-[#222222] space-y-2">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs text-[#bec5bb] dark:text-[#a1a1aa] hover:bg-[#3b4b45] dark:hover:bg-[#1a1a1a] hover:text-white transition"
        >
          <Eye size={16} /> Open Storefront
        </Link>
        <button 
          onClick={onLogout} 
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs text-[#bec5bb] dark:text-[#a1a1aa] hover:bg-[#3b4b45] dark:hover:bg-[#1a1a1a] hover:text-[#f87171] transition"
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
      <p className={`${mobile ? "mt-8" : "mt-10"} px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8da096] dark:text-[#71717a]`}>
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
                : "text-[#bec5bb] dark:text-[#a1a1aa] hover:bg-[#3b4b45] dark:hover:bg-[#1a1a1a] hover:text-white"
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
    orange: "bg-[#f9e3d9] dark:bg-[#2e170f] text-[#c76b4c] dark:text-[#f97316]", 
    green: "bg-[#dcebdd] dark:bg-[#0f2415] text-[#5e8c67] dark:text-[#4ade80]", 
    blue: "bg-[#dce8ed] dark:bg-[#0f1d2e] text-[#5e8395] dark:text-[#38bdf8]", 
    gold: "bg-[#faedc9] dark:bg-[#291e0a] text-[#ad842a] dark:text-[#facc15]" 
  };
  return (
    <div className="rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-4 sm:p-5 shadow-sm transition hover:shadow">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b8175] dark:text-[#8ea297]">{label}</p>
        <span className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 truncate font-serif text-2xl sm:text-3xl tracking-tight text-[#26332f] dark:text-[#edf2ee] font-bold">
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

      {/* Revenue & Top Products Grid */}
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        {/* Revenue chart */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-4 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175] dark:text-[#a1a1aa]">Revenue Trajectory</p>
              <p className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#26332f] dark:text-[#f4f4f5]">
                {formatCurrency(analytics.totalRevenue, currency)}
              </p>
            </div>
            <span className="rounded-full border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#1c1c1c] px-2.5 py-1 text-[11px] font-semibold text-[#736b61] dark:text-[#d4d4d8]">
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
                      i >= 11 ? "bg-[#d86f45]" : "bg-[#d8e0d4] dark:bg-[#262626]"
                    }`} 
                    style={{ height: `${h}%` }} 
                  />
                  <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#26332f] dark:bg-[#000000] px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover:block z-10">
                    {formatCurrency(d.revenue, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Top Selling Guides */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175] dark:text-[#a1a1aa]">Top Selling Ebooks</p>
            <Link to="/admin/products" className="text-xs font-bold text-[#d86f45] hover:underline">Manage</Link>
          </div>

          <div className="space-y-3">
            {analytics.topProducts.slice(0, 4).map((tp, i) => {
              const prod = products.find((p) => p.id === tp.productId);
              return (
                <div key={tp.productId} className="flex min-w-0 items-center gap-2.5 sm:gap-3 p-2 rounded-xl hover:bg-white/80 dark:hover:bg-white/5 transition overflow-hidden">
                  <span className="text-xs font-bold text-[#a99d91] dark:text-[#71717a] w-4 shrink-0">0{i + 1}</span>
                  <div className="h-10 w-8 shrink-0 overflow-hidden rounded-md bg-[#e2dfd8] dark:bg-[#262626] shadow-sm">
                    {prod?.imageUrl ? (
                      <img src={prod.imageUrl} alt={tp.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full" style={{ background: prod?.cover?.tone ?? "#d86f45" }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate text-xs sm:text-sm font-semibold text-[#26332f] dark:text-[#f4f4f5]" title={tp.title}>{tp.title}</p>
                    <p className="truncate text-[10px] text-[#8b8175] dark:text-[#a1a1aa] mt-0.5">{tp.sales} sales completed</p>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#26332f] dark:text-[#f4f4f5] shrink-0 whitespace-nowrap pl-1 text-right">
                    {formatCurrency(tp.revenue, currency)}
                  </span>
                </div>
              );
            })}
            {analytics.topProducts.length === 0 && (
              <p className="text-xs text-[#8b8175] dark:text-[#a1a1aa] py-6 text-center">No sales yet recorded.</p>
            )}
          </div>
        </section>
      </div>

      {/* Recent Orders Section */}
      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e2dfd8] dark:border-[#222222] p-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175] dark:text-[#a1a1aa]">Real-time activity</p>
            <h3 className="mt-0.5 font-serif text-xl sm:text-2xl font-bold text-[#26332f] dark:text-[#f4f4f5]">Recent customer orders</h3>
          </div>
          <Link to="/admin/orders" className="text-xs font-bold uppercase tracking-[0.1em] text-[#d86f45] hover:underline">
            View all ({orders.length})
          </Link>
        </div>

        {/* Mobile View: Order Cards */}
        <div className="divide-y divide-[#eae7e0] dark:divide-[#222222] md:hidden">
          {orders.map((order) => (
            <div key={order.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#26332f] dark:text-[#f4f4f5]">{order.id}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  order.status === "Paid" ? "bg-[#dcebdd] dark:bg-[#0f2415] text-[#4c7b55] dark:text-[#4ade80]" : 
                  order.status === "Refunded" ? "bg-[#fde8e8] dark:bg-[#2e1010] text-[#b91c1c] dark:text-[#f87171]" : 
                  "bg-[#faedc9] dark:bg-[#291e0a] text-[#9d7922] dark:text-[#facc15]"
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#26332f] dark:text-[#f4f4f5]">{order.customerName}</p>
                  <p className="text-[10px] text-[#8b8175] dark:text-[#a1a1aa]">{order.items.map((i) => i.title).join(", ")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#26332f] dark:text-[#f4f4f5]">{formatCurrency(order.total, currency)}</p>
                  <p className="text-[10px] text-[#8b8175] dark:text-[#a1a1aa]">{relativeDate(order.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="p-8 text-center text-xs text-[#8b8175] dark:text-[#a1a1aa]">No customer orders placed yet.</div>
          )}
        </div>

        {/* Desktop View: Clean Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f3ee] dark:bg-[#161616] text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b8175] dark:text-[#a1a1aa]">
              <tr>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Guide Title</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eae7e0] dark:divide-[#222222]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-white/60 dark:hover:bg-white/5 transition">
                  <td className="px-6 py-4 font-mono font-semibold text-xs text-[#26332f] dark:text-[#f4f4f5]">{order.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#26332f] dark:text-[#f4f4f5]">{order.customerName}</p>
                    <p className="text-[10px] text-[#8b8175] dark:text-[#a1a1aa]">{order.customerEmail}</p>
                  </td>
                  <td className="max-w-[200px] truncate px-6 py-4 text-[#736b61] dark:text-[#d4d4d8]">
                    {order.items.map((i) => i.title).join(", ")}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#26332f] dark:text-[#f4f4f5]">{formatCurrency(order.total, currency)}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      order.status === "Paid" ? "bg-[#dcebdd] dark:bg-[#0f2415] text-[#4c7b55] dark:text-[#4ade80]" : 
                      order.status === "Refunded" ? "bg-[#fde8e8] dark:bg-[#2e1010] text-[#b91c1c] dark:text-[#f87171]" : 
                      "bg-[#faedc9] dark:bg-[#291e0a] text-[#9d7922] dark:text-[#facc15]"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#8b8175] dark:text-[#a1a1aa]">{relativeDate(order.createdAt)}</td>
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
        <label className="flex flex-1 items-center gap-2.5 rounded-full border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#121212] px-4 py-2.5 text-sm shadow-sm focus-within:border-[#d86f45]">
          <Search size={16} className="text-[#8b8175] dark:text-[#a1a1aa]" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search by customer, email, or order ID..." 
            className="w-full bg-transparent text-xs sm:text-sm text-[#26332f] dark:text-[#f4f4f5] outline-none placeholder:text-[#9d9387] dark:placeholder:text-[#52525b]" 
          />
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Paid", "Pending", "Refunded"].map((s) => (
            <button 
              key={s} 
              onClick={() => setStatusFilter(s)} 
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                statusFilter === s 
                  ? "bg-[#26332f] dark:bg-[#e58a61] text-white shadow-sm" 
                  : "bg-white dark:bg-[#121212] border border-[#d8d0c6] dark:border-[#262626] text-[#736b61] dark:text-[#d4d4d8] hover:bg-[#eee7dc] dark:hover:bg-[#1f1f1f]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Container */}
      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] shadow-sm">
        {/* Mobile View: Order Cards */}
        <div className="divide-y divide-[#eae7e0] dark:divide-[#222222] md:hidden">
          {filtered.map((order) => (
            <div key={order.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-[#26332f] dark:text-[#f4f4f5]">{order.id}</span>
                  <p className="text-[10px] text-[#8b8175] dark:text-[#a1a1aa]">{relativeDate(order.createdAt)}</p>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className={`rounded-full border-0 px-3 py-1 text-[11px] font-bold outline-none ${
                    order.status === "Paid" ? "bg-[#dcebdd] dark:bg-[#0f2415] text-[#4c7b55] dark:text-[#4ade80]" : 
                    order.status === "Refunded" ? "bg-[#fde8e8] dark:bg-[#2e1010] text-[#b91c1c] dark:text-[#f87171]" : 
                    "bg-[#faedc9] dark:bg-[#291e0a] text-[#9d7922] dark:text-[#facc15]"
                  }`}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <div className="rounded-xl border border-[#eae7e0] dark:border-[#222222] bg-white dark:bg-[#171717] p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-[#26332f] dark:text-[#f4f4f5]">{order.customerName}</span>
                  <span className="font-bold text-[#26332f] dark:text-[#f4f4f5]">{formatCurrency(order.total, currency)}</span>
                </div>
                <p className="text-[11px] text-[#8b8175] dark:text-[#a1a1aa]">{order.customerEmail}</p>
                <div className="pt-1.5 border-t border-[#f5f3ee] dark:border-[#222222] text-[11px] text-[#736b61] dark:text-[#d4d4d8]">
                  📚 {order.items.map((i) => i.title).join(", ")}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-xs text-[#8b8175] dark:text-[#a1a1aa]">No matching orders found.</div>
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f3ee] dark:bg-[#161616] text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b8175] dark:text-[#a1a1aa]">
              <tr>
                <th className="px-6 py-3.5">Order</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Guides</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eae7e0] dark:divide-[#222222]">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-white/60 dark:hover:bg-white/5 transition">
                  <td className="px-6 py-4 font-mono font-semibold text-xs text-[#26332f] dark:text-[#f4f4f5]">{order.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#26332f] dark:text-[#f4f4f5]">{order.customerName}</p>
                    <p className="text-[10px] text-[#8b8175] dark:text-[#a1a1aa]">{order.customerEmail}</p>
                  </td>
                  <td className="max-w-[220px] truncate px-6 py-4 text-[#736b61] dark:text-[#d4d4d8]">
                    {order.items.map((i) => i.title).join(", ")}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#26332f] dark:text-[#f4f4f5]">{formatCurrency(order.total, currency)}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-bold outline-none cursor-pointer ${
                        order.status === "Paid" ? "bg-[#dcebdd] dark:bg-[#0f2415] text-[#4c7b55] dark:text-[#4ade80]" : 
                        order.status === "Refunded" ? "bg-[#fde8e8] dark:bg-[#2e1010] text-[#b91c1c] dark:text-[#f87171]" : 
                        "bg-[#faedc9] dark:bg-[#291e0a] text-[#9d7922] dark:text-[#facc15]"
                      }`}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#8b8175] dark:text-[#a1a1aa]">{relativeDate(order.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-[#8b8175] dark:text-[#a1a1aa]">
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
        <p className="text-xs font-semibold text-[#8b8175] dark:text-[#8ea297]">
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
      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] dark:border-[#24302c] bg-[#fbfaf7] dark:bg-[#18211e] shadow-sm">
        <div className="divide-y divide-[#eae7e0] dark:divide-[#24302c]">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col sm:flex-row sm:items-center gap-3.5 p-4 sm:p-5 hover:bg-white/60 dark:hover:bg-white/5 transition">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Book Thumbnail */}
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-[#e2dfd8] dark:bg-[#25322d] shadow-sm border border-[#d8d0c6] dark:border-[#2d3d37]">
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
                    <p className="font-semibold text-sm sm:text-base text-[#26332f] dark:text-[#edf2ee] truncate">{product.title}</p>
                    {product.bestseller && (
                      <span className="rounded-full bg-[#fdf8ee] dark:bg-[#332a13] border border-[#faedd3] dark:border-[#4a3b1a] px-2 py-0.5 text-[9px] font-bold text-[#ad842a] dark:text-[#e4be63]">
                        Bestseller
                      </span>
                    )}
                    {product.isNew && (
                      <span className="rounded-full bg-[#eef1eb] dark:bg-[#192f21] px-2 py-0.5 text-[9px] font-bold text-[#5e8c67] dark:text-[#74b480]">
                        New
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#8b8175] dark:text-[#8ea297]">
                    <span>{product.category}</span>
                    <span>·</span>
                    <span>{product.pages} pages</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#ad842a] dark:text-[#e4be63]">
                      <Star size={11} fill="currentColor" className="text-[#e4a83d]" /> {product.rating} ({product.reviews})
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2">
                    {product.pdfFileUrl ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef1eb] dark:bg-[#192f21] px-2.5 py-0.5 text-[10px] font-bold text-[#5e8c67] dark:text-[#74b480]">
                        <FileCheck size={11} /> PDF Ebook Attached
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5f5] dark:bg-[#331c1c] px-2.5 py-0.5 text-[10px] font-bold text-[#b91c1c] dark:text-[#ea7171]">
                        <AlertCircle size={11} /> No PDF Attached
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-[#f0eee8] dark:border-[#24302c] sm:border-0">
                <span className="text-sm sm:text-base font-bold text-[#26332f] dark:text-[#edf2ee]">
                  {formatCurrency(product.price, currency)}
                </span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setEditProduct(product)} 
                    className="flex items-center gap-1 rounded-lg border border-[#d8d0c6] dark:border-[#2d3d37] bg-white dark:bg-[#141b18] px-3 py-1.5 text-xs font-semibold text-[#26332f] dark:text-[#edf2ee] transition hover:bg-[#eee7dc] dark:hover:bg-[#25322d]"
                    aria-label={`Edit ${product.title}`}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button 
                    onClick={() => deleteProduct(product.id)} 
                    className="flex items-center justify-center h-8 w-8 rounded-lg border border-[#fca5a5] dark:border-[#5c2424] bg-[#fff5f5] dark:bg-[#331c1c] text-[#b91c1c] dark:text-[#ea7171] transition hover:bg-[#fee2e2] dark:hover:bg-[#452222]"
                    aria-label={`Delete ${product.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-[#8b8175] dark:text-[#8ea297]">
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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

    if (file.size > 100 * 1024 * 1024) {
      setPdfSourceMode("manual");
      setPdfFileName(file.name);
      setPdfFileSize(file.size);
      setError(`Notice: "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB (exceeds 100MB limit). For files over 100MB, please paste your Google Drive link in the Manual tab.`);
      return;
    }

    setUploadingPdf(true);
    setUploadProgress(0);
    setError("");

    try {
      const headers = await adminAuthHeaders();
      const CHUNK_SIZE = 600 * 1024; // 600KB chunk size (smooth & reliable across all cloud gateways)
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      // 1. Initialize upload session
      const initRes = await fetch("/api/admin/upload-pdf-init", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          totalChunks,
        }),
      });

      if (!initRes.ok) {
        const errData = await initRes.json().catch(() => ({ error: "Failed to initialize upload" }));
        throw new Error(errData.error || "Failed to initialize upload");
      }

      const { fileId } = await initRes.json();

      // 2. Upload chunks sequentially
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const slice = file.slice(start, end);

        // Convert slice to base64
        const chunkBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(",")[1] || "";
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(slice);
        });

        const chunkRes = await fetch("/api/admin/upload-pdf-chunk", {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId,
            chunkIndex: i,
            data: chunkBase64,
          }),
        });

        if (!chunkRes.ok) {
          throw new Error(`Failed to upload chunk ${i + 1} of ${totalChunks}`);
        }

        const pct = Math.round(((i + 1) / totalChunks) * 100);
        setUploadProgress(pct);
      }

      // 3. Finalize upload
      const completeRes = await fetch("/api/admin/upload-pdf-complete", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      });

      if (!completeRes.ok) {
        throw new Error("Failed to finalize PDF ebook upload");
      }

      const data = await completeRes.json();
      setPdfFileUrl(data.url);
      setPdfFileName(data.fileName || file.name);
      setPdfFileSize(data.fileSize || file.size);
    } catch (err: any) {
      console.error("PDF upload error:", err);
      setError(err.message || "Failed to upload PDF ebook");
    } finally {
      setUploadingPdf(false);
      setUploadProgress(null);
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
    <section className="rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-4 sm:p-7 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b border-[#e2dfd8] dark:border-[#222222] pb-4">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#26332f] dark:text-[#f4f4f5]">
            {isEdit ? "Edit ebook product" : "Create new ebook"}
          </h3>
          <p className="text-xs text-[#8b8175] dark:text-[#a1a1aa] mt-1">
            Fill in product info, pricing, cover image, and attach the real PDF ebook file.
          </p>
        </div>
        <button 
          type="button" 
          onClick={onCancel} 
          className="text-xs font-bold text-[#8b8175] dark:text-[#a1a1aa] hover:text-[#d86f45] transition"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-[#fef2f2] dark:bg-[#2e1010] p-3.5 text-sm font-semibold text-[#b91c1c] dark:text-[#f87171] border border-[#fecaca] dark:border-[#5c2424]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Core Details */}
        <div className="rounded-xl border border-[#e2dfd8] dark:border-[#222222] bg-white dark:bg-[#171717] p-4 sm:p-6 shadow-sm space-y-4">
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
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61] dark:text-[#a1a1aa]">Category</label>
              <select 
                value={category} 
                onChange={(e) => { 
                  setCategory(e.target.value); 
                  setCategorySlug(categories.find((c) => c.name === e.target.value)?.slug ?? ""); 
                }} 
                className="h-12 w-full rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 text-sm text-[#26332f] dark:text-[#f4f4f5] outline-none focus:border-[#d86f45]"
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
        <div className="rounded-xl border-2 border-[#e2dfd8] dark:border-[#222222] bg-white dark:bg-[#171717] p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="text-[#d86f45]" size={18} />
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#26332f] dark:text-[#f4f4f5]">
                  2. PDF Ebook Attachment
                </label>
              </div>
              <p className="text-xs text-[#8b8175] dark:text-[#a1a1aa] mt-1">
                Attach your PDF ebook file. Customers will receive this file immediately upon verified checkout.
              </p>
            </div>
            {pdfFileUrl && (
              <span className="inline-flex items-center gap-1 self-start sm:self-auto rounded-full bg-[#eef1eb] dark:bg-[#0f2415] px-3 py-1 text-[11px] font-bold text-[#5e8c67] dark:text-[#4ade80]">
                <FileCheck size={13} /> Ebook Ready
              </span>
            )}
          </div>

          {/* Mode Switcher */}
          <div className="mb-4 flex rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-[#f8f6f0] dark:bg-[#141414] p-1 gap-1">
            <button
              type="button"
              onClick={() => setPdfSourceMode("automatic")}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition ${
                pdfSourceMode === "automatic"
                  ? "bg-[#26332f] dark:bg-[#e58a61] text-[#fffaf2] shadow-sm"
                  : "text-[#736b61] dark:text-[#a1a1aa] hover:text-[#26332f] dark:hover:text-[#f4f4f5]"
              }`}
            >
              ⚡ Automatic (Upload PDF File)
            </button>
            <button
              type="button"
              onClick={() => setPdfSourceMode("manual")}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition ${
                pdfSourceMode === "manual"
                  ? "bg-[#26332f] dark:bg-[#e58a61] text-[#fffaf2] shadow-sm"
                  : "text-[#736b61] dark:text-[#a1a1aa] hover:text-[#26332f] dark:hover:text-[#f4f4f5]"
              }`}
            >
              🔗 Manual (Google Drive Link)
            </button>
          </div>

          {pdfFileUrl ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#b8c7b2] dark:border-[#222222] bg-[#f8f6f0] dark:bg-[#141414] p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d86f45] text-white shadow-sm">
                  <FileText size={22} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate text-[#26332f] dark:text-[#f4f4f5]">
                    {pdfFileName || "Ebook Guide.pdf"}
                  </p>
                  <p className="text-xs text-[#8b8175] dark:text-[#a1a1aa] mt-0.5 truncate max-w-md">
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-3.5 py-1.5 text-xs font-bold text-[#26332f] dark:text-[#f4f4f5] transition hover:bg-[#eee7dc] dark:hover:bg-[#222222]"
                >
                  <Eye size={13} /> Test / Open PDF
                </a>
                <button
                  type="button"
                  onClick={() => { setPdfFileUrl(""); setPdfFileName(""); setPdfFileSize(undefined); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#fca5a5] dark:border-[#5c2424] bg-[#fff5f5] dark:bg-[#2e1010] px-3.5 py-1.5 text-xs font-bold text-[#b91c1c] dark:text-[#f87171] transition hover:bg-[#fee2e2] dark:hover:bg-[#451818]"
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
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d8d0c6] dark:border-[#262626] bg-[#fcfbf9] dark:bg-[#141414] p-6 text-center cursor-pointer transition hover:border-[#d86f45] hover:bg-[#fffaf2] dark:hover:bg-[#1a1a1a]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eee7dc] dark:bg-[#222222] text-[#d86f45] mb-2">
                  {uploadingPdf ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
                </div>
                <span className="text-sm font-semibold text-[#26332f] dark:text-[#f4f4f5]">
                  {uploadingPdf 
                    ? `Uploading PDF ebook... ${uploadProgress !== null ? `${uploadProgress}%` : ""}` 
                    : "Click to select PDF file from your device"}
                </span>
                {uploadingPdf && uploadProgress !== null && (
                  <div className="my-2.5 w-full max-w-xs overflow-hidden rounded-full bg-[#e5ddd2] dark:bg-[#222222] h-2">
                    <div 
                      className="h-full bg-[#d86f45] transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                <span className="text-xs text-[#8b8175] dark:text-[#a1a1aa] mt-1">
                  Automatic chunked upload supports PDF ebooks up to 100MB
                </span>
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-[#fcfbf9] dark:bg-[#141414] p-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#736b61] dark:text-[#a1a1aa] mb-1">
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
                  className="h-12 w-full rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 text-sm text-[#26332f] dark:text-[#f4f4f5] outline-none focus:border-[#d86f45] placeholder:text-[#9d9387] dark:placeholder:text-[#52525b]"
                />
              </div>
              <p className="text-[11px] text-[#8b8175] dark:text-[#a1a1aa]">
                💡 Tip: Make sure your Google Drive file's general access is set to <strong>"Anyone with the link can view"</strong> so customers can download it directly.
              </p>
            </div>
          )}
        </div>

        {/* Card 3: Rating & Social Proof */}
        <div className="rounded-xl border border-[#e2dfd8] dark:border-[#222222] bg-white dark:bg-[#171717] p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d86f45]">3. Reader Rating & Reviews</p>
              <p className="text-xs text-[#8b8175] dark:text-[#a1a1aa] mt-1">Showcase real reader satisfaction metrics on storefront cards.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbfaf7] dark:bg-[#141414] border border-[#e2dfd8] dark:border-[#222222] px-3 py-1 text-xs font-bold text-[#26332f] dark:text-[#f4f4f5] self-start sm:self-auto">
              <Star size={13} fill="currentColor" className="text-[#e4a83d]" /> {rating || "4.9"} ({reviews || "0"} reviews)
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61] dark:text-[#a1a1aa]">
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
                  className="h-12 w-24 rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-3 text-sm font-semibold text-[#26332f] dark:text-[#f4f4f5] outline-none focus:border-[#d86f45]"
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
                          className={r >= starIndex ? "fill-[#e4a83d] text-[#e4a83d]" : "text-[#d8d0c6] dark:text-[#404040]"}
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
        <div className="rounded-xl border border-[#e2dfd8] dark:border-[#222222] bg-white dark:bg-[#171717] p-4 sm:p-6 shadow-sm space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d86f45]">4. Pricing & Specifications</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Price (NGN)" type="number" value={price} onChange={setPrice} required placeholder="5000" />
            <Input label="Old Price (NGN, Strike-through)" type="number" value={oldPrice} onChange={setOldPrice} placeholder="7500" />
            <Input label="Page Count" type="number" value={pages} onChange={setPages} placeholder="45" />
            <Input label="Format" value={format} onChange={setFormat} placeholder="PDF guide" />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61] dark:text-[#a1a1aa]">
              Key Benefits & Takeaways (One per line)
            </label>
            <textarea
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 py-3 text-sm text-[#26332f] dark:text-[#f4f4f5] outline-none focus:border-[#d86f45]"
              placeholder="Step-by-step frameworks&#10;Actionable templates&#10;Lifetime access"
            />
          </div>
        </div>

        {/* Card 5: Product Cover Photo */}
        <div className="rounded-xl border border-[#e2dfd8] dark:border-[#222222] bg-white dark:bg-[#171717] p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d86f45]">5. Product Cover Photo</p>
              <p className="text-xs text-[#8b8175] dark:text-[#a1a1aa] mt-1">Upload a cover image from your device or paste a photo link.</p>
            </div>
            {imageUrl && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eef1eb] dark:bg-[#0f2415] px-3 py-1 text-[11px] font-bold text-[#5e8c67] dark:text-[#4ade80]">
                <FileCheck size={13} /> Cover Selected
              </span>
            )}
          </div>

          {imageUrl ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-[#b8c7b2] dark:border-[#222222] bg-[#f8f6f0] dark:bg-[#141414] p-4">
              <img
                src={imageUrl}
                alt="Cover Preview"
                className="h-28 w-20 object-cover rounded-lg shadow-sm border border-[#d8d0c6] dark:border-[#262626]"
              />
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-sm font-bold text-[#26332f] dark:text-[#f4f4f5]">Cover Image Attached</p>
                <p className="text-xs text-[#8b8175] dark:text-[#a1a1aa] mt-0.5 truncate max-w-md">
                  {imageUrl.startsWith("data:") ? "Image loaded from computer (ready to publish)" : imageUrl}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#fca5a5] dark:border-[#5c2424] bg-[#fff5f5] dark:bg-[#2e1010] px-3.5 py-1.5 text-xs font-bold text-[#b91c1c] dark:text-[#f87171] transition hover:bg-[#fee2e2] dark:hover:bg-[#451818]"
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
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d8d0c6] dark:border-[#262626] bg-[#fcfbf9] dark:bg-[#141414] p-5 text-center cursor-pointer transition hover:border-[#d86f45] hover:bg-[#fffaf2] dark:hover:bg-[#1a1a1a]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eee7dc] dark:bg-[#222222] text-[#d86f45] mb-2">
                  {uploadingImage ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                </div>
                <span className="text-sm font-semibold text-[#26332f] dark:text-[#f4f4f5]">
                  {uploadingImage ? "Processing cover photo..." : "Click to select cover photo from your device"}
                </span>
                <span className="text-xs text-[#8b8175] dark:text-[#a1a1aa] mt-0.5">
                  Supports JPG, PNG, or WebP
                </span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8b8175] dark:text-[#a1a1aa] whitespace-nowrap">Or Image URL:</span>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-10 flex-1 rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-3 text-xs text-[#26332f] dark:text-[#f4f4f5] outline-none focus:border-[#d86f45]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Card 6: Badges & Display Toggles */}
        <div className="rounded-xl border border-[#e2dfd8] dark:border-[#222222] bg-white dark:bg-[#171717] p-4 sm:p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d86f45] mb-3">6. Storefront Badges</p>
          <div className="flex flex-wrap items-center gap-6">
            <Checkbox label="Featured on Home" checked={featured} onChange={setFeatured} />
            <Checkbox label="Bestseller Badge" checked={bestseller} onChange={setBestseller} />
            <Checkbox label="New Release Badge" checked={isNew} onChange={setIsNew} />
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2dfd8] dark:border-[#222222]">
          <button 
            type="button" 
            onClick={onCancel} 
            className="rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-5 py-2.5 text-xs font-bold text-[#736b61] dark:text-[#a1a1aa] hover:bg-[#eee7dc] dark:hover:bg-[#222222] transition"
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
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b8175] dark:text-[#a1a1aa]" />
          <input
            type="text"
            placeholder="Search customers by name, email, or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] pl-10 pr-4 text-xs sm:text-sm text-[#26332f] dark:text-[#f4f4f5] outline-none focus:border-[#d86f45] shadow-sm placeholder:text-[#9d9387] dark:placeholder:text-[#52525b]"
          />
        </div>
        <p className="text-xs font-semibold text-[#8b8175] dark:text-[#a1a1aa]">
          Total: {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Customer List */}
      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] shadow-sm">
        <div className="divide-y divide-[#e2dfd8] dark:divide-[#222222]">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center gap-3.5 p-4 sm:p-5 hover:bg-white/60 dark:hover:bg-white/5 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eee7dc] dark:bg-[#262626] text-xs font-bold text-[#d86f45] shadow-sm">
                {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-sm text-[#26332f] dark:text-[#f4f4f5]">{c.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    c.status === "Active" ? "bg-[#eef1eb] dark:bg-[#0f2415] text-[#5e8c67] dark:text-[#4ade80]" : "bg-[#faedc9] dark:bg-[#291e0a] text-[#9d7922] dark:text-[#facc15]"
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[#8b8175] dark:text-[#a1a1aa]">
                  {c.email} · {c.country || "Global"} · {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs sm:text-sm font-bold text-[#26332f] dark:text-[#f4f4f5]">
                  {formatCurrency(c.totalSpent, currency)}
                </span>
                <p className="text-[10px] text-[#8b8175] dark:text-[#a1a1aa]">Total spent</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-6 py-14 text-center text-sm text-[#8b8175] dark:text-[#a1a1aa]">No customers found.</div>
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
      <section className="rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-5 sm:p-7 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175] dark:text-[#a1a1aa]">Global Distribution</p>
        <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-[#26332f] dark:text-[#f4f4f5]">Revenue by country</h3>
        
        <div className="mt-6 space-y-4">
          {countryEntries.map(([country, rev]) => (
            <div key={country}>
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                <span className="font-semibold text-[#26332f] dark:text-[#f4f4f5]">{country}</span>
                <span className="text-[#8b8175] dark:text-[#a1a1aa]">
                  {Math.round((rev / totalCountryRev) * 100)}% · {formatCurrency(rev, currency)}
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-[#eae7e0] dark:bg-[#262626] overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#d86f45] transition-all duration-500" 
                  style={{ width: `${(rev / totalCountryRev) * 100}%` }} 
                />
              </div>
            </div>
          ))}
          {countryEntries.length === 0 && (
            <p className="text-xs text-[#8b8175] dark:text-[#a1a1aa] py-6 text-center">No regional sales data available yet.</p>
          )}
        </div>
      </section>

      {/* Retention Metrics */}
      <div className="space-y-5">
        <section className="rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-5 sm:p-7 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175] dark:text-[#a1a1aa]">Retention</p>
          <h3 className="mt-1 font-serif text-xl font-bold text-[#26332f] dark:text-[#f4f4f5]">Repeat Customers</h3>
          <p className="mt-3 font-serif text-4xl font-bold text-[#26332f] dark:text-[#f4f4f5]">{analytics.repeatCustomerRate}%</p>
          <p className="mt-1.5 text-xs text-[#8b8175] dark:text-[#a1a1aa]">Percentage of customers who purchased 2 or more ebooks.</p>
        </section>

        <section className="rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-5 sm:p-7 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175] dark:text-[#a1a1aa]">Category Leader</p>
          <h3 className="mt-1 font-serif text-xl font-bold text-[#26332f] dark:text-[#f4f4f5]">Top Ebook Category</h3>
          <p className="mt-3 font-serif text-3xl font-bold text-[#26332f] dark:text-[#f4f4f5]">{analytics.topCategory || "General"}</p>
          <p className="mt-1.5 text-xs text-[#8b8175] dark:text-[#a1a1aa]">Best performing digital category by total sales volume.</p>
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

      <section className="overflow-hidden rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] shadow-sm">
        <div className="divide-y divide-[#eae7e0] dark:divide-[#222222]">
          {promotions.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-4 sm:p-5 hover:bg-white/60 dark:hover:bg-white/5 transition">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-sm sm:text-base text-[#26332f] dark:text-[#f4f4f5]">{p.title}</p>
                  <span className="rounded-full bg-[#faedc9] dark:bg-[#291e0a] px-2.5 py-0.5 text-[10px] font-bold text-[#ad842a] dark:text-[#facc15]">
                    {p.discountPercent}% OFF
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-[#8b8175] dark:text-[#a1a1aa]">
                  {p.description} · Valid {p.startDate} to {p.endDate}
                </p>
              </div>
              <span className={`hidden sm:inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                p.status === "Active" ? "bg-[#eef1eb] dark:bg-[#0f2415] text-[#5e8c67] dark:text-[#4ade80]" : 
                p.status === "Draft" ? "bg-[#faedc9] dark:bg-[#291e0a] text-[#9d7922] dark:text-[#facc15]" : 
                "bg-[#eae7e0] dark:bg-[#262626] text-[#8b8175] dark:text-[#a1a1aa]"
              }`}>
                {p.status}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditPromo(p)} className="p-1.5 text-[#8b8175] dark:text-[#a1a1aa] hover:text-[#d86f45]" aria-label="Edit promotion">
                  <Pencil size={15} />
                </button>
                <button onClick={() => deletePromo(p.id)} className="p-1.5 text-[#8b8175] dark:text-[#a1a1aa] hover:text-[#b91c1c]" aria-label="Delete promotion">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {promotions.length === 0 && (
            <div className="px-6 py-14 text-center text-sm text-[#8b8175] dark:text-[#a1a1aa]">No promotional campaigns active.</div>
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
    <section className="rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-4 sm:p-7 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b border-[#e2dfd8] dark:border-[#222222] pb-4">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#26332f] dark:text-[#f4f4f5]">
          {isEdit ? "Edit promotion" : "New promotion"}
        </h3>
        <button onClick={onCancel} className="text-xs font-bold text-[#8b8175] dark:text-[#a1a1aa] hover:text-[#d86f45]">Cancel</button>
      </div>
      {error && <div className="mb-5 rounded-xl bg-[#fef2f2] dark:bg-[#2e1010] p-3 text-sm font-semibold text-[#b91c1c] dark:text-[#f87171]">{error}</div>}
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input label="Campaign Title" value={title} onChange={setTitle} required placeholder="e.g. Black Friday 2026" />
        <Input label="Discount %" value={discountPercent} onChange={setDiscountPercent} type="number" required placeholder="20" />
        <div className="sm:col-span-2">
          <Input label="Description" value={description} onChange={setDescription} placeholder="Special discount code banner" />
        </div>
        <Input label="Start Date" value={startDate} onChange={setStartDate} type="date" required />
        <Input label="End Date" value={endDate} onChange={setEndDate} type="date" required />
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61] dark:text-[#a1a1aa]">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Promotion["status"])} className="h-12 w-full rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 text-sm text-[#26332f] dark:text-[#f4f4f5] outline-none focus:border-[#d86f45]">
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
        <div className="sm:col-span-2 pt-3 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-5 py-2.5 text-xs font-bold text-[#736b61] dark:text-[#a1a1aa]">Cancel</button>
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
interface SettingsSectionProps {
  notifEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  testNotification: () => void;
}

function SettingsSection({ notifEnabled, toggleNotifications, testNotification }: SettingsSectionProps) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [downloadMode, setDownloadMode] = useState<"instant" | "email">("instant");
  const [storeCurrency, setStoreCurrency] = useState<Currency>("NGN");
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>("paystack");

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
        setPaymentGateway((data.settings.paymentGateway as PaymentGateway) || "paystack");
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (customGateway?: PaymentGateway) => {
    setSaving(true);
    const activeGateway = customGateway || paymentGateway;
    try {
      const data = await apiFetch<SettingsResponse>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ 
          storeName, 
          supportEmail, 
          downloadMode, 
          currency: storeCurrency,
          paymentGateway: activeGateway 
        }),
      });
      setSettings(data.settings);
      if (customGateway) {
        setPaymentGateway(customGateway);
      }
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
      {/* Payment Gateway Mode Selector */}
      <section className="rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d86f45]">Payment Gateway Mode</p>
            <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-[#26332f] dark:text-[#f4f4f5]">Active Payment Processor</h3>
            <p className="mt-1 max-w-xl text-xs text-[#8b8175] dark:text-[#a1a1aa]">
              Choose which payment gateway processes checkout transactions on your storefront. Both live keys are active and verified.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-[#ecfdf5] dark:bg-[#0f2415] border border-[#a7f3d0] dark:border-[#1e4d2b] px-3.5 py-1 text-xs font-bold text-[#059669] dark:text-[#4ade80]">
            <Check size={13} /> Active: {paymentGateway === "flutterwave" ? "Flutterwave Live" : "Paystack Live"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Paystack Card */}
          <div 
            onClick={() => setPaymentGateway("paystack")}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
              paymentGateway === "paystack" 
                ? "border-[#26332f] dark:border-[#f4f4f5] bg-white dark:bg-[#18181b] shadow-md" 
                : "border-[#e5ddd2] dark:border-[#262626] bg-[#f8f4ec]/60 dark:bg-[#141414] hover:border-[#d8d0c6] dark:hover:border-[#383838]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 items-center rounded-xl border border-[#e5ddd2] bg-white px-3 py-1 shadow-sm">
                  <img src="/paystack-logo.png" alt="Paystack" className="h-6 w-auto max-w-[130px] object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-[#26332f] dark:text-[#f4f4f5] text-base">Paystack</h4>
                  <p className="text-[11px] text-[#8b8175] dark:text-[#a1a1aa]">Direct card, bank transfer, USSD & Apple Pay</p>
                </div>
              </div>
              <input 
                type="radio" 
                name="paymentGateway" 
                checked={paymentGateway === "paystack"} 
                onChange={() => setPaymentGateway("paystack")}
                className="mt-1 h-4 w-4 text-[#d86f45] focus:ring-[#d86f45]" 
              />
            </div>
            <div className="mt-4 pt-3 border-t border-[#eae7e0] dark:border-[#222222] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-[#736b61] dark:text-[#a1a1aa]">Supports: NGN, USD, GHS, ZAR, KES</span>
              <span className="rounded-full bg-[#f0bc58]/20 dark:bg-[#f0bc58]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#9b6e14] dark:text-[#facc15]">
                Live Keys Connected
              </span>
            </div>
          </div>

          {/* Flutterwave Card */}
          <div 
            onClick={() => setPaymentGateway("flutterwave")}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
              paymentGateway === "flutterwave" 
                ? "border-[#26332f] dark:border-[#f4f4f5] bg-white dark:bg-[#18181b] shadow-md" 
                : "border-[#e5ddd2] dark:border-[#262626] bg-[#f8f4ec]/60 dark:bg-[#141414] hover:border-[#d8d0c6] dark:hover:border-[#383838]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 items-center rounded-xl border border-[#e5ddd2] bg-white px-3 py-1 shadow-sm">
                  <img src="/flutterwave-logo.png" alt="Flutterwave" className="h-6 w-auto max-w-[130px] object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-[#26332f] dark:text-[#f4f4f5] text-base">Flutterwave</h4>
                  <p className="text-[11px] text-[#8b8175] dark:text-[#a1a1aa]">Global multi-currency, cards, mobile money & USSD</p>
                </div>
              </div>
              <input 
                type="radio" 
                name="paymentGateway" 
                checked={paymentGateway === "flutterwave"} 
                onChange={() => setPaymentGateway("flutterwave")}
                className="mt-1 h-4 w-4 text-[#d86f45] focus:ring-[#d86f45]" 
              />
            </div>
            <div className="mt-4 pt-3 border-t border-[#eae7e0] dark:border-[#222222] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-[#736b61] dark:text-[#a1a1aa]">Supports: 15+ African & Global Currencies</span>
              <span className="rounded-full bg-[#f0bc58]/20 dark:bg-[#f0bc58]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#9b6e14] dark:text-[#facc15]">
                Live Keys Connected
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button 
            onClick={() => save()} 
            disabled={saving} 
            className="flex items-center gap-2 rounded-xl bg-[#26332f] dark:bg-white dark:text-[#18181b] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60 shadow-sm hover:bg-[#384843] dark:hover:bg-[#e4e4e7] transition"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Active Gateway
          </button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Store Defaults */}
        <section className="rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-5 sm:p-7 shadow-sm space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d86f45]">Store Defaults</p>
            <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-[#26332f] dark:text-[#f4f4f5]">Store Information</h3>
          </div>

          <div className="space-y-4">
            <Input label="Store Name" value={storeName} onChange={setStoreName} />
            <Input label="Support Email" value={supportEmail} onChange={setSupportEmail} type="email" />
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61] dark:text-[#a1a1aa]">Default Currency</label>
              <select 
                value={storeCurrency} 
                onChange={(e) => setStoreCurrency(e.target.value as Currency)} 
                className="h-12 w-full rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 text-sm text-[#26332f] dark:text-[#f4f4f5] outline-none focus:border-[#d86f45]"
              >
                {currencyOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.symbol} {option.label} ({option.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61] dark:text-[#a1a1aa]">Download Access</label>
              <select 
                value={downloadMode} 
                onChange={(e) => setDownloadMode(e.target.value as "instant" | "email")} 
                className="h-12 w-full rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 text-sm text-[#26332f] dark:text-[#f4f4f5] outline-none focus:border-[#d86f45]"
              >
                <option value="instant">Instant download after payment</option>
                <option value="email">Email delivery link</option>
              </select>
            </div>
            <button 
              onClick={() => save()} 
              disabled={saving} 
              className="flex items-center gap-2 rounded-xl bg-[#d86f45] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60 shadow-sm hover:bg-[#bf5937] transition"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save settings
            </button>
          </div>
        </section>

        {/* Current Active Configuration */}
        <section className="rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-5 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8175] dark:text-[#a1a1aa]">Configuration Summary</p>
            <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-[#26332f] dark:text-[#f4f4f5]">Active Store Setup</h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-white dark:bg-[#171717] border border-[#eae7e0] dark:border-[#222222] p-3.5">
                <p className="text-xs text-[#8b8175] dark:text-[#a1a1aa]">Store Name</p>
                <p className="mt-0.5 font-bold text-[#26332f] dark:text-[#f4f4f5]">{settings?.storeName ?? "ApexMindReads"}</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-[#171717] border border-[#eae7e0] dark:border-[#222222] p-3.5">
                <p className="text-xs text-[#8b8175] dark:text-[#a1a1aa]">Support Email</p>
                <p className="mt-0.5 font-bold text-[#26332f] dark:text-[#f4f4f5]">{settings?.supportEmail ?? "support@apexmindreads.com"}</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-[#171717] border border-[#eae7e0] dark:border-[#222222] p-3.5">
                <p className="text-xs text-[#8b8175] dark:text-[#a1a1aa]">Default Currency</p>
                <p className="mt-0.5 font-bold text-[#26332f] dark:text-[#f4f4f5]">{settings?.currency ?? "NGN"}</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-[#171717] border border-[#eae7e0] dark:border-[#222222] p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#8b8175] dark:text-[#a1a1aa]">Active Payment Gateway</p>
                  <p className="mt-0.5 font-bold text-[#26332f] dark:text-[#f4f4f5] flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${paymentGateway === "flutterwave" ? "bg-[#fb9129]" : "bg-[#00c3f7]"}`} />
                    {paymentGateway === "flutterwave" ? "Flutterwave" : "Paystack"}
                  </p>
                </div>
                <div className="flex h-8 items-center rounded-lg border border-[#e5ddd2] bg-white px-2.5 shadow-sm">
                  <img 
                    src={paymentGateway === "flutterwave" ? "/flutterwave-logo.png" : "/paystack-logo.png"} 
                    alt={paymentGateway} 
                    className="h-4 w-auto max-w-[90px] object-contain" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#eae7e0] dark:border-[#222222] flex items-center gap-2 text-xs text-[#5e8c67] dark:text-[#4ade80] font-semibold">
            <ShieldCheck size={16} /> Store secure & {paymentGateway === "flutterwave" ? "Flutterwave Live" : "Paystack Live"} connected
          </div>
        </section>
      </div>

      {/* Real-Time Sales Push Alerts & Audio Notifications */}
      <section className="rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d86f45]">Live Alerts</p>
            <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-[#26332f] dark:text-[#f4f4f5]">Real-Time Sales & Sound Notifications</h3>
            <p className="mt-1 max-w-xl text-xs text-[#8b8175] dark:text-[#a1a1aa]">
              Get instant cash register sound alerts and notifications with customer name and order amount whenever a sale occurs.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#eae7e0] dark:border-[#222222] bg-white dark:bg-[#171717] p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#26332f] dark:text-[#f4f4f5]">Real-Time Push Alerts</p>
              <p className="text-[11px] text-[#8b8175] dark:text-[#a1a1aa] mt-0.5">
                {notifEnabled ? "Active on this device" : "Disabled on this device"}
              </p>
            </div>
            <button
              onClick={toggleNotifications}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                notifEnabled ? "bg-[#eef1eb] dark:bg-[#0f2415] text-[#5e8c67] dark:text-[#4ade80]" : "bg-[#f5f3ee] dark:bg-[#262626] text-[#736b61] dark:text-[#d4d4d8] hover:bg-[#e2dfd8] dark:hover:bg-[#333333]"
              }`}
            >
              {notifEnabled ? "Active ✓" : "Enable Alerts"}
            </button>
          </div>

          <div className="rounded-xl border border-[#eae7e0] dark:border-[#222222] bg-white dark:bg-[#171717] p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#26332f] dark:text-[#f4f4f5]">Notification Sound & Vibration</p>
              <p className="text-[11px] text-[#8b8175] dark:text-[#a1a1aa] mt-0.5">Cash register "Ka-Ching" sound effect</p>
            </div>
            <button
              onClick={testNotification}
              className="rounded-full bg-[#faedc9] dark:bg-[#291e0a] px-3.5 py-1.5 text-xs font-bold text-[#ad842a] dark:text-[#facc15] hover:bg-[#f6e4b4] dark:hover:bg-[#3d2e11] transition flex items-center gap-1.5"
            >
              <Volume2 size={13} /> Test Sound
            </button>
          </div>
        </div>
      </section>

      {/* Admin Credentials Security Card */}
      <section className="rounded-2xl border border-[#e2dfd8] dark:border-[#222222] bg-[#fbfaf7] dark:bg-[#121212] p-5 sm:p-7 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d86f45]">Security</p>
        <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-[#26332f] dark:text-[#f4f4f5]">Admin Login Credentials</h3>
        <p className="mt-1 max-w-xl text-xs text-[#8b8175] dark:text-[#a1a1aa]">Update your admin email address or password.</p>
        
        {credSuccess && <div className="mt-4 max-w-md rounded-xl bg-[#ecfdf5] dark:bg-[#0f2415] border border-[#a7f3d0] dark:border-[#1e4d2b] p-3 text-xs font-semibold text-[#059669] dark:text-[#4ade80]">{credSuccess}</div>}
        {credError && <div className="mt-4 max-w-md rounded-xl bg-[#fef2f2] dark:bg-[#2e1010] border border-[#fecaca] dark:border-[#5c2424] p-3 text-xs font-semibold text-[#b91c1c] dark:text-[#f87171]">{credError}</div>}

        <div className="mt-5 max-w-md space-y-4">
          <Input label="Admin Email" value={adminEmail} onChange={setAdminEmail} type="email" placeholder="Leave blank to keep current" />
          <Input label="New Password" value={adminPassword} onChange={setAdminPassword} type="password" placeholder="Leave blank to keep current" />
          
          <button 
            onClick={updateCredentials} 
            disabled={credSaving} 
            className="flex items-center gap-2 rounded-xl bg-[#26332f] dark:bg-[#e58a61] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60 hover:bg-[#3b4b45] dark:hover:bg-[#d86f45] transition shadow-sm"
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
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61] dark:text-[#a1a1aa]">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        required={required} 
        placeholder={placeholder} 
        className="h-12 w-full rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 text-sm text-[#26332f] dark:text-[#f4f4f5] outline-none focus:border-[#d86f45] shadow-xs placeholder:text-[#9d9387] dark:placeholder:text-[#52525b]" 
      />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="block">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61] dark:text-[#a1a1aa]">{label}</label>
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        rows={4} 
        className="w-full rounded-xl border border-[#d8d0c6] dark:border-[#262626] bg-white dark:bg-[#171717] px-4 py-3 text-sm text-[#26332f] dark:text-[#f4f4f5] outline-none focus:border-[#d86f45] shadow-xs" 
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
      <span className="text-xs sm:text-sm font-semibold text-[#26332f] dark:text-[#f4f4f5]">{label}</span>
    </label>
  );
}
