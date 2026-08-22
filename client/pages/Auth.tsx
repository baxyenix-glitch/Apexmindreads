import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, User, AlertCircle, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const initialMode = (searchParams.get("mode") as "signin" | "create" | "forgot") || "signin";

  const [mode, setMode] = useState<"signin" | "create" | "forgot">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { login, register, resetPassword } = useAuth();

  const isCheckoutRedirect = redirect.includes("checkout");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let result: { ok: boolean; error?: string };

    if (mode === "signin") {
      result = await login(email, password);
    } else if (mode === "forgot") {
      result = await resetPassword(email);
    } else {
      if (!name.trim()) {
        setError("Please enter your name");
        setLoading(false);
        return;
      }
      result = await register(email, name, password);
    }

    setLoading(false);

    if (result.ok) {
      if (mode === "signin") {
        navigate(redirect);
      } else {
        setSuccess(true);
      }
    } else {
      setError(result.error ?? "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f4ec] text-[#26332f]">
      <header className="mx-auto flex h-[66px] max-w-[1320px] items-center justify-between px-3.5 sm:h-[74px] sm:px-6 lg:px-10">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-serif text-[1.15rem] font-semibold tracking-[-0.04em] sm:text-[1.35rem]">
          <img src="/logo.png" alt="ApexMindReads logo" className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9" />
          <span className="whitespace-nowrap">ApexMind<span className="text-[#d86f45]">Reads</span></span>
        </Link>
        <Link to={redirect !== "/" ? redirect : "/"} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b8175] transition hover:text-[#d86f45] sm:text-xs sm:tracking-[0.12em]">
          <ArrowLeft size={14} /> {isCheckoutRedirect ? "Back to checkout" : "Back to shop"}
        </Link>
      </header>

      <main className="mx-auto grid max-w-[1120px] items-center gap-12 px-5 pb-16 pt-10 lg:grid-cols-[.85fr_1fr] lg:px-10 lg:pb-24 lg:pt-16">
        <div className="hidden lg:block">
          <p className="section-kicker">Your Digital Library</p>
          <h1 className="mt-4 max-w-md font-serif text-[5.2rem] leading-[0.86] tracking-[-0.07em]">
            Your personal sanctuary for <em className="text-[#d86f45]">growth.</em>
          </h1>
          <p className="mt-7 max-w-sm text-base leading-7 text-[#736b61]">
            Securely store your collection, access your insights from anywhere, and continue your journey at your own pace.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm text-[#736b61]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b8c7b2] text-[#26332f]">
              <Check size={16} />
            </span>
            Instant access to every purchase
          </div>
        </div>

        <section className="mx-auto w-full max-w-[480px] rounded-[1.5rem] border border-[#e5ddd2] bg-[#fffaf2] p-6 shadow-[0_20px_55px_-38px_rgba(32,35,29,.7)] sm:p-9">
          <div className="mb-8 flex gap-6 border-b border-[#e5ddd2]">
            <button
              onClick={() => { setMode("signin"); setError(""); setSuccess(false); }}
              className={`relative pb-4 text-sm font-semibold ${mode === "signin" ? "text-[#26332f]" : "text-[#a99d91]"}`}
            >
              Sign in
              {mode === "signin" && <span className="absolute bottom-[-1px] left-0 h-0.5 w-full bg-[#d86f45]" />}
            </button>
            <button
              onClick={() => { setMode("create"); setError(""); setSuccess(false); }}
              className={`relative pb-4 text-sm font-semibold ${mode === "create" ? "text-[#26332f]" : "text-[#a99d91]"}`}
            >
              Create account
              {mode === "create" && <span className="absolute bottom-[-1px] left-0 h-0.5 w-full bg-[#d86f45]" />}
            </button>
          </div>

          {success ? (
            <div className="py-10 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#b8c7b2] text-[#26332f]">
                <Check size={25} />
              </span>
              <h2 className="mt-6 font-serif text-3xl tracking-[-0.05em]">{mode === "forgot" ? "Email sent" : "You are all set."}</h2>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#736b61]">
                {mode === "forgot"
                  ? "Check your inbox for instructions to reset your password."
                  : mode === "create"
                  ? "Your account has been created. You can now complete your checkout and access all your guides in your library."
                  : "Welcome back! Continue browsing or check your orders."}
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                {isCheckoutRedirect ? (
                  <button
                    onClick={() => navigate(redirect)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#d86f45] px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#be5935]"
                  >
                    Continue to checkout <ArrowRight size={15} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => mode === "forgot" ? (setMode("signin"), setSuccess(false)) : navigate("/")}
                      className="inline-flex items-center gap-2 rounded-full bg-[#26332f] px-5 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white"
                    >
                      {mode === "forgot" ? "Back to sign in" : "Back to shop"} <ArrowRight size={15} />
                    </button>
                    {mode !== "forgot" && (
                      <button
                        onClick={() => navigate("/my-orders")}
                        className="inline-flex items-center gap-2 rounded-full border border-[#d8d0c6] px-5 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#26332f]"
                      >
                        My orders
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
              
              {mode === "forgot" && (
                <div className="mb-5">
                  <h2 className="mb-2 font-serif text-2xl">Reset Password</h2>
                  <p className="text-sm text-[#736b61]">Enter your email address and we will send you a link to reset your password.</p>
                </div>
              )}

              {mode === "create" && (
                <div className="mb-5">
                  <label htmlFor="auth-name" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">
                    Your name
                  </label>
                  <div className="relative">
                    <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a99d91]" />
                    <input
                      id="auth-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Amara"
                      className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-[#f8f4ec] pl-11 pr-4 text-sm outline-none transition focus:border-[#d86f45]"
                    />
                  </div>
                </div>
              )}

              <div className="mb-5">
                <label htmlFor="auth-email" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a99d91]" />
                  <input
                    id="auth-email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-[#f8f4ec] pl-11 pr-4 text-sm outline-none transition focus:border-[#d86f45]"
                  />
                </div>
              </div>

              {mode !== "forgot" && (
                <div className="mb-2">
                  <label htmlFor="auth-password" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#736b61]">
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a99d91]" />
                    <input
                      id="auth-password"
                      required
                      minLength={6}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="h-12 w-full rounded-xl border border-[#d8d0c6] bg-[#f8f4ec] pl-11 pr-12 text-sm outline-none transition focus:border-[#d86f45]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#8b8175]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "signin" && (
                <button type="button" onClick={() => setMode("forgot")} className="mt-3 text-xs font-semibold text-[#d86f45] hover:underline">
                  Forgot your password?
                </button>
              )}
              {mode === "forgot" && (
                <button type="button" onClick={() => setMode("signin")} className="mt-3 text-xs font-semibold text-[#736b61] hover:underline">
                  Nevermind, back to sign in
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#d86f45] text-xs font-bold uppercase tracking-[0.13em] text-white transition hover:bg-[#bf5937] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Sign in" : mode === "create" ? "Create account" : "Send Reset Link"} <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="mt-6 text-center text-[11px] leading-5 text-[#8b8175]">
                By continuing, you agree to our{" "}
                <Link to="/terms" className="underline underline-offset-2">Terms</Link> and{" "}
                <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
              </p>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
