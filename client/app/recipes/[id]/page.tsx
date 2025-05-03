// client/app/recipes/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchRecipeById,
  saveAsMyVersion,
  saveRating,
  addNote,
  RecipeDetail,
  deleteNote
} from "@/lib/api";
import RatingStars from "@/components/RatingStars";
import { useRouter } from "next/navigation";

export default function RecipeDetailPage() {
  const params = useParams();
  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [savingVersion, setSavingVersion] = useState(false);
  const router = useRouter();

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
        setRating(data.userRating || 0);
        setNotes(data.userNotes || []);
      } catch (err) {
        setError("Failed to load recipe");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [recipeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--coffee-cream)]">
        <p className="text-[var(--coffee-espresso)]">Loading recipe…</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen p-6 bg-[var(--coffee-cream)]">
        <p className="text-[var(--coffee-espresso)]">Recipe not found.</p>
      </div>
    );
  }

  const handleRate = async (stars: number) => {
    setRecipe({ ...recipe, userRating: stars });
    await saveRating(recipe.id, stars);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await addNote(recipe.id, noteText);
    setNotes([...notes, noteText]);
    setNoteText("");
  };

  const handleSaveVersion = async () => {
    setSavingVersion(true);
    await saveAsMyVersion(recipe.id);
    setSavingVersion(false);
    alert("Saved as your personal version!");
  };

  return (
    <div className="min-h-screen p-6 bg-[var(--coffee-cream)] text-[var(--coffee-espresso)]">
      <h1 className="text-3xl font-bold mb-4">{recipe.title}</h1>
      <p className="mb-6">{recipe.description}</p>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Ingredients</h2>
        <ul className="list-disc list-inside">
          {recipe.ingredients.map((ing, i) => (
            <li key={i}>{ing}</li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal list-inside space-y-1">
          {recipe.instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Your Rating</h2>
        <RatingStars rating={rating} onRate={handleRate} />
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Your Notes</h2>
        <textarea
          className="w-full p-2 border rounded mb-2"
          rows={3}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />
        <button
          onClick={handleAddNote}
          className="btn-coffee mb-4"
        >
          Add Note
        </button>
        <div className="space-y-1">
        {notes.map((n, i) => (
            <div
            key={i}
            className="flex items-center justify-between bg-white p-2 rounded border"
            >
            <span>{n}</span>
            <button
                className="text-red-500 hover:text-red-700 ml-4"
                onClick={async () => {
                await deleteNote(recipe.id, i);
                setNotes((prev) => prev.filter((_, idx) => idx !== i));
                }}
            >
                Delete
            </button>
            </div>
        ))}
        </div>

      </section>

      <div className="flex gap-4">
        <button
          onClick={handleSaveVersion}
          disabled={savingVersion}
          className="btn-coffee"
        >
          {savingVersion ? "Saving…" : "Save as My Version"}
        </button>
        <button
          onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
          className="btn-coffee"
        >
          Edit Recipe
        </button>
      </div>
    </div>
  );
}
