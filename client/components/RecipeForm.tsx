"use client";

import { useEffect, useState } from "react";
import { fetchAllEquipment, RecipeFormData } from "@/lib/api";

interface RecipeFormProps {
  initialData?: RecipeFormData;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  submitLabel?: string;
  submittingLabel?: string;
}

export default function RecipeForm({
  initialData,
  onSubmit,
  submitLabel = "Create Recipe",
  submittingLabel = "Creating…",
}: RecipeFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>(initialData?.equipment || []);
  const [ingredients, setIngredients] = useState<string[]>(initialData?.ingredients || [""]);
  const [instructions, setInstructions] = useState<string[]>(initialData?.instructions || [""]);
  const [submitting, setSubmitting] = useState(false);

  // Load equipment options
  useEffect(() => {
    fetchAllEquipment().then((d) => setEquipmentOptions(d.equipment));
  }, []);

  const toggleEquip = (item: string) =>
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );

  const updateArray = (
    list: string[],
    idx: number,
    value: string,
    setter: (v: string[]) => void
  ) => {
    const copy = [...list];
    copy[idx] = value;
    setter(copy);
  };

  const addField = (setter: (v: string[]) => void) =>
    setter((prev) => [...prev, ""]);

  const removeField = (idx: number, setter: (v: string[]) => void) =>
    setter((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({ title, description, equipment, ingredients, instructions });
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-[var(--coffee-cream)] p-6 rounded-lg shadow"
    >
      {/* Title & Description */}
      <div>
        <label className="block font-semibold mb-1">Title</label>
        <input
          className="w-full p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Description</label>
        <textarea
          className="w-full p-2 border rounded"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {/* Equipment Multi-Select */}
      <div>
        <label className="block font-semibold mb-2">Equipment</label>
        <div className="flex flex-wrap gap-2">
          {equipmentOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleEquip(item)}
              className={`px-3 py-1 border rounded ${
                equipment.includes(item)
                  ? "bg-[var(--coffee-espresso)] text-[var(--coffee-cream)]"
                  : "bg-white text-[var(--coffee-espresso)] hover:bg-[var(--coffee-latte)]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block font-semibold mb-2">Ingredients</label>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="flex-1 p-2 border rounded"
                value={ing}
                onChange={(e) =>
                  updateArray(ingredients, i, e.target.value, setIngredients)
                }
                required
              />
              <button
                type="button"
                onClick={() => removeField(i, setIngredients)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addField(setIngredients)}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add Ingredient
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="block font-semibold mb-2">Instructions</label>
        <div className="space-y-2">
          {instructions.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <textarea
                className="flex-1 p-2 border rounded"
                rows={2}
                value={step}
                onChange={(e) =>
                  updateArray(instructions, i, e.target.value, setInstructions)
                }
                required
              />
              <button
                type="button"
                onClick={() => removeField(i, setInstructions)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addField(setInstructions)}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add Step
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className={`btn-coffee w-full text-center ${submitting ? "opacity-50" : ""}`}
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
