import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Placeholder from "./pages/Placeholder";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import TermsOfService from "./pages/TermsOfService";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import MyOrders from "./pages/MyOrders";
import { CurrencyProvider } from "@/lib/currency";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { AdminAuthProvider, RequireAdmin } from "@/lib/admin-auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <CurrencyProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/refunds" element={<RefundPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/contact" element={<Placeholder title="Contact Us" />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="/admin/:section" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </CurrencyProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
