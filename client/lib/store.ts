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

export const formatNGN = (value: number) => `₦${value.toLocaleString("en-NG")}`;

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load products");
        return res.json();
      })
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load products:", err);
        setProducts([]);
        setLoading(false);
      });
  }, []);

  return { products, loading };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/products/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load product");
        return res.json();
      })
      .then((data) => {
        setProduct(data.product || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load product:", err);
        setProduct(null);
        setLoading(false);
      });
  }, [slug]);

  return { product, loading };
}
