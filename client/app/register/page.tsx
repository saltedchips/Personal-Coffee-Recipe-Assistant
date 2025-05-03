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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Register</h1>
        <AuthForm mode="register" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
