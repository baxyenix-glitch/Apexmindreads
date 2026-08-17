import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
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
          Privacy <em className="text-[#d86f45]">Policy</em>
        </h1>
        
        <div className="mt-12 space-y-8 text-sm leading-7 text-[#736b61]">
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">1. Information We Collect</h2>
            <p>When you visit ApexMindReads or make a purchase, we collect certain information about your device, your interaction with the site, and information necessary to process your purchases. We may also collect additional information if you contact us for customer support.</p>
          </section>
          
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">2. How We Use Your Information</h2>
            <p>We use the order information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to:</p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>Communicate with you</li>
              <li>Screen our orders for potential risk or fraud</li>
              <li>Provide you with information or advertising relating to our products or services (in line with the preferences you have shared with us)</li>
            </ul>
          </section>
          
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">3. Sharing Personal Information</h2>
            <p>We share your Personal Information with service providers to help us provide our services and fulfill our contracts with you. For example, we use Firebase for authentication and database management, and standard payment processors for secure transactions.</p>
          </section>
          
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">4. Data Retention</h2>
            <p>When you place an order through the Site, we will retain your Personal Information for our records unless and until you ask us to erase this information.</p>
          </section>
          
          <section>
            <h2 className="mb-3 font-serif text-2xl text-[#26332f]">5. Changes</h2>
            <p>We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
