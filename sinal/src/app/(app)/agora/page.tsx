import { listarHoje } from "./acoes";
import Agora from "./Agora";

export const dynamic = "force-dynamic";

// Agora, fase 4. Escolher uma coisa, um toque, e comecar.
export default async function PaginaAgora() {
  const candidatas = await listarHoje();
  return <Agora candidatas={candidatas} />;
}
