"use client";

import { useRouter } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import { createMasterRecipe, RecipeFormData } from "@/lib/api";

export default function NewMasterRecipePage() {
  const router = useRouter();

  const handleCreate = async (data: RecipeFormData) => {
    await createMasterRecipe(data);
    router.push("/admin/recipes");
  };

  return (
    <div className="min-h-screen p-6 bg-[var(--coffee-cream)]">
      <h1 className="text-3xl font-bold mb-6 text-[var(--coffee-espresso)]">
        Add Master Recipe
      </h1>
      <RecipeForm
        onSubmit={handleCreate}
        submitLabel="Create Master Recipe"
        submittingLabel="Creating…"
      />
    </div>
  );
}
