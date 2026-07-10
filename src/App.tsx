import { useEffect, useMemo, useState } from "react";
import { CatFilter, RankFilter, cardBySlug, filterCards } from "./data";
import { useHashRoute } from "./hooks/useHashRoute";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { ListView } from "./components/ListView";
import { DetailView } from "./components/DetailView";
import { GuideView } from "./components/GuideView";
import { Splash } from "./components/Splash";

function loadReversed(): boolean {
  try {
    return localStorage.getItem("ts-reversed") === "1";
  } catch {
    return false;
  }
}

export default function App() {
  const route = useHashRoute();
  const [cat, setCat] = useState<CatFilter>("all");
  const [rank, setRank] = useState<RankFilter>("all");
  const [query, setQuery] = useState("");
  const [reversed, setReversed] = useState(loadReversed);

  useEffect(() => {
    try {
      localStorage.setItem("ts-reversed", reversed ? "1" : "0");
    } catch {
      // sem armazenamento disponível, o estado vive só nesta sessão
    }
  }, [reversed]);

  const cards = useMemo(() => filterCards(cat, rank, query), [cat, rank, query]);

  const detailCard = route.view === "card" ? cardBySlug(route.slug) : undefined;
  // O deslizar no detalhe percorre a lista do filtro activo. Se a carta
  // aberta não pertencer ao filtro (link directo), percorre as 78.
  const detailList = useMemo(() => {
    if (!detailCard) return cards;
    return cards.some((c) => c.slug === detailCard.slug) ? cards : filterCards("all", "all", "");
  }, [cards, detailCard]);

  return (
    <div className="app">
      <Splash />
      <Header reversed={reversed} onToggleReversed={() => setReversed((v) => !v)} />
      {route.view === "guide" ? (
        <GuideView />
      ) : (
        <ListView
          cards={cards}
          cat={cat}
          rank={rank}
          query={query}
          onCat={(c) => {
            setCat(c);
            if (c === "major") setRank("all");
          }}
          onRank={setRank}
          onQuery={setQuery}
        />
      )}
      {detailCard && <DetailView card={detailCard} list={detailList} reversed={reversed} />}
      <BottomNav route={route} />
    </div>
  );
}
