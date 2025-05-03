"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextValue {
  user: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const loginHandler = async (email: string, password: string) => {
    await import("@/lib/api").then((m) => m.login(email, password));
    setUser(email);
    // Check admin status after login
    const adminStatus = await import("@/lib/api").then((m) => m.isAdmin());
    setIsAdmin(adminStatus);
  };

  const logoutHandler = () => {
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, login: loginHandler, logout: logoutHandler }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
