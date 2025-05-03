"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/AuthForm";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    await register(email, password);
    await login(email, password);
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--coffee-cream)]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-[var(--coffee-espresso)]">Register</h1>
        <AuthForm mode="register" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
