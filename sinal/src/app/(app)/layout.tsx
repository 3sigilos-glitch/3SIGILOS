import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import BarraInferior from "@/components/BarraInferior";

// Grupo autenticado. Quem nao tem sessao volta para a entrada.
// A barra inferior vive aqui, por baixo de todos os separadores.
export default async function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-dvh">
      <div className="max-w-md mx-auto pb-24">{children}</div>
      <BarraInferior />
    </div>
  );
}
