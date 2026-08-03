import { createElement as h } from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Path,
  Line,
  Circle,
} from "@react-pdf/renderer";

// Documento clinico da bateria. Limpo, sem interpretacao, sem
// linguagem de diagnostico. Material bruto para levar a consulta.

export type RegistoPdf = {
  registado_em: string;
  social: number;
  sensorial: number;
  contexto: string[];
};

export type DadosPdf = {
  nome: string;
  dias: number;
  inicio: string; // data legivel
  fim: string;
  registos: RegistoPdf[];
};

const DIAS_PT = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];

const estilos = StyleSheet.create({
  pagina: { padding: 40, fontSize: 10, color: "#1a1a1a", fontFamily: "Helvetica" },
  titulo: { fontSize: 18, marginBottom: 2, fontFamily: "Helvetica-Bold" },
  sub: { fontSize: 10, color: "#555", marginBottom: 16 },
  seccao: { fontSize: 12, marginTop: 18, marginBottom: 8, fontFamily: "Helvetica-Bold" },
  linhaTabela: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ddd", paddingVertical: 3 },
  cabTabela: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#999", paddingVertical: 3 },
  cData: { width: "20%" },
  cHora: { width: "12%" },
  cVal: { width: "14%", textAlign: "center" },
  cCtx: { width: "40%" },
  cabTexto: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  celula: { fontSize: 9 },
  resumoLinha: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  nota: { fontSize: 8, color: "#888", marginTop: 24 },
});

function grafico(registos: RegistoPdf[], dias: number) {
  const W = 515;
  const H = 160;
  const L = 30;
  const R = 10;
  const T = 10;
  const B = 24;
  const areaW = W - L - R;
  const areaH = H - T - B;

  const hoje = new Date();
  const buckets: { social: number | null; sensorial: number | null; rot: string }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    const chave = d.toISOString().slice(0, 10);
    const doDia = registos.filter((r) => new Date(r.registado_em).toISOString().slice(0, 10) === chave);
    const media = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
    buckets.push({
      social: media(doDia.map((r) => r.social)),
      sensorial: media(doDia.map((r) => r.sensorial)),
      rot: `${d.getDate()}`,
    });
  }

  const x = (i: number) => L + (areaW * i) / Math.max(1, dias - 1);
  const y = (v: number) => T + areaH * (1 - (v - 1) / 4);

  const serie = (chave: "social" | "sensorial", cor: string) => {
    const pts = buckets
      .map((b, i) => ({ v: b[chave], i }))
      .filter((p) => p.v !== null)
      .map((p) => ({ x: x(p.i), y: y(p.v as number) }));
    if (pts.length === 0) return [];
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
    const elementos: React.ReactElement[] = [h(Path, { key: `p-${chave}`, d, stroke: cor, strokeWidth: 1.5, fill: "none" })];
    pts.forEach((p, i) => elementos.push(h(Circle, { key: `c-${chave}-${i}`, cx: p.x, cy: p.y, r: 2, fill: cor })));
    return elementos;
  };

  const grelha = [1, 2, 3, 4, 5].map((v) =>
    h(Line, { key: `g${v}`, x1: L, y1: y(v), x2: W - R, y2: y(v), stroke: "#e5e5e5", strokeWidth: 0.5 })
  );

  const rotulos = buckets.map((b, i) =>
    h(Text as never, { key: `t${i}`, x: x(i) - 3, y: H - 8, style: { fontSize: 6, fill: "#999" } }, b.rot)
  );

  return h(
    Svg as never,
    { width: W, height: H, viewBox: `0 0 ${W} ${H}` },
    ...grelha,
    ...serie("social", "#5a7a55"),
    ...serie("sensorial", "#8a6480"),
    ...rotulos
  );
}

export function documentoBateria(dados: DadosPdf) {
  const { nome, dias, inicio, fim, registos } = dados;

  // Media por dia da semana
  const porDiaSemana = DIAS_PT.map((rot, idx) => {
    const doDia = registos.filter((r) => new Date(r.registado_em).getDay() === idx);
    const media = (v: number[]) => (v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "-");
    return { rot, social: media(doDia.map((r) => r.social)), sensorial: media(doDia.map((r) => r.sensorial)) };
  });

  // Dias abaixo de 2 (media diaria) e contextos frequentes nesses dias
  const hoje = new Date();
  let diasBaixosSocial = 0;
  let diasBaixosSensorial = 0;
  const ctxBaixos: Record<string, number> = {};
  for (let i = 0; i < dias; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    const chave = d.toISOString().slice(0, 10);
    const doDia = registos.filter((r) => new Date(r.registado_em).toISOString().slice(0, 10) === chave);
    if (doDia.length === 0) continue;
    const mSoc = doDia.reduce((a, r) => a + r.social, 0) / doDia.length;
    const mSen = doDia.reduce((a, r) => a + r.sensorial, 0) / doDia.length;
    if (mSoc < 2) diasBaixosSocial++;
    if (mSen < 2) diasBaixosSensorial++;
    if (mSoc < 2 || mSen < 2) {
      doDia.forEach((r) => r.contexto.forEach((c) => (ctxBaixos[c] = (ctxBaixos[c] ?? 0) + 1)));
    }
  }
  const topCtx = Object.entries(ctxBaixos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c, n]) => `${c} (${n})`)
    .join(", ");

  const linhasTabela = registos
    .slice()
    .sort((a, b) => +new Date(b.registado_em) - +new Date(a.registado_em))
    .map((r, i) => {
      const d = new Date(r.registado_em);
      return h(
        View,
        { key: i, style: estilos.linhaTabela },
        h(Text, { style: [estilos.cData, estilos.celula] }, d.toLocaleDateString("pt-PT")),
        h(Text, { style: [estilos.cHora, estilos.celula] }, d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })),
        h(Text, { style: [estilos.cVal, estilos.celula] }, String(r.social)),
        h(Text, { style: [estilos.cVal, estilos.celula] }, String(r.sensorial)),
        h(Text, { style: [estilos.cCtx, estilos.celula] }, r.contexto.join(", "))
      );
    });

  return h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: estilos.pagina },
      h(Text, { style: estilos.titulo }, `Bateria, ${nome}`),
      h(Text, { style: estilos.sub }, `Periodo: ${inicio} a ${fim}  (${dias} dias)  Registos: ${registos.length}`),

      h(Text, { style: estilos.seccao }, "Evolucao"),
      grafico(registos, dias),
      h(
        View,
        { style: { flexDirection: "row", gap: 16, marginTop: 4 } },
        h(Text, { style: { fontSize: 8, color: "#5a7a55" } }, "Social"),
        h(Text, { style: { fontSize: 8, color: "#8a6480" } }, "Sensorial")
      ),

      h(Text, { style: estilos.seccao }, "Resumo"),
      h(
        View,
        null,
        ...porDiaSemana.map((d, i) =>
          h(
            View,
            { key: i, style: estilos.resumoLinha },
            h(Text, null, d.rot),
            h(Text, null, `social ${d.social}   sensorial ${d.sensorial}`)
          )
        )
      ),
      h(View, { style: { marginTop: 8 } },
        h(Text, null, `Dias com media social abaixo de 2: ${diasBaixosSocial}`),
        h(Text, null, `Dias com media sensorial abaixo de 2: ${diasBaixosSensorial}`),
        h(Text, null, `Contextos mais frequentes nos dias baixos: ${topCtx || "sem dados"}`)
      ),

      h(Text, { style: estilos.seccao }, "Registos"),
      h(
        View,
        { style: estilos.cabTabela },
        h(Text, { style: [estilos.cData, estilos.cabTexto] }, "Data"),
        h(Text, { style: [estilos.cHora, estilos.cabTexto] }, "Hora"),
        h(Text, { style: [estilos.cVal, estilos.cabTexto] }, "Social"),
        h(Text, { style: [estilos.cVal, estilos.cabTexto] }, "Sensorial"),
        h(Text, { style: [estilos.cCtx, estilos.cabTexto] }, "Contexto")
      ),
      ...linhasTabela,

      h(Text, { style: estilos.nota }, "Documento gerado pela app Mare. Valores em escala de 1 a 5. Sem interpretacao clinica.")
    )
  );
}
