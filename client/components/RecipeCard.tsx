// client/components/RecipeCard.tsx
"use client";

import Link from "next/link";
import { Recipe } from "@/lib/api";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="border-2 rounded-lg overflow-hidden bg-white shadow-md hover:shadow-xl transition">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2 text-[var(--coffee-espresso)]">
          {recipe.title}
        </h2>
        <p className="text-sm text-gray-600 mb-4">{recipe.description}</p>
        <Link href={`/recipes/${recipe.id}`}>
          <button className="btn-coffee">View Recipe</button>
        </Link>
      </div>
    </div>
  );
}
