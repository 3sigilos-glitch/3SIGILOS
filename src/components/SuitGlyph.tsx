import { Cat } from "../data";

/* Símbolos dos naipes desenhados à mão: bastão, taça, espada e pentáculo. */
export function SuitGlyph({ cat, size = 20 }: { cat: Cat; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (cat) {
    case "wands":
      return (
        <svg {...common}>
          <line x1="7" y1="20" x2="17" y2="4" />
          <path d="M 17 4 C 15.5 4.5 14.6 4.2 14.2 3" />
          <path d="M 17 4 C 17.2 5.6 18 6.3 19.2 6.4" />
          <path d="M 14.8 7.6 C 13.6 7.9 12.9 7.6 12.5 6.7" />
        </svg>
      );
    case "cups":
      return (
        <svg {...common}>
          <path d="M 5 4 L 19 4 C 19 9.5 16 12 12 12 C 8 12 5 9.5 5 4 Z" />
          <line x1="12" y1="12" x2="12" y2="18" />
          <line x1="7.5" y1="20" x2="16.5" y2="20" />
        </svg>
      );
    case "swords":
      return (
        <svg {...common}>
          <path d="M 12 2.5 L 13.6 6 L 13.6 15 L 12 17 L 10.4 15 L 10.4 6 Z" />
          <line x1="7" y1="15.5" x2="17" y2="15.5" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M 12 5.4 L 13.9 10.2 L 18.4 10.2 L 14.7 13.2 L 16.2 18 L 12 15 L 7.8 18 L 9.3 13.2 L 5.6 10.2 L 10.1 10.2 Z" strokeWidth="1.3" />
        </svg>
      );
  }
}
