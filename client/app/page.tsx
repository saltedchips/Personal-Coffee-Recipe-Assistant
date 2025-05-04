// client/app/page.tsx
"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchEquipment, fetchMasterRecipes, fetchRecipes, Recipe } from "@/lib/api";
import RecipeCard from "@/components/RecipeCard";

export default function DashboardPage() {
  const [equipment, setEquipment] = useState<string[]>([]);
  const [masterRecipes, setMasterRecipes] = useState<Recipe[]>([]);
  const [personalRecipes, setPersonalRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const equipmentData = await fetchEquipment();
        setEquipment(equipmentData.equipment);
        
        // Fetch both master and personal recipes
        const [masterRecipesData, personalRecipesData] = await Promise.all([
          fetchMasterRecipes(equipmentData.equipment),
          fetchRecipes(equipmentData.equipment)
        ]);
        
        setMasterRecipes(masterRecipesData || []);
        setPersonalRecipes(personalRecipesData.recipes || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setMasterRecipes([]);
        setPersonalRecipes([]);
      } finally {
        setLoading(false);
      }
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
            Your Recipes
          </h2>

          {loading ? (
            <p className="text-[var(--coffee-espresso)]">
              Loading your recipes…
            </p>
          ) : personalRecipes.length === 0 ? (
            <p className="text-[var(--coffee-espresso)]">
              You haven't created any recipes yet. Try creating one!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalRecipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--coffee-espresso)]">
            Recommended for You
          </h2>

          {loading ? (
            <p className="text-[var(--coffee-espresso)]">
              Loading recommendations…
            </p>
          ) : masterRecipes.length === 0 ? (
            <p className="text-[var(--coffee-espresso)]">
              No master recipes found for your equipment. Try adding more equipment to get recommendations.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {masterRecipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </ProtectedRoute>
  );
}
