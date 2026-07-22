"use client";

// Texto integral do manual, recolhível (fechado por defeito) para não
// atrapalhar o uso rápido no atendimento; quem estuda toca e expande.
// © Templus / Eduardo Gabriel. Uso pessoal de estudo.
export default function Ensinamento({
  title,
  text,
  small = false,
}: {
  title: string;
  text: string;
  small?: boolean;
}) {
  return (
    <details className="group" style={{ marginTop: small ? 8 : 12 }}>
      <summary
        className="font-cinzel"
        style={{
          cursor: "pointer",
          listStyle: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: small ? 12 : 13,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "var(--gold)",
          padding: "6px 0",
        }}
      >
        <span className="font-runic" aria-hidden style={{ fontSize: small ? 12 : 14 }}>
          ᛟ
        </span>
        {title}
        <span
          aria-hidden
          style={{ marginLeft: "auto", transition: "transform .15s", color: "var(--text-4)" }}
          className="group-open:rotate-90"
        >
          ›
        </span>
      </summary>
      <div style={{ borderLeft: "2px solid rgba(201,168,106,0.35)", paddingLeft: 14, marginTop: 4 }}>
        {text.split("\n\n").map((p, i) => (
          <p
            key={i}
            style={{
              margin: i === 0 ? 0 : "10px 0 0",
              fontSize: small ? 15 : 16,
              lineHeight: 1.6,
              color: "var(--text-warm)",
              textWrap: "pretty",
            }}
          >
            {p}
          </p>
        ))}
        <p style={{ margin: "12px 0 0", fontSize: 13, fontStyle: "italic", color: "var(--text-4)" }}>
          Do manual de Magia Nórdica, Módulo Branco, de Eduardo Gabriel · Templus ©. Uso pessoal
          de estudo.
        </p>
      </div>
    </details>
  );
}
