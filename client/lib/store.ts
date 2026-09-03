import { useState, useEffect } from "react";
import type { Product } from "@shared/schema";

export type { Product };
export type Currency = "NGN" | "USD" | "GBP" | "EUR";

export interface Category {
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export interface Testimonial {
  category: "Parenting" | "Financial Freedom" | "Relationships" | string;
  quote: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}

export const categories: Category[] = [
  { name: "Financial Freedom", slug: "financial-freedom", icon: "↗", color: "#e7b05a" },
  { name: "Career & Productivity", slug: "career-productivity", icon: "⌁", color: "#e28b62" },
  { name: "Health & Wellness", slug: "health-wellness", icon: "✦", color: "#b8c7b2" },
  { name: "Relationships", slug: "relationships", icon: "⌂", color: "#d2a77f" },
  { name: "Mindset & Growth", slug: "mindset-growth", icon: "✳", color: "#8fa7bd" },
  { name: "Business & Entrepreneurship", slug: "business-entrepreneurship", icon: "❖", color: "#d98158" },
  { name: "Parenting", slug: "parenting", icon: "♡", color: "#829a7b" },
];

export const testimonials: Testimonial[] = [
  { 
    category: "Parenting",
    quote: "Our home went from daily screaming matches to calm, connected routines. My 7-year-old now communicates her feelings without tantrums, and bedtime is peaceful again.", 
    name: "Amina T.", 
    role: "Abuja, Nigeria", 
    initials: "AT", 
    color: "#829a7b" 
  },
  { 
    category: "Financial Freedom",
    quote: "Within 60 days, I eliminated over $4,200 in high-interest debt, built a 6-month emergency cushion, and finally have complete confidence managing my monthly cash flow.", 
    name: "Dami A.", 
    role: "Lagos, Nigeria", 
    initials: "DA", 
    color: "#d98158" 
  },
  { 
    category: "Relationships",
    quote: "After months of emotional distance, we learned how to listen without getting defensive. It completely revived our marriage and brought back mutual respect and genuine joy.", 
    name: "Marcus & Elena V.", 
    role: "London, UK", 
    initials: "MV", 
    color: "#d2a77f" 
  },
];

let memoryProducts: Product[] | null = null;

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(memoryProducts || []);
  const [loading, setLoading] = useState(memoryProducts === null);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/products?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Pragma": "no-cache" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load products");
        return res.json();
      })
      .then((data) => {
        if (mounted) {
          const list = Array.isArray(data.products) ? data.products : [];
          memoryProducts = list;
          setProducts(list);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Products fetch notice:", err);
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return { products, loading };
}

export function useProduct(slug: string) {
  const initial = memoryProducts?.find((p) => p.slug === slug || p.id === slug) || null;
  const [product, setProduct] = useState<Product | null>(initial);
  const [loading, setLoading] = useState(initial === null);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    fetch(`/api/products/${slug}?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Pragma": "no-cache" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load product");
        return res.json();
      })
      .then((data) => {
        if (mounted) {
          setProduct(data.product || null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Product fetch notice:", err);
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [slug]);

  return { product, loading };
}
