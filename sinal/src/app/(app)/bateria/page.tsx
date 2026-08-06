import { criarClienteServidor } from "@/lib/supabase/server";
import GraficoSemana, { type Registo } from "@/components/GraficoSemana";
import FormularioBateria from "./FormularioBateria";
import ExportarPdf from "./ExportarPdf";
import Ecra from "@/components/Ecra";

export const dynamic = "force-dynamic";

// Bateria, o separador por omissao. Maior valor, menor esforco.
export default async function PaginaBateria() {
  const supabase = await criarClienteServidor();

  const desde = new Date();
  desde.setDate(desde.getDate() - 7);

  const { data } = await supabase
    .from("registos_bateria")
    .select("registado_em, social, sensorial")
    .gte("registado_em", desde.toISOString())
    .order("registado_em", { ascending: true });

  const registos = (data ?? []) as Registo[];

  return (
    <Ecra
      titulo="Bateria"
      proposito="Quanta capacidade te resta agora. Dois arcos, uma etiqueta se quiseres, registar. Nao ha respostas certas nem erradas."
    >
      <FormularioBateria />

      <section className="flex flex-col gap-3 border-t border-[var(--color-traco)] pt-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium tracking-tight">Ultima semana</h2>
          <p className="text-sm text-[var(--color-tinta-fraca)] leading-relaxed">
            A forma das duas linhas, so para veres. Nao e para comparar com
            ontem nem para melhorar.
          </p>
        </div>
        <GraficoSemana registos={registos} dias={7} />
      </section>

      <div className="pb-2 flex flex-col gap-2 items-center">
        <ExportarPdf />
        <p className="text-xs text-[var(--color-tinta-fraca)] text-center leading-relaxed">
          Documento limpo para levar a consulta, sem interpretacao.
        </p>
      </div>
    </Ecra>
  );
}
