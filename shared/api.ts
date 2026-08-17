/**
 * Shared API types between client and server.
 */

import type { Product, Order, CustomerView, Promotion, StoreSettings } from "./schema";

export type { Product, Order, CustomerView, Promotion, StoreSettings };

// ─── Auth ────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string };
}

export interface MeResponse {
  user: { id: string; email: string; name: string };
}

export interface AdminAuthResponse {
  token: string;
  admin: { id: string; email: string; name: string };
}

export interface AdminMeResponse {
  admin: { id: string; email: string; name: string };
}

// ─── Products ────────────────────────────────────────────
export interface ProductListResponse {
  products: Product[];
}

export interface ProductResponse {
  product: Product;
}

// ─── Orders ──────────────────────────────────────────────
export interface OrderListResponse {
  orders: Order[];
}

export interface OrderResponse {
  order: Order;
}

// ─── Paystack ────────────────────────────────────────────
export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyResponse {
  ok: boolean;
  order: Order;
  downloadUrls?: { productId: string; title: string; downloadUrl: string }[];
}

// ─── Customers ───────────────────────────────────────────
export interface CustomerListResponse {
  customers: CustomerView[];
}

// ─── Promotions ──────────────────────────────────────────
export interface PromotionListResponse {
  promotions: Promotion[];
}

export interface PromotionResponse {
  promotion: Promotion;
}

// ─── Analytics ───────────────────────────────────────────
export interface AnalyticsResponse {
  totalRevenue: number;
  paidOrders: number;
  totalCustomers: number;
  averageOrder: number;
  revenueByCountry: Record<string, number>;
  repeatCustomerRate: number;
  topCategory: string;
  revenueOverTime: { date: string; revenue: number }[];
  topProducts: { productId: string; title: string; sales: number; revenue: number }[];
}

// ─── Settings ────────────────────────────────────────────
export interface SettingsResponse {
  settings: StoreSettings;
}

// ─── Generic ─────────────────────────────────────────────
export interface ApiError {
  error: string;
}

export interface ApiSuccess {
  message: string;
}

// Legacy demo type
export interface DemoResponse {
  message: string;
}
