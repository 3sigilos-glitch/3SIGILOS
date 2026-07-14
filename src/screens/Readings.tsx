import { Link } from "react-router-dom";
import { Layers, ScrollText } from "lucide-react";
import { SPREADS, spreadById, positionsFor } from "../data/spreads";
import { listReadings } from "../lib/readings";

export function Readings() {
  const readings = listReadings();

  return (
    <main className="readings">
      <header className="journey-head">
        <h1>Leituras</h1>
        <p>
          As cartas tiram-se sempre no teu baralho físico. Aqui inseres o que saiu na mesa e a
          app ajuda-te a interpretar. Nada é sorteado.
        </p>
      </header>

      <h2 className="readings-heading">
        <Layers size={16} /> Nova leitura
      </h2>
      <div className="home-shortcuts">
        {SPREADS.map((s) => {
          const nPos = s.framings ? s.framings[0].positions.length : s.positions!.length;
          return (
            <Link key={s.id} to={"/leituras/nova/" + s.id} className="shortcut">
              <span className="spread-count">{nPos}</span>
              <span>
                <strong>{s.name}</strong>
                <small>{s.about}</small>
              </span>
            </Link>
          );
        })}
      </div>

      <h2 className="readings-heading">
        <ScrollText size={16} /> Registo
      </h2>
      {readings.length === 0 ? (
        <p className="readings-empty">
          As tuas leituras ficam guardadas aqui, só neste dispositivo.
        </p>
      ) : (
        <ul className="history-list">
          {readings.map((r) => {
            const spread = spreadById(r.spreadId);
            const date = new Date(r.createdAt).toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            return (
              <li key={r.id}>
                <Link to={"/leituras/" + r.id} className="history-row">
                  <span className="history-date">{date}</span>
                  <span className="history-name">
                    {spread?.name ?? r.spreadId}
                    {r.question ? ": " + (r.question.length > 42 ? r.question.slice(0, 42) + "…" : r.question) : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

export { positionsFor };
