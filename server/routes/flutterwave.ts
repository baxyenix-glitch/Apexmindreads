import type { RequestHandler } from "express";
import { getOrderById, updateOrder } from "../data/db.js";
import { sendOrderPushNotification } from "../lib/pushNotifications.js";

const FLUTTERWAVE_SECRET = process.env.FLUTTERWAVE_SECRET_KEY || "";
const FLUTTERWAVE_PUBLIC = process.env.FLUTTERWAVE_PUBLIC_KEY || process.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "";

// Direct currencies supported on standard Flutterwave merchant accounts
const NATIVE_FLUTTERWAVE_CURRENCIES = ["NGN", "USD", "EUR", "GBP", "GHS", "KES", "ZAR", "CAD", "TZS", "UGX", "RWF", "ZMW"];

// 1 Foreign Unit = X NGN baseline rate
const NGN_RATES: Record<string, number> = {
  NGN: 1,
  USD: 1550,
  GBP: 1980,
  EUR: 1690,
  CAD: 1120,
  AUD: 1000,
  GHS: 105,
  KES: 12,
  ZAR: 85,
  INR: 18.5,
  AED: 422,
  SAR: 413,
  EGP: 32,
  JPY: 10.3,
  CNY: 215,
  BRL: 270,
  MXN: 76,
  NZD: 920,
  SGD: 1150,
  CHF: 1750,
};

/**
 * POST /api/flutterwave/initialize
 * Initializes a transaction with Flutterwave for global customers
 */
export const handleInitializeFlutterwave: RequestHandler = async (req, res) => {
  const { orderId, email, amount, currency = "NGN", customerName, callbackUrl } = req.body;

  if (!email || !amount || !orderId) {
    res.status(400).json({ error: "Missing required parameters: email, amount, or orderId" });
    return;
  }

  if (!FLUTTERWAVE_SECRET) {
    res.status(400).json({ error: "Flutterwave secret key is not configured. Please add FLUTTERWAVE_SECRET_KEY to your environment variables." });
    return;
  }

  try {
    const order = await getOrderById(orderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const requestedCurrency = String(currency).toUpperCase();
    const baseNgnAmount = Number(amount);

    let targetCurrency = "NGN";
    let targetAmount = baseNgnAmount;

    // Check if currency is directly supported
    if (NATIVE_FLUTTERWAVE_CURRENCIES.includes(requestedCurrency)) {
      targetCurrency = requestedCurrency;
      if (requestedCurrency === "NGN") {
        targetAmount = baseNgnAmount;
      } else {
        const rate = NGN_RATES[requestedCurrency] || 1550;
        targetAmount = Number((baseNgnAmount / rate).toFixed(2));
      }
    } else {
      // Fallback to NGN for unsupported currencies
      targetCurrency = "NGN";
      targetAmount = baseNgnAmount;
    }

    const txRef = `AMR-${orderId}-${Date.now()}`;
    const clientName = customerName || order.customerName || "Valued Reader";
    const redirectUrl = callbackUrl || `${req.protocol}://${req.get("host")}/checkout?gateway=flutterwave&tx_ref=${txRef}&orderId=${orderId}`;

    const flwPayload = {
      tx_ref: txRef,
      amount: targetAmount,
      currency: targetCurrency,
      redirect_url: redirectUrl,
      customer: {
        email,
        name: clientName,
      },
      customizations: {
        title: "ApexMindReads",
        description: `Payment for Order ${orderId}`,
        logo: `${req.protocol}://${req.get("host")}/logo.png`,
      },
      meta: {
        orderId,
        customerName: clientName,
        originalCurrency: requestedCurrency,
        baseNgnAmount,
        chargedCurrency: targetCurrency,
        chargedAmount: targetAmount,
      },
    };

    const flwRes = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flwPayload),
    });

    const data = await flwRes.json();

    if (!flwRes.ok || data.status !== "success") {
      console.error("Flutterwave API Error:", data);
      res.status(400).json({ error: data.message || "Failed to initialize Flutterwave transaction" });
      return;
    }

    res.json({
      link: data.data?.link,
      tx_ref: txRef,
      amount: targetAmount,
      currency: targetCurrency,
      publicKey: FLUTTERWAVE_PUBLIC,
      customer: {
        email,
        name: clientName,
      },
    });
  } catch (err: any) {
    console.error("Flutterwave initialize error:", err);
    res.status(500).json({ error: err.message || "Internal server error during Flutterwave initialization" });
  }
};

/**
 * POST /api/flutterwave/verify
 * Verifies transaction with Flutterwave and unlocks instant download for the order
 */
export const handleVerifyFlutterwave: RequestHandler = async (req, res) => {
  const { transaction_id, tx_ref, orderId } = req.body;

  if (!transaction_id && !tx_ref) {
    res.status(400).json({ error: "transaction_id or tx_ref is required for Flutterwave verification" });
    return;
  }

  try {
    let flwRes;
    if (transaction_id) {
      flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET}`,
        },
      });
    } else {
      flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET}`,
        },
      });
    }

    const data = await flwRes.json();

    if (!flwRes.ok || data.status !== "success" || data.data?.status !== "successful") {
      res.status(400).json({ error: data.message || data.data?.processor_response || "Flutterwave payment verification failed" });
      return;
    }

    // Resolve order ID
    let resolvedOrderId = orderId || data.data?.meta?.orderId;
    if (!resolvedOrderId && data.data?.tx_ref) {
      // e.g. AMR-AMR-1002-1718000000 or AMR-1002-1718000000
      const parts = data.data.tx_ref.split("-");
      if (parts.length >= 2) {
        resolvedOrderId = parts.slice(0, -1).join("-");
      }
    }

    if (!resolvedOrderId) {
      res.status(400).json({ error: "Could not associate Flutterwave transaction with an order" });
      return;
    }

    const order = await getOrderById(resolvedOrderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Update order to Paid
    const updatedOrder = {
      ...order,
      status: "Paid" as const,
      paymentGateway: "flutterwave",
      paymentReference: data.data.tx_ref || String(transaction_id),
      paidAt: new Date().toISOString(),
    };

    await updateOrder(resolvedOrderId, {
      status: "Paid",
      paymentGateway: "flutterwave",
      paymentReference: data.data.tx_ref || String(transaction_id),
      paidAt: updatedOrder.paidAt,
    });

    // Send real-time Web Push notification to admin devices
    try {
      const formattedTotal = `₦${(order.total || 0).toLocaleString()}`;
      const customer = order.customerName || order.customerEmail?.split("@")[0] || "Customer";
      sendOrderPushNotification({
        title: `💰 Payment Received: ${formattedTotal}`,
        body: `${customer} paid for order ${order.id} (${formattedTotal}) via Flutterwave`,
        url: "/admin/orders",
        tag: `payment-${order.id}`,
      }).catch((e) => console.warn("Background push error:", e));
    } catch (e) {
      // Non-blocking
    }

    // Generate verified download URLs
    const downloadUrls = order.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      downloadUrl: `/api/orders/${order.id}/download/${item.productId}`,
    }));

    res.json({
      ok: true,
      order: updatedOrder,
      downloadUrls,
    });
  } catch (err: any) {
    console.error("Flutterwave verification error:", err);
    res.status(500).json({ error: err.message || "Failed to verify Flutterwave transaction" });
  }
};
