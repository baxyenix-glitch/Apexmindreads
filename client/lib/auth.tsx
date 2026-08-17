import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { auth } from "./firebase";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, name: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Prevent admin users from logging into the storefront
        const tokenResult = await firebaseUser.getIdTokenResult();
        if (tokenResult.claims.admin) {
          await signOut(auth);
          setUser(null);
          setIsLoading(false);
          return;
        }

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          emailVerified: firebaseUser.emailVerified,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const tokenResult = await cred.user.getIdTokenResult();
      if (tokenResult.claims.admin) {
        await signOut(auth);
        return { ok: false, error: "Admin accounts cannot log into the store." };
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || "Failed to login" };
    }
  }, []);

  const register = useCallback(async (email: string, _name: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || "Failed to register" };
    }
  }, []);

  const resendVerification = useCallback(async () => {
    if (!auth.currentUser) return { ok: false, error: "No user logged in" };
    try {
      await sendEmailVerification(auth.currentUser);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || "Failed to send verification email" };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || "Failed to send reset email" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, register, resetPassword, logout, resendVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
