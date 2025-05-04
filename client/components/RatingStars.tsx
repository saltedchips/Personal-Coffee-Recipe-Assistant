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
    <div className="flex space-x-1 text-2xl">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onRate(n)}
          className="transition-colors duration-200"
          aria-label={`${n} star`}
        >
          <span className={n <= rating ? "text-yellow-500" : "text-gray-300"}>
            {n <= rating ? "★" : "☆"}
          </span>
        </button>
      ))}
    </div>
  );
}
