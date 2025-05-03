"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function NavBar() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <nav className="bg-[var(--coffee-espresso)]">
      <div className="container mx-auto flex items-center justify-between">
        {/* primary nav */}
        <div className="flex text-[var(--coffee-cream)]">
          <Link href="/" className="px-5 py-3 transition-colors hover:bg-[var(--coffee-caramel)]">Dashboard</Link>
          <Link href="/equipment" className="px-5 py-3 transition-colors hover:bg-[var(--coffee-caramel)]">Equipment</Link>
          <Link href="/recipes" className="px-5 py-3 transition-colors hover:bg-[var(--coffee-caramel)]">Recipes</Link>
          <Link href="/recipes/new" className="px-5 py-3 transition-colors hover:bg-[var(--coffee-caramel)]">New Recipe</Link>
        </div>

        {/* auth & admin */}
        <div className="flex items-center text-[var(--coffee-cream)]">
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin/recipes" className="px-5 py-3 transition-colors hover:bg-[var(--coffee-caramel)]">
                Admin
              </Link>
              )}
              <span className="font-medium px-5 py-2">{user}</span>
              <button 
                onClick={logout} 
                className="px-5 py-3 transition-colors hover:bg-[var(--coffee-caramel)]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-5 py-3 transition-colors hover:bg-[var(--coffee-caramel)]">
                Login
              </Link>
              <Link href="/register" className="px-5 py-3 transition-colors hover:bg-[var(--coffee-caramel)]">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
