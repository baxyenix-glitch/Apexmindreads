import { ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { useState } from "react";
import type { Product } from "@/lib/store";

type PlaceholderProps = { title: string };

export default function Placeholder({ title }: PlaceholderProps) {
  const [cart] = useState<Product[]>([]);
  return <StorefrontShell cart={cart} onRemove={() => undefined}><div className="mx-auto max-w-[1320px] px-5 py-24 lg:px-10 lg:py-36"><Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#8b8175] hover:text-[#d86f45]"><ArrowLeft size={15} /> Back home</Link><div className="mt-14 max-w-2xl"><p className="section-kicker">ApexMindReads</p><h1 className="mt-4 font-serif text-6xl leading-[0.88] tracking-[-0.07em] sm:text-8xl">{title}</h1><p className="mt-8 text-lg leading-8 text-[#736b61]">This page is set up for the final policy or support details. The store team can add the approved copy here before launch.</p><div className="mt-9 flex flex-wrap gap-3"><Link to="/" className="rounded-full bg-[#26332f] px-6 py-4 text-xs font-bold uppercase tracking-[0.13em] text-white">Return to shop</Link><a href="mailto:hello@apexmindreads.com" className="flex items-center gap-2 rounded-full border border-[#d8d0c6] px-6 py-4 text-xs font-bold uppercase tracking-[0.13em] text-[#26332f]"><Mail size={16} /> Email support</a></div></div></div></StorefrontShell>;
}
