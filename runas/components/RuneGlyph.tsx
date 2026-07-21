import { GEO } from "@/lib/geo";

// Desenha a runa em SVG a partir do GEO, mantendo os mesmos traços do
// protótipo (viewBox 0 0 44 88, traço 5, pontas redondas; Wyrd é círculo).
export default function RuneGlyph({
  id,
  className = "",
}: {
  id: number;
  className?: string;
}) {
  const g = GEO[id];
  return (
    <svg
      viewBox="0 0 44 88"
      aria-hidden="true"
      className={`rune-engraved ${className}`}
      fill="none"
    >
      {g === "CIRCLE" ? (
        <circle cx="22" cy="44" r="15" stroke="currentColor" strokeWidth="4.5" />
      ) : (
        g.map((p, i) => (
          <polyline
            key={i}
            points={p}
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))
      )}
    </svg>
  );
}
