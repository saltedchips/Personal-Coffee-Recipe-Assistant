// client/components/RatingStars.tsx
"use client";

export default function RatingStars({
  rating,
  onRate,
}: {
  rating: number;
  onRate: (r: number) => void;
}) {
  return (
    <div className="flex space-x-1 text-2xl text-yellow-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onRate(n)} aria-label={`${n} star`}>
          {n <= rating ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
