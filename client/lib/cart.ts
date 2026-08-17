import type { Product } from "./store";

const CART_KEY = "apexmindreads-cart";

export function loadCart(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(CART_KEY);
    return stored ? (JSON.parse(stored) as Product[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart: Product[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
