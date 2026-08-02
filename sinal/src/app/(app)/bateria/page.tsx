import { criarClienteServidor } from "@/lib/supabase/server";
import GraficoSemana, { type Registo } from "@/components/GraficoSemana";
import FormularioBateria from "./FormularioBateria";
import ExportarPdf from "./ExportarPdf";

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
    <main className="px-5 pt-6 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">Bateria</h1>

      <FormularioBateria />

      <section className="flex flex-col gap-3 border-t border-[var(--color-traco)] pt-6">
        <h2 className="text-base text-[var(--color-tinta-fraca)] uppercase tracking-wide">
          Ultima semana
        </h2>
        <GraficoSemana registos={registos} dias={7} />
      </section>

      <div className="pb-2">
        <ExportarPdf />
      </div>
    </main>
  );
}
