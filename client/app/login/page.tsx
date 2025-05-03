"use client";

import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();           // ← grab the context login

  const handleLogin = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    await login(email, password);        // ← tell the AuthProvider you’re logged in
    router.push("/");                    // ← go to dashboard (or wherever)
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--coffee-cream)]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-[var(--coffee-espresso)]">
          Login
        </h1>
        <AuthForm mode="login" onSubmit={handleLogin} />
      </div>
    </div>
  );
}
