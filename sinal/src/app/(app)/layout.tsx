import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { emailPermitido } from "@/lib/supabase/permitido";
import BarraInferior from "@/components/BarraInferior";

// Grupo autenticado. Quem nao tem sessao volta para a entrada, e quem
// nao esta na lista da casa tambem. A barra inferior vive aqui, por
// baixo de todos os separadores.
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

  if (!(await emailPermitido(user.email))) {
    redirect("/?erro=privada");
  }

  return (
    <div className="min-h-dvh">
      <div className="max-w-md mx-auto pb-24">{children}</div>
      <BarraInferior />
    </div>
  );
}
