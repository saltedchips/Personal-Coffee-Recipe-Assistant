"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import { fetchRecipeById, updateRecipe, saveAsMyVersion } from "@/lib/api";
import type { RecipeDetail, RecipeFormData } from "@/lib/api";

export default function EditRecipePage() {
  const params = useParams();
  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMasterRecipe, setIsMasterRecipe] = useState(false);

  useEffect(() => {
    const loadRecipe = async () => {
      if (!recipeId) {
        setError("Recipe ID is missing");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchRecipeById(recipeId);
        setRecipe(data);
        // Check if this is a master recipe (you'll need to add this field to your API response)
        setIsMasterRecipe(data.isMasterRecipe || false);
      } catch (err) {
        setError("Failed to load recipe");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [recipeId]);

  const handleSubmit = async (data: RecipeFormData) => {
    if (!recipeId) return;

    try {
      // If this is a master recipe, create a personal copy first
      if (isMasterRecipe) {
        const response = await saveAsMyVersion(recipeId, data);
        // After creating the personal copy, redirect to edit the new recipe
        router.push(`/recipes/${response.id}/edit`);
        return;
      }

      // Otherwise, update the recipe directly
      await updateRecipe(recipeId, data);
      router.push(`/recipes/${recipeId}`);
    } catch (err) {
      console.error("Failed to update recipe:", err);
      setError("Failed to update recipe");
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error || !recipe) {
    return <div className="container mx-auto p-4 text-red-500">{error || "Recipe not found"}</div>;
  }

  const formData: RecipeFormData = {
    title: recipe.title,
    description: recipe.description,
    equipment: recipe.equipment,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">
        {isMasterRecipe ? "Create Your Version" : "Edit Recipe"}
      </h1>
      {isMasterRecipe && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">
            This is a master recipe. Your changes will be saved as a personal copy.
          </p>
        </div>
      )}
      <RecipeForm
        initialData={formData}
        onSubmit={handleSubmit}
        submitLabel={isMasterRecipe ? "Create My Version" : "Update Recipe"}
        submittingLabel={isMasterRecipe ? "Creating..." : "Updating..."}
      />
    </div>
  );
}
