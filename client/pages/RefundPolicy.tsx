import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-[#f8f4ec] text-[#26332f]">
      <header className="border-b border-[#e5ddd2]">
        <div className="mx-auto flex h-[74px] max-w-[1180px] items-center justify-between px-5 lg:px-10">
          <Link to="/" className="flex items-center gap-2 font-serif text-[1.35rem] font-semibold tracking-[-0.05em]">
            <img src="https://cdn.builder.io/api/v1/image/assets%2F65219c2b646c40599cdbfb399c78ee49%2F25bc89c4be474445946731673dbce175?format=webp&width=800&height=1200" alt="ApexMindReads logo" className="h-9 w-9 object-contain" />
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
          Refund <em className="text-[#d86f45]">Policy</em>
        </h1>
        
        <div className="mt-12 space-y-8 text-sm leading-7 text-[#736b61]">
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">1. Digital Product Returns</h2>
            <p>Due to the nature of digital downloads, all sales of PDF guides, ebooks, and other digital materials are generally considered final and non-refundable once the download has been initiated or completed.</p>
          </section>
          
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">2. Exceptions</h2>
            <p>We want you to be completely satisfied with your purchase. Refunds may be considered under the following circumstances:</p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>The file is corrupted, unreadable, or missing critical pages, and our support team is unable to provide a working copy.</li>
              <li>You were charged multiple times for the same transaction due to a technical error.</li>
              <li>The product was misdescribed in a significant and misleading way on our store.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">3. Requesting a Refund</h2>
            <p>To request a refund, please contact our support team within 14 days of your purchase. You must include your order number, the email address used for the purchase, and a detailed explanation of the issue you are experiencing.</p>
          </section>
          
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">4. Processing Refunds</h2>
            <p>If your refund request is approved, it will be processed, and a credit will automatically be applied to your credit card or original method of payment, typically within 5-10 business days depending on your bank or payment provider.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
