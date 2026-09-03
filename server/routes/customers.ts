import type { RequestHandler } from "express";
import { getOrders } from "../data/db.js";
import { adminAuth } from "../lib/firebase-admin.js";
import type { CustomerView } from "../../shared/schema";

let cachedAuthUsers: any[] = [];
let lastUsersSyncTime = 0;
let isFetchingUsers = false;

async function syncUsersFromFirebase() {
  if (isFetchingUsers) return;
  isFetchingUsers = true;
  try {
    const listUsersPromise = adminAuth.listUsers(1000);
    const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 1200));
    const result = await Promise.race([listUsersPromise, timeoutPromise]);
    if (result && Array.isArray(result.users)) {
      cachedAuthUsers = result.users;
      lastUsersSyncTime = Date.now();
    }
  } catch {
    // ignore
  } finally {
    isFetchingUsers = false;
  }
}

/** GET /api/admin/customers — admin only */
export const handleListCustomers: RequestHandler = async (_req, res) => {
  try {
    const orders = await getOrders();
    const customerMap = new Map<string, CustomerView>();

    for (const order of orders) {
      const key = order.customerEmail.toLowerCase();
      const existing = customerMap.get(key);

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
        if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.createdAt;
          existing.country = order.country;
        }
        existing.status = existing.orderCount >= 2 ? "Active" : "New";
      } else {
        customerMap.set(key, {
          id: key,
          email: order.customerEmail,
          name: order.customerName,
          country: order.country,
          orderCount: 1,
          totalSpent: order.total,
          lastOrderDate: order.createdAt,
          status: "New",
        });
      }
    }

    // Include registered users (instant cache + background SWR)
    if (lastUsersSyncTime === 0) {
      await syncUsersFromFirebase();
    } else if (Date.now() - lastUsersSyncTime > 30000) {
      syncUsersFromFirebase().catch(() => {});
    }

    for (const user of cachedAuthUsers) {
      if (user && user.email) {
        const key = user.email.toLowerCase();
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: key,
            email: user.email,
            name: user.displayName || user.email.split("@")[0],
            country: "—",
            orderCount: 0,
            totalSpent: 0,
            lastOrderDate: user.metadata?.creationTime || new Date().toISOString(),
            status: "New",
          });
        }
      }
    }

    const customers = [...customerMap.values()].sort((a, b) => b.totalSpent - a.totalSpent);
    res.json({ customers });
  } catch (err: any) {
    console.error("Failed to fetch customers:", err);
    res.status(500).json({ error: err.message || "Failed to fetch customers" });
  }
};
