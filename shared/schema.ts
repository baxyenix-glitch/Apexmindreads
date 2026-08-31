import { z } from "zod/v4";

// ─── Cover art ───────────────────────────────────────────
export const CoverSchema = z.object({
  kicker: z.string(),
  title: z.string(),
  subtitle: z.string(),
  author: z.string(),
  tone: z.string(),
  accent: z.string(),
  pattern: z.enum(["grid", "sun", "lines", "circle"]),
});

// ─── Product ─────────────────────────────────────────────
export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  eyebrow: z.string(),
  description: z.string(),
  longDescription: z.string(),
  category: z.string(),
  categorySlug: z.string(),
  price: z.number(),
  oldPrice: z.number().optional(),
  rating: z.number(),
  reviews: z.number(),
  pages: z.number(),
  format: z.string(),
  featured: z.boolean().optional(),
  bestseller: z.boolean().optional(),
  isNew: z.boolean().optional(),
  benefits: z.array(z.string()),
  cover: CoverSchema,
  imageUrl: z.string().optional(),
  pdfFileUrl: z.string().optional(),
  pdfFileName: z.string().optional(),
  pdfFileSize: z.number().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

// ─── Auth user (storefront customer) ─────────────────────
export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  passwordHash: z.string(),
  createdAt: z.string(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

// ─── Admin user ──────────────────────────────────────────
export const AdminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  passwordHash: z.string(),
});

export type AdminUser = z.infer<typeof AdminUserSchema>;

// ─── Order ───────────────────────────────────────────────
export const OrderItemSchema = z.object({
  productId: z.string(),
  title: z.string(),
  price: z.number(),
});

export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  customerEmail: z.string().email(),
  customerName: z.string(),
  country: z.string(),
  items: z.array(OrderItemSchema),
  total: z.number(),
  status: z.enum(["Pending", "Paid", "Refunded"]),
  paymentReference: z.string().optional(),
  paymentGateway: z.string().optional(),
  paidAt: z.string().optional(),
  createdAt: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;

// ─── Customer (derived view) ─────────────────────────────
export const CustomerViewSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  country: z.string(),
  orderCount: z.number(),
  totalSpent: z.number(),
  lastOrderDate: z.string(),
  status: z.enum(["Active", "New"]),
});

export type CustomerView = z.infer<typeof CustomerViewSchema>;

// ─── Promotion ───────────────────────────────────────────
export const PromotionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  discountPercent: z.number().min(1).max(100),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(["Active", "Draft", "Expired"]),
  createdAt: z.string(),
});

export type Promotion = z.infer<typeof PromotionSchema>;

// ─── Store settings ──────────────────────────────────────
export const PaymentGatewaySchema = z.enum(["paystack", "flutterwave"]);
export type PaymentGateway = z.infer<typeof PaymentGatewaySchema>;

export const StoreSettingsSchema = z.object({
  storeName: z.string(),
  supportEmail: z.string().email(),
  downloadMode: z.enum(["instant", "email"]),
  currency: z.string(),
  paymentGateway: PaymentGatewaySchema.default("paystack"),
});

export type StoreSettings = z.infer<typeof StoreSettingsSchema>;

// ─── Database shape ──────────────────────────────────────
export const DatabaseSchema = z.object({
  products: z.array(ProductSchema),
  users: z.array(AuthUserSchema),
  admins: z.array(AdminUserSchema),
  orders: z.array(OrderSchema),
  promotions: z.array(PromotionSchema),
  settings: StoreSettingsSchema,
  sessions: z.record(z.string(), z.string()), // token → userId
  adminSessions: z.record(z.string(), z.string()), // token → adminId
});

export type Database = z.infer<typeof DatabaseSchema>;

// ─── API input schemas ───────────────────────────────────
export const RegisterInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
});

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const CreateProductInputSchema = ProductSchema.omit({ id: true });

export const UpdateProductInputSchema = ProductSchema.partial().omit({ id: true });

export const CreateOrderInputSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  country: z.string().min(1),
  items: z.array(OrderItemSchema).min(1),
});

export const CreatePromotionInputSchema = PromotionSchema.omit({ id: true, createdAt: true });

export const UpdatePromotionInputSchema = PromotionSchema.partial().omit({ id: true, createdAt: true });

export const UpdateSettingsInputSchema = StoreSettingsSchema.partial();
