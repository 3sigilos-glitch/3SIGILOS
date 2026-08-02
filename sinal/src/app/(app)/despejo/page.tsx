import { Suspense } from "react";
import { contarPorTriar } from "./acoes";
import Despejo from "./Despejo";

export const dynamic = "force-dynamic";

// Despejo. Capturar nao e organizar. Um botao, falar, largar.
export default async function PaginaDespejo() {
  const contagem = await contarPorTriar();

  return (
    <Suspense fallback={null}>
      <Despejo contagemInicial={contagem} />
    </Suspense>
  );
}
