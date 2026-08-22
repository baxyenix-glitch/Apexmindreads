import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, AlertCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/lib/admin-auth";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { adminLogin } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await adminLogin(email, password);
    setLoading(false);

    if (result.ok) {
      navigate("/admin");
    } else {
      setError(result.error ?? "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-[#26332f] px-5 py-8 text-[#f8f4ec] sm:py-12">
      <div className="mx-auto flex max-w-[1100px] flex-col">
        <Link to="/" className="flex items-center gap-2 self-start font-serif text-xl tracking-[-0.05em]">
          <img src="/logo.png" alt="ApexMindReads logo" className="h-9 w-9 object-contain" />
          ApexMind<span className="text-[#e58a61]">Reads</span>
        </Link>

        <main className="grid items-center gap-12 py-16 lg:grid-cols-[1fr_420px] lg:gap-24 lg:py-24">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0bc58]">Admin workspace</p>
            <h1 className="mt-5 font-serif text-[4.5rem] leading-[0.86] tracking-[-0.07em] sm:text-[6.2rem]">
              Run the store<br /><em className="text-[#e58a61]">simply.</em>
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-[#bec5bb]">
              Manage guides, orders, customers, promotions, and the settings that keep ApexMindReads moving.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[1.5rem] bg-[#f8f4ec] p-6 text-[#26332f] shadow-[0_25px_70px_-35px_rgba(0,0,0,.6)] sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#d86f45]">Welcome back</p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.05em]">Sign in to continue</h2>

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="mt-7 space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.11em] text-[#736b61]">Admin email</span>
                <span className="relative block">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a99d91]" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@apexmindreads.com"
                    className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-[#fffaf2] pl-11 pr-4 text-sm outline-none focus:border-[#d86f45]"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.11em] text-[#736b61]">Password</span>
                <span className="relative block">
                  <LockKeyhole size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a99d91]" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-[#fffaf2] pl-11 pr-11 text-sm outline-none focus:border-[#d86f45]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#8b8175]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#d86f45] text-xs font-bold uppercase tracking-[0.13em] text-white transition hover:bg-[#be5935] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Open dashboard <ArrowRight size={16} /></>
              )}
            </button>

            <p className="mt-6 text-center text-[11px] leading-5 text-[#8b8175]">
              Protected admin access. Use your approved store account.
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
