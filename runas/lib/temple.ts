// Geometria sagrada do Montador de Templo, portada da funcao templeShape
// do prototipo: 2 linha, 3 triangulo, 4 quadrado, 5 pentagrama,
// 6 estrela de seis (dois triangulos), 7 a 9 estrelas maiores.

export type Point = [number, number];

export interface TempleShape {
  pts: Point[];
  paths: Point[][];
}

export function templeShape(n: number, cx: number, cy: number, R: number): TempleShape {
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
    pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  const step: Record<number, number> = { 2: 1, 3: 1, 4: 1, 5: 2, 7: 3, 8: 3, 9: 4 };
  const paths: Point[][] = [];
  if (n === 6) {
    paths.push([pts[0], pts[2], pts[4], pts[0]]);
    paths.push([pts[1], pts[3], pts[5], pts[1]]);
  } else if (n === 2) {
    paths.push([pts[0], pts[1]]);
  } else {
    const s = step[n] || 1;
    const order: Point[] = [];
    let idx = 0;
    for (let i = 0; i < n; i++) {
      order.push(pts[idx]);
      idx = (idx + s) % n;
    }
    order.push(order[0]);
    paths.push(order);
  }
  return { pts, paths };
}
