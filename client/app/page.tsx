// client/app/page.tsx
"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchEquipment, fetchRecipes, Recipe } from "@/lib/api";
import RecipeCard from "@/components/RecipeCard";

export default function DashboardPage() {
  const [recommendations, setRecommendations] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { equipment } = await fetchEquipment();
      const { recipes } = await fetchRecipes(equipment);
      setRecommendations(recipes);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--coffee-cream)] p-6">
        <h1 className="text-4xl font-bold mb-6 text-[var(--coffee-espresso)]">
          Dashboard
        </h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--coffee-espresso)]">
            Recommended for You
          </h2>

          {loading ? (
            <p className="text-[var(--coffee-espresso)]">Loading recommendations…</p>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          ) : (
            <p className="text-[var(--coffee-espresso)]">No recommendations found.</p>
          )}
        </section>
      </div>
    </ProtectedRoute>
  );
}
