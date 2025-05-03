import React, { useState, useEffect } from 'react';
import { fetchAllRecipes } from '@/lib/api';
import type { RecipeDetail } from '@/lib/api';

export default function AdminPage() {
  const [recipes, setRecipes] = useState<RecipeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const data = await fetchAllRecipes();
        setRecipes(data.recipes);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipes');
      } finally {
        setLoading(false);
      }
    }
    loadRecipes();
  }, []);

  if (loading) {
    return <div>Loading admin recipes...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Recipes</h1>
      <div className="grid gap-4">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="border p-4 rounded">
            <h2 className="text-xl font-semibold">{recipe.title}</h2>
            <p className="text-gray-600">{recipe.description}</p>
            <div className="mt-2">
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {recipe.isMasterRecipe ? 'Master Recipe' : 'Personal Recipe'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 