// client/app/recipes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { fetchEquipment, fetchRecipes, Recipe } from "@/lib/api";
import RecipeCard from "@/components/RecipeCard";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { equipment } = await fetchEquipment();
      const { recipes: recs } = await fetchRecipes(equipment);
      setRecipes(recs);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--coffee-cream)]">
        <p className="text-lg text-[var(--coffee-espresso)]">Loading recipes…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[var(--coffee-cream)]">
      <h1 className="text-3xl font-bold mb-6 text-[var(--coffee-espresso)]">
        My Recipes
      </h1>

      {recipes.length === 0 ? (
        <p className="text-[var(--coffee-espresso)]">No recipes found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  );
}
