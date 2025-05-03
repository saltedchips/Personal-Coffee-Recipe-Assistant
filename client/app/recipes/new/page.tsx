// client/app/recipes/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import { createRecipe, RecipeFormData } from "@/lib/api";

export default function NewRecipePage() {
  const router = useRouter();

  const handleCreate = async (data: RecipeFormData) => {
    const { id } = await createRecipe(data);
    router.push(`/recipes/${id}`);
  };

  return (
    <div className="min-h-screen p-6 bg-[var(--coffee-cream)]">
      <h1 className="text-3xl font-bold mb-6 text-[var(--coffee-espresso)]">
        Create New Recipe
      </h1>
      <RecipeForm onSubmit={handleCreate} />
    </div>
  );
}
