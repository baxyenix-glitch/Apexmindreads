import type { RequestHandler } from "express";
import { getOrders, getOrderById, updateOrder, createOrder, getUserOrders } from "../data/db";
import { CreateOrderInputSchema } from "../../shared/schema";
import { adminAuth } from "../lib/firebase-admin";

/** GET /api/admin/orders — admin only */
export const handleListOrders: RequestHandler = async (_req, res) => {
  try {
    const orders = await getOrders();
    res.json({ orders });
  } catch (err: any) {
    console.error("Failed to list orders:", err);
    res.status(500).json({ error: err.message || "Failed to fetch orders" });
  }
};

/** GET /api/admin/orders/:id — admin only */
export const handleGetOrder: RequestHandler = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id as string);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ order });
  } catch (err: any) {
    console.error("Failed to get order:", err);
    res.status(500).json({ error: err.message || "Failed to fetch order" });
  }
};

/** PATCH /api/admin/orders/:id — admin only (update status) */
export const handleUpdateOrderStatus: RequestHandler = async (req, res) => {
  const { status } = req.body;
  if (!["Pending", "Paid", "Refunded"].includes(status)) {
    res.status(400).json({ error: "Invalid status. Must be Pending, Paid, or Refunded." });
    return;
  }

  try {
    const order = await getOrderById(req.params.id as string);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    await updateOrder(req.params.id as string, { status });
    res.json({ order: { ...order, status } });
  } catch (err: any) {
    console.error("Failed to update order:", err);
    res.status(500).json({ error: err.message || "Failed to update order" });
  }
};

/** POST /api/orders — public (create order at checkout) */
export const handleCreateOrder: RequestHandler = async (req, res) => {
  const parsed = CreateOrderInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    let orderNumber = 2040;
    try {
      const allOrders = await getOrders();
      orderNumber += allOrders.length;
    } catch (e) {
      orderNumber += Math.floor(Math.random() * 1000);
    }
    
    let userId: string | undefined = undefined;
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch {
        // Token invalid/expired - proceed as guest
      }
    }

    const order: any = {
      id: `AMR-${orderNumber}`,
      customerEmail: parsed.data.customerEmail,
      customerName: parsed.data.customerName,
      country: parsed.data.country,
      items: parsed.data.items,
      total: parsed.data.items.reduce((sum, item) => sum + item.price, 0),
      status: "Pending" as const,
      createdAt: new Date().toISOString(),
    };

    if (userId) {
      order.userId = userId;
    }

    await createOrder(order);
    res.status(201).json({ order });
  } catch (err: any) {
    console.error("Create order failed:", err);
    res.status(500).json({ error: err.message || "Failed to create order" });
  }
};

/** GET /api/user/orders — authenticated user's orders */
export const handleUserOrders: RequestHandler = async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let email: string;
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.email) {
      res.status(400).json({ error: "Email not associated with token" });
      return;
    }
    email = decodedToken.email;
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    const orders = await getUserOrders(email);
    res.json({ orders });
  } catch (err) {
    console.error("Failed to fetch user orders:", err);
    res.status(500).json({ error: "Failed to fetch user orders from database" });
  }
};
