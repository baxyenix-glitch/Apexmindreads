import React from "react";
import { X, Share, PlusSquare, BellRing } from "lucide-react";

export function IosInstallModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#26332f]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-[#e2dfd8] bg-[#fffaf2] p-6 shadow-2xl text-[#26332f] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#eee7dc] text-[#736b61] hover:bg-[#e2dfd8] transition"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <img
            src="/favicon.png"
            alt="Apex Admin"
            className="h-12 w-12 rounded-xl object-contain shadow-md"
          />
          <div>
            <h3 className="font-serif text-lg font-bold">Install Apex Admin App</h3>
            <p className="text-xs text-[#8b8175]">Standalone mobile app with live order alerts</p>
          </div>
        </div>

        <div className="mt-5 space-y-3.5 text-xs text-[#52493d]">
          <div className="flex items-start gap-3 rounded-xl bg-[#f5f1e8] p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d86f45] text-white font-bold text-[11px]">
              1
            </span>
            <p className="leading-5">
              Tap the <strong>Share</strong> button <Share size={14} className="inline mx-1 text-[#d86f45]" /> in Safari or Chrome menu.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-[#f5f1e8] p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d86f45] text-white font-bold text-[11px]">
              2
            </span>
            <p className="leading-5">
              Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare size={14} className="inline mx-1 text-[#5e8c67]" />.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-[#f5f1e8] p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d86f45] text-white font-bold text-[11px]">
              3
            </span>
            <p className="leading-5">
              Open the app from your home screen and allow <strong>Notifications</strong> <BellRing size={14} className="inline mx-1 text-[#e4a83d]" /> to get real-time sound & push alerts when sales happen!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#26332f] py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#384843] transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
