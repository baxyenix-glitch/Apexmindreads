import type { RequestHandler } from "express";
import { getOrders } from "../data/db";
import { adminAuth } from "../lib/firebase-admin";
import type { CustomerView } from "../../shared/schema";

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

    // Also include registered users who haven't ordered yet
    try {
      let pageToken;
      do {
        const result = await adminAuth.listUsers(1000, pageToken);
        for (const user of result.users) {
          if (user.email) {
            const key = user.email.toLowerCase();
            if (!customerMap.has(key)) {
              customerMap.set(key, {
                id: key,
                email: user.email,
                name: user.displayName || user.email.split("@")[0],
                country: "—",
                orderCount: 0,
                totalSpent: 0,
                lastOrderDate: user.metadata.creationTime || new Date().toISOString(),
                status: "New",
              });
            }
          }
        }
        pageToken = result.pageToken;
      } while (pageToken);
    } catch (err) {
      console.error("Failed to list users from Firebase Auth", err);
    }

    const customers = [...customerMap.values()].sort((a, b) => b.totalSpent - a.totalSpent);
    res.json({ customers });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
};
