import type { RequestHandler } from "express";
import { getOrderById, updateOrder } from "../data/db";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "sk_test_35d86e07111d6fe535356200a8dc583824cbc0b1";

// Supported direct transaction currencies in Paystack
const NATIVE_PAYSTACK_CURRENCIES = ["NGN", "USD", "GHS", "ZAR", "KES"];

// Conversion rates to NGN baseline (used for global payment fallback)
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
 * POST /api/paystack/initialize
 * Initializes a transaction with Paystack for global customers
 */
export const handleInitializePaystack: RequestHandler = async (req, res) => {
  const { orderId, email, amount, currency = "NGN", callbackUrl } = req.body;

  if (!email || !amount || !orderId) {
    res.status(400).json({ error: "Missing required parameters: email, amount, or orderId" });
    return;
  }

  try {
    const order = await getOrderById(orderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const requestedCurrency = String(currency).toUpperCase();
    let targetCurrency = NATIVE_PAYSTACK_CURRENCIES.includes(requestedCurrency) ? requestedCurrency : "NGN";
    let targetAmount = Number(amount);

    // If requested currency is not directly accepted by Paystack (e.g. GBP, EUR, CAD, AUD, AED),
    // convert it to NGN so Paystack processes it seamlessly with international cards
    if (!NATIVE_PAYSTACK_CURRENCIES.includes(requestedCurrency)) {
      const rate = NGN_RATES[requestedCurrency] || 1550;
      targetAmount = Math.round(targetAmount * rate);
      targetCurrency = "NGN";
    }

    const amountInMinor = Math.round(targetAmount * 100);

    const makePaystackInit = async (curr: string, amtMinor: number) => {
      return fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amtMinor,
          currency: curr,
          reference: `AMR-${orderId}-${Date.now()}`,
          callback_url: callbackUrl || `${req.protocol}://${req.get("host")}/checkout?reference=`,
          metadata: {
            orderId,
            customerName: order.customerName,
            originalCurrency: requestedCurrency,
            originalAmount: amount,
            custom_fields: [
              { display_name: "Order ID", variable_name: "order_id", value: orderId },
              { display_name: "Customer Name", variable_name: "customer_name", value: order.customerName },
              { display_name: "Original Currency", variable_name: "original_currency", value: requestedCurrency },
            ],
          },
        }),
      });
    };

    let paystackRes = await makePaystackInit(targetCurrency, amountInMinor);
    let data = await paystackRes.json();

    // If merchant account does not have foreign currency enabled (e.g. USD/GHS/ZAR not enabled),
    // automatically fallback to NGN so the customer's international card is charged without error!
    if (!data.status && targetCurrency !== "NGN") {
      console.warn(`Paystack returned error for ${targetCurrency}: ${data.message}. Falling back to NGN.`);
      const rate = NGN_RATES[targetCurrency] || 1550;
      const ngnAmountMinor = Math.round(Number(amount) * rate * 100);
      paystackRes = await makePaystackInit("NGN", ngnAmountMinor);
      data = await paystackRes.json();
    }

    if (!data.status) {
      res.status(400).json({ error: data.message || "Failed to initialize Paystack transaction" });
      return;
    }

    res.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (err: any) {
    console.error("Paystack initialize error:", err);
    res.status(500).json({ error: err.message || "Internal server error during payment initialization" });
  }
};

/**
 * POST /api/paystack/verify
 * Verifies transaction with Paystack and activates downloads for the order
 */
export const handleVerifyPaystack: RequestHandler = async (req, res) => {
  const { reference, orderId } = req.body;

  if (!reference) {
    res.status(400).json({ error: "Transaction reference is required" });
    return;
  }

  try {
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
    });

    const data = await paystackRes.json();

    if (!data.status || data.data.status !== "success") {
      res.status(400).json({ error: data.data?.gateway_response || data.message || "Payment verification failed" });
      return;
    }

    // Extract or look up the associated order
    const resolvedOrderId = orderId || data.data.metadata?.orderId;
    if (!resolvedOrderId) {
      res.status(400).json({ error: "Could not link payment to order" });
      return;
    }

    const order = await getOrderById(resolvedOrderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Update order status to Paid
    const updatedOrder = {
      ...order,
      status: "Paid" as const,
      paymentReference: reference,
      paidAt: new Date().toISOString(),
    };

    await updateOrder(resolvedOrderId, {
      status: "Paid",
      paymentReference: reference,
      paidAt: updatedOrder.paidAt,
    });

    // Generate verified download URLs for each product in the order
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
    console.error("Paystack verification error:", err);
    res.status(500).json({ error: err.message || "Failed to verify transaction" });
  }
};
