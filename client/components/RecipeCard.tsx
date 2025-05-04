// client/components/RecipeCard.tsx
"use client";

import Link from "next/link";
import { Recipe, saveAsMyVersion } from "@/lib/api";

export default function RecipeCard({
  recipe,
}: {
  recipe: Recipe & { isMasterRecipe: boolean };
}) {
  return (
    <div className="border-2 rounded-lg overflow-hidden bg-white shadow-md hover:shadow-xl transition flex flex-col h-full">
      <div className="p-4 flex flex-col flex-grow">
        <h2 className="text-xl font-semibold mb-2 text-[var(--coffee-espresso)]">
          {recipe.title}
        </h2>
        <p className="text-sm text-gray-600 mb-4 flex-grow">
          {recipe.description}
        </p>
        <div className="mt-auto space-x-2">
          <Link href={`/recipes/${recipe.id}`}>
            <button className="btn-coffee">View Recipe</button>
          </Link>

          {!recipe.isMasterRecipe && (
            <Link href={`/recipes/${recipe.id}/edit`} className="inline-block rounded-lg">
              <button className="btn-coffee-invert w-full">Update Recipe</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
