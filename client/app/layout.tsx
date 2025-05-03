// client/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import NavBar from "@/components/NavBar";

// wire Google fonts into your CSS vars
const fontBody = Geist({
  variable: "--font-body",
  subsets: ["latin"],
});
const fontHeading = Geist_Mono({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Coffee Recipe Assistant",
  description: "Discover coffee recipes tailored to your equipment and taste.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontBody.variable} ${fontHeading.variable}`}>
      <body className="min-h-screen bg-[var(--coffee-cream)] text-[var(--coffee-espresso)]">
      <AuthProvider>
        <NavBar />
        {children}
      </AuthProvider>
      </body>
    </html>
  );
}
