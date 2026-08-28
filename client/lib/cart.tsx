import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }
}

interface CartContextType {
  cart: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  lastAddedProduct: Product | null;
  dismissNotification: () => void;
  cartCountAnimation: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Product[]>(loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);
  const [cartCountAnimation, setCartCountAnimation] = useState(false);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const exists = current.some((item) => item.id === product.id || item.slug === product.slug);
      if (exists) return current;
      return [...current, product];
    });

    // Trigger visual notification
    setLastAddedProduct(product);
    setCartCountAnimation(true);
    setTimeout(() => setCartCountAnimation(false), 1200);
  };

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.id !== productId && item.slug !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const dismissNotification = () => {
    setLastAddedProduct(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        lastAddedProduct,
        dismissNotification,
        cartCountAnimation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
