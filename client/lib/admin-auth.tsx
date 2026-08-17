import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { adminAuthClient, getAdminAuthHeaders } from "./firebase";

interface AdminUser {
  id: string;
  email: string;
  name: string;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  adminLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

// Removed ADMIN_EMAILS hardcoding as only admins have Firebase accounts.

export async function adminAuthHeaders(): Promise<HeadersInit> {
  return getAdminAuthHeaders();
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuthClient, (user: FirebaseUser | null) => {
      if (user && user.email) {
        setAdmin({
          id: user.uid,
          email: user.email,
          name: "Richkidbenny",
        });
      } else {
        setAdmin(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const adminLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(adminAuthClient, email, password);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Invalid admin credentials" };
    }
  };

  const adminLogout = async () => {
    await signOut(adminAuthClient);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isAdmin: !!admin, isLoading, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}

/** Route guard — redirects to /admin/login if not authenticated */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/admin/login", { replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f3ee]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#d8d0c6] border-t-[#d86f45]" />
          <p className="mt-4 text-sm text-[#8b8175]">Checking admin access…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;
  return <>{children}</>;
}
