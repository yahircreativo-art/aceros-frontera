/**
 * Escenas isométricas de construcción en línea (edificio, fábrica, casa)
 * para el hero animado. Cada sólido se pinta de atrás hacia adelante con
 * sus caras rellenas del color del fondo, así tapa las aristas ocultas
 * (sin máscaras, que son costosas de animar).
 *
 * Cada sólido tiene un `orden` de obra (cimentación → columnas → vigas →
 * losas…). El hero usa ese orden para el retraso del trazo, de modo que la
 * estructura "se construye" por etapas.
 */

export type V3 = [number, number, number];
export type V2 = [number, number];
export type Eje = 'x' | 'y' | 'z';

/** Sólido "crudo" (serializable): lo vuelve a proyectar la cámara del Hero G. */
export interface SolidoDef {
  eje: Eje;
  perfil: V2[];
  a0: number;
  a1: number;
  orden: number;
  det: V3[][];
}

interface Solido {
  min: V3;
  max: V3;
  caras: V3[][];
  detalles: V3[][];
  orden: number;
  def: SolidoDef;
}

export interface TrazoEscena {
  d: string;
  tipo: 'cara' | 'detalle';
  /** Retraso del trazo en segundos. */
  retraso: number;
}

export interface Escena {
  id: string;
  nombre: string;
  spec: string;
  trazos: TrazoEscena[];
  /** Duración total del dibujo (s). */
  duracion: number;
  /** Punto (en el viewBox) de donde sale el humo, si hay chimenea. */
  humo?: V2;
}

export const ANCHO_ESCENA = 600;
export const ALTO_ESCENA = 470;
const MARGEN = 24;
const PASO_ORDEN = 0.32;

const C = Math.cos(Math.PI / 6);
const S = Math.sin(Math.PI / 6);
const proyectar = ([x, y, z]: V3): V2 => [(x - y) * C, (x + y) * S - z];

const a3 = (eje: Eje, u: number, v: number, a: number): V3 =>
  eje === 'x' ? [a, u, v] : eje === 'y' ? [u, a, v] : [u, v, a];

/** Prisma: perfil en los otros dos ejes (x→(y,z), y→(x,z), z→(x,y)) extruido de a0 a a1. */
function prisma(eje: Eje, perfil: V2[], a0: number, a1: number, orden: number, detalles: V3[][] = []): Solido {
  const area = perfil.reduce((s, [u1, v1], i) => {
    const [u2, v2] = perfil[(i + 1) % perfil.length];
    return s + (u1 * v2 - u2 * v1);
  }, 0);
  const caras: V3[][] = [];
  perfil.forEach(([u1, v1], i) => {
    const [u2, v2] = perfil[(i + 1) % perfil.length];
    const du = u2 - u1;
    const dv = v2 - v1;
    const nu = area > 0 ? dv : -dv;
    const nv = area > 0 ? -du : du;
    if (nu + nv <= 1e-6) return; // de espaldas al observador (1,1,1)
    caras.push([a3(eje, u1, v1, a0), a3(eje, u2, v2, a0), a3(eje, u2, v2, a1), a3(eje, u1, v1, a1)]);
  });
  caras.push(perfil.map(([u, v]) => a3(eje, u, v, a1))); // tapa (+eje): siempre visible
  const pts = caras.flat();
  const min: V3 = [0, 1, 2].map((k) => Math.min(...pts.map((p) => p[k]))) as V3;
  const max: V3 = [0, 1, 2].map((k) => Math.max(...pts.map((p) => p[k]))) as V3;
  return { min, max, caras, detalles, orden, def: { eje, perfil, a0, a1, orden, det: detalles } };
}

const caja = (min: V3, max: V3, orden: number, detalles: V3[][] = []) =>
  prisma('z', [[min[0], min[1]], [max[0], min[1]], [max[0], max[1]], [min[0], max[1]]], min[2], max[2], orden, detalles);

const cilindro = (cx: number, cy: number, r: number, z0: number, z1: number, orden: number, lados = 12, detalles: V3[][] = []) =>
  prisma('z', Array.from({ length: lados }, (_, i) => {
    const t = (i / lados) * Math.PI * 2;
    return [cx + Math.cos(t) * r, cy + Math.sin(t) * r] as V2;
  }), z0, z1, orden, detalles);

/* --- Detalles (ventanas, puertas, celosías) ------------------------------ */
/** Rectángulo sobre la cara +x (x fija) o +y (y fija). */
const rectX = (x: number, y0: number, y1: number, z0: number, z1: number): V3[] => [[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1], [x, y0, z0]];
const rectY = (y: number, x0: number, x1: number, z0: number, z1: number): V3[] => [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x0, y, z0]];
const lineasX = (x: number, y0: number, y1: number, z0: number, z1: number, n: number): V3[][] =>
  Array.from({ length: n }, (_, i) => { const z = z0 + ((i + 1) * (z1 - z0)) / (n + 1); return [[x, y0, z], [x, y1, z]] as V3[]; });
const zigzag = (fijo: Eje, valor: number, a0: number, a1: number, b0: number, b1: number, pasos: number, largoEnZ = true): V3[] => {
  const pts: V3[] = [];
  for (let i = 0; i <= pasos; i++) {
    const t = a0 + ((a1 - a0) * i) / pasos;
    const b = i % 2 ? b1 : b0;
    if (largoEnZ) pts.push(fijo === 'x' ? [valor, b, t] : [b, valor, t]);
    else pts.push(fijo === 'y' ? [t, valor, b] : [valor, t, b]);
  }
  return pts;
};

/* --- Escenas --------------------------------------------------------------- */
function edificio(): Solido[] {
  const s: Solido[] = [caja([-1.2, -1.2, -0.4], [13.2, 9.2, 0], 0)];
  const h = 3.2;
  const pisos = 4;
  for (let f = 0; f < pisos; f++) {
    const base = f * h + (f > 0 ? 0.25 : 0);
    const tope = (f + 1) * h;
    const o = 1 + f * 3;
    for (let i = 0; i <= 3; i++)
      for (let j = 0; j <= 2; j++) s.push(caja([i * 4 - 0.2, j * 4 - 0.2, base], [i * 4 + 0.2, j * 4 + 0.2, tope - 0.35], o));
    for (let j = 0; j <= 2; j++)
      for (let i = 0; i < 3; i++) s.push(caja([i * 4 + 0.2, j * 4 - 0.15, tope - 0.35], [(i + 1) * 4 - 0.2, j * 4 + 0.15, tope], o + 1));
    for (let i = 0; i <= 3; i++)
      for (let j = 0; j < 2; j++) s.push(caja([i * 4 - 0.15, j * 4 + 0.2, tope - 0.35], [i * 4 + 0.15, (j + 1) * 4 - 0.2, tope], o + 1));
    if (f < pisos - 1) {
      // Losa + cancelería en el piso terminado
      const ventanas = [0, 1, 2].map((i) => rectY(8.3, i * 4 + 0.6, (i + 1) * 4 - 0.6, base + 0.6, tope - 0.8));
      const ventanasX = [0, 1].map((j) => rectX(12.3, j * 4 + 0.6, (j + 1) * 4 - 0.6, base + 0.6, tope - 0.8));
      s.push(caja([-0.3, -0.3, tope], [12.3, 8.3, tope + 0.25], o + 2));
      if (f < pisos - 2) s.push(caja([-0.2, -0.2, base], [12.2, 8.2, tope - 0.36], o + 2, [...ventanas, ...ventanasX]));
    }
  }
  // Grúa torre
  const og = pisos * 3 + 1;
  s.push(caja([15, 3, 0], [15.8, 3.8, 18], og, [zigzag('x', 15.8, 0.4, 17.6, 3.05, 3.75, 22), zigzag('y', 3.8, 0.4, 17.6, 15.05, 15.75, 22)]));
  s.push(caja([4, 3.1, 18], [21, 3.7, 18.7], og + 1, [zigzag('y', 3.7, 4.2, 20.8, 18.05, 18.65, 26, false)]));
  s.push(caja([19.3, 2.9, 17.2], [21, 3.9, 18], og + 1));
  s.push(caja([15.1, 3.1, 18.7], [15.7, 3.7, 20.3], og + 1, [[[15.4, 3.4, 20.3], [6, 3.4, 18.7]], [[15.4, 3.4, 20.3], [20.5, 3.4, 18.7]]]));
  s.push(caja([7.7, 3.2, 14.2], [8.3, 3.6, 14.7], og + 2, [[[8, 3.4, 18], [8, 3.4, 14.7]]]));
  return s;
}

function fabrica(): Solido[] {
  const s: Solido[] = [caja([-1.2, -1.2, -0.4], [23, 13.5, 0], 0)];
  const ventanas = Array.from({ length: 5 }, (_, i) => rectY(10, 1 + i * 2.6, 2.8 + i * 2.6, 2.2, 3.6));
  const porton = [rectX(14, 3, 7, 0, 3.6), ...lineasX(14, 3, 7, 0, 3.6, 6)];
  s.push(caja([0, 0, 0], [14, 10, 4.5], 1, [...ventanas, ...porton]));
  for (let k = 0; k < 4; k++) {
    const x0 = k * 3.5;
    const vidrio = [[[x0 + 3.5, 0.6, 5.0], [x0 + 3.5, 9.4, 5.0]], [[x0 + 3.5, 0.6, 5.6], [x0 + 3.5, 9.4, 5.6]]] as V3[][];
    s.push(prisma('y', [[x0, 4.5], [x0 + 3.5, 4.5], [x0 + 3.5, 6.3]], 0, 10, 2 + k * 0.5, vidrio));
  }
  s.push(caja([15, 6.5, 0], [21.5, 12.5, 3.2], 4, [
    rectY(12.5, 15.8, 17.6, 1.2, 2.5), rectY(12.5, 18.6, 20.6, 1.2, 2.5),
    rectX(21.5, 7.4, 9, 1.2, 2.5), rectX(21.5, 10, 11.6, 0, 2.4),
  ]));
  s.push(cilindro(18.5, 2.5, 1.5, 0, 6.5, 5, 14, [[[18.5, 4, 2.2], [20, 2.5, 2.2]], [[18.5, 4, 4.4], [20, 2.5, 4.4]]]));
  s.push(cilindro(18.5, 2.5, 0.35, 6.5, 7.4, 5.5, 8));
  s.push(cilindro(16, -0.2, 0.75, 0, 14, 6, 10, [[[16.75, -0.2, 12], [16, 0.55, 12]], [[16.75, -0.2, 12.6], [16, 0.55, 12.6]]]));
  s.push(caja([14, 1.8, 5.2], [17.2, 2.4, 5.7], 6.5));
  return s;
}

function casa(): Solido[] {
  const s: Solido[] = [caja([-1.5, -1.5, -0.4], [17, 13, 0], 0)];
  // Castillos y cadenas (estructura de acero) antes del muro
  for (const [x, y] of [[0, 0], [8, 0], [0, 8], [8, 8], [4, 8], [8, 4]] as V2[]) s.push(caja([x - 0.15, y - 0.15, 0], [x + 0.15, y + 0.15, 2.9], 1));
  s.push(caja([-0.15, -0.15, 2.9], [8.15, 8.15, 3.2], 2));
  s.push(caja([0, 0, 0], [8, 8, 2.9], 3, [
    rectY(8, 1, 3.2, 0, 2.3), rectY(8, 4.6, 7, 1, 2.2), rectX(8, 1, 3.4, 1, 2.2), rectX(8, 4.8, 7, 1, 2.2),
  ]));
  s.push(caja([-0.3, -0.3, 3.2], [8.3, 8.3, 3.45], 4));
  s.push(caja([0.4, 0.4, 3.45], [7.6, 7.6, 6.1], 5, [rectY(7.6, 1.4, 3.6, 4.3, 5.5), rectY(7.6, 4.6, 6.6, 4.3, 5.5), rectX(7.6, 2, 6, 4.3, 5.5)]));
  s.push(prisma('x', [[0, 6.1], [8, 6.1], [4, 8.3]], 0, 8, 6));
  // Cochera con techo plano
  s.push(caja([8.4, 1, 0], [14, 7, 2.8], 7, [rectX(14, 1.8, 6.2, 0, 2.3), ...lineasX(14, 1.8, 6.2, 0, 2.3, 5)]));
  s.push(caja([8.2, 0.8, 2.8], [14.3, 7.3, 3.05], 7.5));
  // Barda
  s.push(caja([15.5, -1, 0], [15.8, 11, 1.2], 8, [zigzag('x', 15.8, -0.8, 10.8, 0.15, 1.05, 18, false)]));
  return s;
}

/* --- Orden de pintado (de atrás hacia adelante) ---------------------------- */
function ordenarPintado(solidos: Solido[]): Solido[] {
  const caja2D = solidos.map((s) => {
    const esquinas: V3[] = [];
    for (const x of [s.min[0], s.max[0]]) for (const y of [s.min[1], s.max[1]]) for (const z of [s.min[2], s.max[2]]) esquinas.push([x, y, z]);
    const p = esquinas.map(proyectar);
    return { x0: Math.min(...p.map((q) => q[0])), x1: Math.max(...p.map((q) => q[0])), y0: Math.min(...p.map((q) => q[1])), y1: Math.max(...p.map((q) => q[1])) };
  });
  const suma = (s: Solido) => (s.min[0] + s.max[0] + s.min[1] + s.max[1] + s.min[2] + s.max[2]) / 2;
  const detras = (a: Solido, b: Solido) => [0, 1, 2].some((k) => a.max[k] <= b.min[k] + 1e-6);
  const n = solidos.length;
  const antes: Set<number>[] = solidos.map(() => new Set());
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const A = caja2D[i], B = caja2D[j];
      if (A.x1 <= B.x0 || B.x1 <= A.x0 || A.y1 <= B.y0 || B.y1 <= A.y0) continue;
      const ij = detras(solidos[i], solidos[j]);
      const ji = detras(solidos[j], solidos[i]);
      if (ij && !ji) antes[j].add(i);
      else if (ji && !ij) antes[i].add(j);
      else if (suma(solidos[i]) < suma(solidos[j])) antes[j].add(i);
      else antes[i].add(j);
    }
  const hecho = new Set<number>();
  const salida: Solido[] = [];
  while (salida.length < n) {
    let candidato = -1;
    for (let i = 0; i < n; i++) {
      if (hecho.has(i) || [...antes[i]].some((k) => !hecho.has(k))) continue;
      if (candidato < 0 || suma(solidos[i]) < suma(solidos[candidato])) candidato = i;
    }
    if (candidato < 0) {
      // Ciclo: el más lejano que quede
      for (let i = 0; i < n; i++) if (!hecho.has(i) && (candidato < 0 || suma(solidos[i]) < suma(solidos[candidato]))) candidato = i;
    }
    hecho.add(candidato);
    salida.push(solidos[candidato]);
  }
  return salida;
}

function componer(id: string, nombre: string, spec: string, solidos: Solido[], humo?: V3): Escena {
  const ordenados = ordenarPintado(solidos);
  const todos = ordenados.flatMap((s) => [...s.caras.flat(), ...s.detalles.flat()]).map(proyectar);
  const minX = Math.min(...todos.map((p) => p[0])), maxX = Math.max(...todos.map((p) => p[0]));
  const minY = Math.min(...todos.map((p) => p[1])), maxY = Math.max(...todos.map((p) => p[1]));
  const escala = Math.min((ANCHO_ESCENA - MARGEN * 2) / (maxX - minX), (ALTO_ESCENA - MARGEN * 2) / (maxY - minY));
  const ox = (ANCHO_ESCENA - (maxX - minX) * escala) / 2 - minX * escala;
  const oy = ALTO_ESCENA - MARGEN - maxY * escala;
  const a2 = (p: V3) => { const [x, y] = proyectar(p); return [+(x * escala + ox).toFixed(1), +(y * escala + oy).toFixed(1)] as V2; };
  const camino = (pts: V3[], cerrar: boolean) => pts.map((p, i) => `${i ? 'L' : 'M'}${a2(p).join(' ')}`).join('') + (cerrar ? 'Z' : '');

  const porOrden = new Map<number, number>();
  const trazos: TrazoEscena[] = [];
  let duracion = 0;
  for (const s of ordenados) {
    const k = porOrden.get(s.orden) ?? 0;
    porOrden.set(s.orden, k + 1);
    const retraso = +(s.orden * PASO_ORDEN + Math.min(k * 0.012, 0.25)).toFixed(3);
    duracion = Math.max(duracion, retraso);
    /* Un solo <path> por sólido (caras como subtrazos): menos elementos que animar. */
    trazos.push({ d: s.caras.map((c) => camino(c, true)).join(''), tipo: 'cara', retraso });
    if (s.detalles.length) trazos.push({ d: s.detalles.map((d) => camino(d, false)).join(''), tipo: 'detalle', retraso: +(retraso + 0.35).toFixed(3) });
  }
  return { id, nombre, spec, trazos, duracion: duracion + 1.6, humo: humo ? a2(humo) : undefined };
}

export const escenas: Escena[] = [
  componer('edificio', 'Edificio', 'Estructura de acero · 4 niveles', edificio()),
  componer('fabrica', 'Nave industrial', 'Techo diente de sierra · chimenea', fabrica(), [16, -0.2, 14.2]),
  componer('casa', 'Casa habitación', 'Castillos, cadenas y losa', casa()),
];

/* --- Escenas para la cámara en movimiento (Hero G) -------------------------- */
export interface Toma {
  /** Momento de la escena (0 = inicio del dibujo, 1 = fin del borrado). */
  t: number;
  /** Azimut (°, entre 10 y 80), elevación (°, entre 8 y 60) y acercamiento. */
  az: number;
  el: number;
  zoom: number;
  /** Punto al que mira la cámara, relativo a la caja de la escena (0–1 por eje). */
  mira: V3;
}

export interface EscenaCamara {
  id: string;
  nombre: string;
  spec: string;
  solidos: SolidoDef[];
  humo?: V3;
  tomas: Toma[];
}

export const escenasCamara: EscenaCamara[] = [
  {
    id: 'edificio', nombre: 'Edificio', spec: 'Estructura de acero · 4 niveles',
    solidos: edificio().map((s) => s.def),
    tomas: [
      { t: 0, az: 22, el: 10, zoom: 1.75, mira: [0.35, 0.4, 0.12] },
      { t: 0.45, az: 38, el: 22, zoom: 1.3, mira: [0.45, 0.45, 0.4] },
      { t: 0.75, az: 55, el: 30, zoom: 1.02, mira: [0.5, 0.5, 0.5] },
      { t: 1, az: 70, el: 34, zoom: 0.98, mira: [0.5, 0.5, 0.55] },
    ],
  },
  {
    id: 'fabrica', nombre: 'Nave industrial', spec: 'Techo diente de sierra · chimenea',
    solidos: fabrica().map((s) => s.def), humo: [16, -0.2, 14.2],
    tomas: [
      { t: 0, az: 74, el: 56, zoom: 1.5, mira: [0.35, 0.45, 0.2] },
      { t: 0.5, az: 50, el: 36, zoom: 1.12, mira: [0.5, 0.5, 0.3] },
      { t: 1, az: 20, el: 24, zoom: 1.05, mira: [0.55, 0.45, 0.35] },
    ],
  },
  {
    id: 'casa', nombre: 'Casa habitación', spec: 'Castillos, cadenas y losa',
    solidos: casa().map((s) => s.def),
    tomas: [
      { t: 0, az: 14, el: 18, zoom: 1.85, mira: [0.3, 0.3, 0.2] },
      { t: 0.55, az: 35, el: 30, zoom: 1.2, mira: [0.45, 0.45, 0.35] },
      { t: 1, az: 62, el: 40, zoom: 1.0, mira: [0.5, 0.5, 0.35] },
    ],
  },
];
