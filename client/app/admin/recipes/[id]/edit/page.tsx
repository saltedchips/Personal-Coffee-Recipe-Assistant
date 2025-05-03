"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RecipeForm from "@/components/RecipeForm";
import {
  fetchRecipeById,
  updateMasterRecipe,
  RecipeFormData,
  RecipeDetail,
} from "@/lib/api";

export default function EditMasterRecipePage() {
  const { id } = useParams();
  const router = useRouter();
  const [initialData, setInitialData] = useState<RecipeFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const detail: RecipeDetail = await fetchRecipeById(id);
      const { title, description, equipment, ingredients, instructions } = detail;
      setInitialData({ title, description, equipment, ingredients, instructions });
      setLoading(false);
    })();
  }, [id]);

  if (loading || !initialData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--coffee-cream)]">
        <p className="text-[var(--coffee-espresso)]">Loading recipe…</p>
      </div>
    );
  }

  const handleUpdate = async (data: RecipeFormData) => {
    await updateMasterRecipe(id, data);
    router.push("/admin/recipes");
  };

  return (
    <div className="min-h-screen p-6 bg-[var(--coffee-cream)]">
      <h1 className="text-3xl font-bold mb-6 text-[var(--coffee-espresso)]">
        Edit Master Recipe
      </h1>
      <RecipeForm
        initialData={initialData}
        onSubmit={handleUpdate}
        submitLabel="Update Master Recipe"
        submittingLabel="Updating…"
      />
    </div>
  );
}
