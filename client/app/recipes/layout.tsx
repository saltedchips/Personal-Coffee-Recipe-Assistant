"use client";

import { ReactNode } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function RecipesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
