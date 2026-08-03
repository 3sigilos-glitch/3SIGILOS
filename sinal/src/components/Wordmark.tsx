// O wordmark "maré", desenhado, não composto.
//
// As letras sao traco unico com pontas redondas, a mesma construcao das
// ondas do icone: monolinha, geometrica, sem contraste de espessura.
// O acento e um agudo (nunca um til, que daria outra palavra), tracado
// com uma leve curva ascendente e no verde musgo, para o olho o ligar
// a onda social do simbolo.

export default function Wordmark({
  className,
  titulo = "Maré",
}: {
  className?: string;
  titulo?: string;
}) {
  const traco = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 7.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="6 19 260 94"
      className={className}
      role="img"
      aria-label={titulo}
    >
      {/* m */}
      <path
        d="M14,105 L14,58 C14,49 23,46 31,46 C40,46 47,52 47,62 L47,105
           M47,58 C47,49 56,46 64,46 C73,46 80,52 80,62 L80,105"
        {...traco}
      />
      {/* a, bojo e haste com saida suave */}
      <path
        d="M149,76 C149,91 137,103 122,103 C107,103 95,91 95,76
           C95,61 107,49 122,49 C137,49 149,61 149,76"
        {...traco}
      />
      <path d="M149,49 L149,97 C149,102 152,105 156,105" {...traco} />
      {/* r */}
      <path d="M170,105 L170,48 M170,63 C170,52 180,45 194,46" {...traco} />
      {/* e */}
      <path d="M205,76 L258,76" {...traco} />
      <path
        d="M258,76 C258,61 246,49 232,49 C217,49 205,61 205,76
           C205,91 217,103 232,103 C241,103 249,99 254,92"
        {...traco}
      />
      {/* acento agudo, no verde da onda social */}
      <path
        d="M219,40 C227,35 232,31 239,26"
        fill="none"
        stroke="var(--color-ac-bateria)"
        strokeWidth={6}
        strokeLinecap="round"
      />
    </svg>
  );
}
