"use client";

import { useEffect, useState } from "react";
import { fetchEquipment, fetchAllEquipment, saveEquipment } from "@/lib/api";

export default function EquipmentPage() {
  const [allEquipment, setAllEquipment] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Load all equipment options and user's selected equipment
  useEffect(() => {
    Promise.all([
      fetchAllEquipment().then((d) => setAllEquipment(d.equipment)),
      fetchEquipment().then((d) => setSelected(d.equipment))
    ]);
  }, []);

  const toggle = (item: string) =>
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );

  const handleSave = async () => {
    setSaving(true);
    await saveEquipment(selected);
    setSaving(false);
    alert("Saved!");
  };

  return (
    <div className="min-h-screen p-6 bg-[var(--coffee-cream)]">
      <h1 className="text-3xl font-bold mb-6 text-[var(--coffee-espresso)]">
        Your Equipment
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {allEquipment.map((item) => (
          <button
            key={item}
            onClick={() => toggle(item)}
            className={[
              "p-4 border-2 rounded-lg font-medium transition",
              "border-[var(--coffee-espresso)]",
              selected.includes(item)
                ? "bg-[var(--coffee-espresso)] text-[var(--coffee-cream)]"
                : "bg-white text-[var(--coffee-espresso)] hover:bg-[var(--coffee-latte)]",
            ].join(" ")}
          >
            {item}
          </button>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className={`mt-8 px-6 py-2 btn-coffee ${
          saving ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {saving ? "Saving…" : "Save Equipment"}
      </button>
    </div>
  );
}
