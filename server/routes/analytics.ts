import type { RequestHandler } from "express";
import { getOrders, getProducts } from "../data/db.js";

/** GET /api/admin/analytics */
export const handleAnalytics: RequestHandler = async (_req, res) => {
  try {
    const orders = await getOrders();
    const products = await getProducts();
    const paidOrders = orders.filter((o) => o.status === "Paid");

    // Total revenue
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

    // Paid order count
    const paidOrderCount = paidOrders.length;

    // Unique customers
    const uniqueEmails = new Set(orders.map((o) => o.customerEmail.toLowerCase()));
    const totalCustomers = uniqueEmails.size;

    // Average order value
    const averageOrder = paidOrderCount > 0 ? Math.round(totalRevenue / paidOrderCount) : 0;

    // Revenue by country
    const revenueByCountry: Record<string, number> = {};
    for (const order of paidOrders) {
      revenueByCountry[order.country] = (revenueByCountry[order.country] ?? 0) + order.total;
    }

    // Repeat customer rate
    const emailCounts = new Map<string, number>();
    for (const order of orders) {
      const email = order.customerEmail.toLowerCase();
      emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
    }
    const repeatCount = [...emailCounts.values()].filter((c) => c >= 2).length;
    const repeatCustomerRate = uniqueEmails.size > 0 ? Math.round((repeatCount / uniqueEmails.size) * 100) : 0;

    // Top category
    const categorySales: Record<string, number> = {};
    for (const order of paidOrders) {
      for (const item of order.items) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          categorySales[product.category] = (categorySales[product.category] ?? 0) + item.price;
        }
      }
    }
    const topCategory = Object.entries(categorySales).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    // Revenue over time (by day, last 30 days)
    const now = Date.now();
    const revenueByDay = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 86400000).toISOString().slice(0, 10);
      revenueByDay.set(date, 0);
    }
    for (const order of paidOrders) {
      const date = order.createdAt.slice(0, 10);
      if (revenueByDay.has(date)) {
        revenueByDay.set(date, revenueByDay.get(date)! + order.total);
      }
    }
    const revenueOverTime = [...revenueByDay.entries()].map(([date, revenue]) => ({ date, revenue }));

    // Top products
    const productSales: Record<string, { title: string; sales: number; revenue: number }> = {};
    for (const order of paidOrders) {
      for (const item of order.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { title: item.title, sales: 0, revenue: 0 };
        }
        productSales[item.productId].sales += 1;
        productSales[item.productId].revenue += item.price;
      }
    }
    const topProducts = Object.entries(productSales)
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      totalRevenue,
      paidOrders: paidOrderCount,
      totalCustomers,
      averageOrder,
      revenueByCountry,
      repeatCustomerRate,
      topCategory,
      revenueOverTime,
      topProducts,
    });
  } catch (err: any) {
    console.error("Failed to fetch analytics:", err);
    res.status(500).json({ error: err.message || "Failed to fetch analytics" });
  }
};
