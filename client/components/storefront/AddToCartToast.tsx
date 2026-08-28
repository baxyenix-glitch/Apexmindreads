import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ShoppingBag, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/lib/cart";
import { formatCurrency, useCurrency } from "@/lib/currency";
import { CoverArt } from "./CoverArt";

export function AddToCartToast() {
  const { lastAddedProduct, dismissNotification, setIsCartOpen, cart } = useCart();
  const { currency } = useCurrency();
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!lastAddedProduct) return;

    setProgress(100);
    const duration = 5000; // 5 seconds
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      if (!isHovered) {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            dismissNotification();
            return 0;
          }
          return prev - step;
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [lastAddedProduct, isHovered, dismissNotification]);

  return (
    <AnimatePresence>
      {lastAddedProduct && (
        <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center sm:bottom-6 sm:left-auto sm:right-6 sm:justify-end pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.25 } }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="pointer-events-auto relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-[#d8d0c6]/80 bg-[#fffaf2] p-4 text-[#26332f] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)] backdrop-blur-md sm:p-5"
            role="alert"
            aria-live="polite"
          >
            {/* Top Success Badge & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-[#eee7dc]">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5e8c67] text-white shadow-sm animate-bounce">
                  <Check size={12} strokeWidth={3} />
                </span>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#5e8c67]">
                  Added to your basket
                </p>
              </div>

              <button
                onClick={dismissNotification}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#8b8175] transition hover:bg-[#eee7dc] hover:text-[#26332f]"
                aria-label="Close notification"
              >
                <X size={15} />
              </button>
            </div>

            {/* Product Item Preview */}
            <div className="mt-3.5 flex items-center gap-3.5">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md shadow-sm border border-[#e5ddd2]">
                <CoverArt
                  cover={lastAddedProduct.cover}
                  imageUrl={lastAddedProduct.imageUrl}
                  compact
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8b8175]">
                  {lastAddedProduct.category}
                </p>
                <h4 className="truncate font-serif text-[1.05rem] font-bold tracking-tight text-[#26332f]">
                  {lastAddedProduct.title}
                </h4>
                <p className="mt-0.5 text-xs font-semibold text-[#d86f45]">
                  {formatCurrency(lastAddedProduct.price, currency)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  dismissNotification();
                  setIsCartOpen(true);
                }}
                className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#26332f] bg-[#26332f] px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#fffaf2] transition hover:bg-[#3b4b45] active:scale-[0.98]"
              >
                <ShoppingBag size={13} />
                <span>Basket ({cart.length})</span>
              </button>

              <Link
                to="/checkout"
                onClick={dismissNotification}
                className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#d86f45] px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#be5935] active:scale-[0.98]"
              >
                <span>Checkout</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Progress Countdown Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#eee7dc]">
              <motion.div
                className="h-full bg-[#d86f45]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.05 }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
