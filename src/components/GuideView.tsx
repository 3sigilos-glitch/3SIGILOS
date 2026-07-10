import { GUIDE_NUMS, GUIDE_SUITS } from "../data";

export function GuideView() {
  return (
    <main className="guide">
      <section>
        <h2 className="guide-heading">Os naipes</h2>
        <p className="guide-intro">
          Cada naipe dos Arcanos Menores rege um plano da vida e responde a um elemento.
        </p>
        <div className="guide-suits">
          {GUIDE_SUITS.map((s) => (
            <article key={s.en} className="guide-suit" style={{ "--suit": s.hex } as React.CSSProperties}>
              <header>
                <h3>{s.name}</h3>
                <span className="suit-meta">
                  {s.en} · {s.el}
                </span>
              </header>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="guide-heading">Os números</h2>
        <p className="guide-intro">
          Do Ás ao Rei, cada número conta um passo do mesmo percurso, em qualquer naipe.
        </p>
        <dl className="guide-nums">
          {GUIDE_NUMS.map((x) => (
            <div key={x.n} className="guide-num">
              <dt>{x.n}</dt>
              <dd>{x.body}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
