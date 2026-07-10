import { useState } from "react";
import { Card, badgeText, cardImgURL, suitHex } from "../data";

interface Props {
  card: Card;
  width: number;
  eager?: boolean;
}

/* Gravura com moldura dourada, fade-in ao carregar e
   marcador dourado (numeral + glifo do naipe) se a imagem falhar. */
export function CardImg({ card, width, eager = false }: Props) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  return (
    <div className={"engraving " + state} aria-hidden={state === "error" ? undefined : true}>
      {state !== "ok" && (
        <div className="engraving-fb" role={state === "error" ? "img" : undefined} aria-label={state === "error" ? card.pt : undefined}>
          <span className="fb-badge">{badgeText(card)}</span>
          <span className="fb-glyph" style={{ background: suitHex(card.cat) }} />
        </div>
      )}
      {state !== "error" && (
        <img
          src={cardImgURL(card, width)}
          alt={"Gravura de 1909 da carta " + card.pt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
        />
      )}
    </div>
  );
}
