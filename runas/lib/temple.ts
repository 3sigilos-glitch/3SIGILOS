// Geometria do escudo do templo, portada do handoff do redesign:
// 2 linha, 3 triângulo, 4 quadrado, 5 pentagrama (step 2),
// 6 = dois triângulos sobrepostos, 7 estrela step 2,
// 8 = dois quadrados, 9 estrela step 2.

export interface ShieldPoint {
  /** vértice (círculo da vela) no raio interior */
  x: number;
  y: number;
  /** posição do glifo no raio exterior */
  tx: number;
  ty: number;
}

export interface ShieldGeometry {
  pts: ShieldPoint[];
  path: string;
}

export const SHAPE_NAME: Record<number, string> = {
  2: "linha",
  3: "triângulo",
  4: "quadrado",
  5: "pentagrama",
  6: "estrela de seis",
  7: "estrela de sete",
  8: "estrela de oito",
  9: "estrela de nove",
};

export function shieldGeometry(
  n: number,
  cx = 220,
  cy = 220,
  r1 = 152,
  r2 = 186
): ShieldGeometry {
  const pts: ShieldPoint[] = [];
  // Começa no topo (-90°), exceto com 2 runas: aí arranca em 0° para a
  // linha ficar na horizontal (uma runa à direita, outra à esquerda).
  const start = n === 2 ? 0 : -Math.PI / 2;
  for (let i = 0; i < n; i++) {
    const a = start + (i * 2 * Math.PI) / n;
    pts.push({
      x: cx + r1 * Math.cos(a),
      y: cy + r1 * Math.sin(a),
      tx: cx + r2 * Math.cos(a),
      ty: cy + r2 * Math.sin(a) + 6,
    });
  }
  const P = (p: ShieldPoint) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  const poly = (idx: number[]) =>
    "M" + idx.map((i) => P(pts[i])).join(" L") + (idx.length > 2 ? " Z" : "");

  let path = "";
  if (n === 2) path = poly([0, 1]);
  else if (n <= 4) path = poly(pts.map((_, i) => i));
  else if (n === 6) path = poly([0, 2, 4]) + " " + poly([1, 3, 5]);
  else if (n === 8) path = poly([0, 2, 4, 6]) + " " + poly([1, 3, 5, 7]);
  else {
    const idx: number[] = [];
    let i = 0;
    do {
      idx.push(i);
      i = (i + 2) % n;
    } while (i !== 0);
    path = poly(idx);
  }
  return { pts, path };
}
