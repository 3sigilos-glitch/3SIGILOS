export function Sigil({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="sigil">
      <circle cx="32" cy="32" r="29" fill="none" stroke="#b89344" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="25.5" fill="none" stroke="#b89344" strokeWidth="0.6" opacity="0.55" />
      <line x1="32" y1="11.5" x2="32" y2="52.5" stroke="#b89344" strokeWidth="1.1" />
      <path
        d="M 17.5 21.5 L 46.5 21.5 L 32 47.5 Z"
        fill="none"
        stroke="#e7cf92"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="17.5" cy="21.5" r="2.1" fill="#e7cf92" />
      <circle cx="46.5" cy="21.5" r="2.1" fill="#e7cf92" />
      <circle cx="32" cy="47.5" r="2.1" fill="#e7cf92" />
      <circle cx="32" cy="30.2" r="1.4" fill="#b89344" />
    </svg>
  );
}
