import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#f8f4ec] text-[#26332f]">
      <header className="border-b border-[#e5ddd2]">
        <div className="mx-auto flex h-[74px] max-w-[1180px] items-center justify-between px-5 lg:px-10">
          <Link to="/" className="flex items-center gap-2 font-serif text-[1.35rem] font-semibold tracking-[-0.05em]">
            <img src="/logo.png" alt="ApexMindReads logo" className="h-9 w-9 object-contain" />
            ApexMind<span className="text-[#d86f45]">Reads</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8b8175] transition hover:text-[#d86f45]">
            <ArrowLeft size={15} /> Back to shop
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] px-5 py-10 lg:px-10 lg:py-16">
        <p className="section-kicker">Legal</p>
        <h1 className="mt-3 font-serif text-5xl leading-[0.88] tracking-[-0.06em] sm:text-6xl">
          Terms of <em className="text-[#d86f45]">Service</em>
        </h1>
        
        <div className="mt-12 space-y-8 text-sm leading-7 text-[#736b61]">
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">1. Overview</h2>
            <p>This website is operated by ApexMindReads. Throughout the site, the terms “we”, “us” and “our” refer to ApexMindReads. By visiting our site and/ or purchasing something from us, you engage in our “Service” and agree to be bound by the following terms and conditions.</p>
          </section>
          
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">2. Digital Products</h2>
            <p>Our products are delivered digitally. Upon successful payment, you will receive access to your purchased digital products (e.g., PDF guides). You are granted a non-exclusive, non-transferable license to use the products for your personal, non-commercial use only.</p>
          </section>
          
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">3. Intellectual Property</h2>
            <p>All content included on this site, such as text, graphics, logos, images, and digital downloads, is the property of ApexMindReads or its content suppliers and protected by international copyright laws. You may not reproduce, duplicate, copy, sell, resell or exploit any portion of the Service or products without express written permission by us.</p>
          </section>
          
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">4. Modifications to the Service and Prices</h2>
            <p>Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.</p>
          </section>
          
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">5. Governing Law</h2>
            <p>These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with standard international business laws.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
