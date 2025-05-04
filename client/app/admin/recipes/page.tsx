// client/app/admin/recipes/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAllRecipes, deleteMasterRecipe } from "@/lib/api";
import type { RecipeDetail } from "@/lib/api";

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<RecipeDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllRecipes().then(({ recipes }) => {
      setRecipes(recipes);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Really delete this recipe?")) return;
    await deleteMasterRecipe(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--coffee-cream)]">
        <p className="text-[var(--coffee-espresso)]">
          Loading admin recipes…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[var(--coffee-cream)]">
      <h1 className="text-3xl font-bold mb-4 text-[var(--coffee-espresso)]">
        Admin: Master Recipes
      </h1>

      <Link
        href="/admin/recipes/new"
        className="btn-coffee mb-6 inline-block"
      >
        + Add New Master Recipe
      </Link>

      {recipes.length === 0 ? (
        <p className="text-[var(--coffee-espresso)]">
          No recipes in master DB.
        </p>
      ) : (
        <div className="space-y-4">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between bg-white p-4 rounded-lg shadow"
            >
              <div>
                <h2 className="text-xl font-semibold text-[var(--coffee-espresso)]">
                  {r.title}
                </h2>
                <p className="text-sm text-gray-600">{r.description}</p>
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/admin/recipes/${r.id}/edit`}
                  className="px-3 py-1 border rounded hover:bg-[var(--coffee-latte)]"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="px-3 py-1 border rounded text-red-600 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
