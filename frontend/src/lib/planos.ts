/**
 * Geometría de los bocetos isométricos de producto (sección "Planos").
 *
 * Cada pieza es una sección transversal (puntos y = ancho, z = alto)
 * extruida a lo largo de x. Se dibuja con caras rellenas pintadas de atrás
 * hacia adelante, de modo que las aristas ocultas quedan tapadas y solo se ven
 * las líneas visibles, como en un plano técnico.
 */

export type Punto = [number, number];

export interface Cara {
  d: string;
  /** Tono de relleno (0–100, % de blanco sobre el fondo). */
  tono: number;
  tipo: 'frente' | 'lado' | 'liso' | 'silueta';
}

export interface Plano {
  caras: Cara[];
  cota: { d: string; x: number; y: number; angulo: number; texto: string };
  /** Etiquetas de partes con línea guía (como "PATÍN" o "ALMA"). */
  notas: { d: string; x: number; y: number; ox: number; oy: number; texto: string; lado: 'arriba' | 'abajo' | 'derecha' }[];
}

export interface Nota {
  texto: string;
  /** Punto de la pieza (x = largo, y = ancho, z = alto) al que apunta. */
  punto: [number, number, number];
  lado?: 'arriba' | 'abajo' | 'derecha';
}

export interface Contorno {
  puntos: Punto[];
  /** Hueco interior (tubo, PTR). */
  hueco?: boolean;
  /** Superficie curva: sin aristas entre segmentos, solo silueta. */
  liso?: boolean;
}

export const ANCHO = 400;
export const ALTO = 300;
const MARGEN = 28;

const C = Math.cos(Math.PI / 6);
const S = Math.sin(Math.PI / 6);
/* El observador mira desde (1, 1, 1): x = largo, y = ancho, z = alto. */
const proyectar = (x: number, y: number, z: number): Punto => [(x - y) * C, (x + y) * S - z];

const area = (puntos: Punto[]) =>
  puntos.reduce((suma, [y1, z1], i) => {
    const [y2, z2] = puntos[(i + 1) % puntos.length];
    return suma + (y1 * z2 - y2 * z1);
  }, 0) / 2;

export function crearPlano(contornos: Contorno[], largo: number, textoCota: string, notasEntrada: Nota[] = []): Plano {
  type CaraCruda = { puntos: Punto[]; tono: number; tipo: Cara['tipo']; profundidad: number; cerrada: boolean };
  const huecos: CaraCruda[] = [];
  const exteriores: CaraCruda[] = [];

  for (const { puntos, hueco = false, liso = false } of contornos) {
    const antihorario = area(puntos) > 0;
    const destino = hueco ? huecos : exteriores;
    const visiblesContorno: number[] = [];

    puntos.forEach(([y1, z1], i) => {
      const [y2, z2] = puntos[(i + 1) % puntos.length];
      const dy = y2 - y1;
      const dz = z2 - z1;
      /* Normal exterior del sólido (invertida en los huecos). */
      let ny = antihorario ? dz : -dz;
      let nz = antihorario ? -dy : dy;
      if (hueco) {
        ny = -ny;
        nz = -nz;
      }
      const largoNormal = Math.hypot(ny, nz) || 1;
      ny /= largoNormal;
      nz /= largoNormal;
      if (ny + nz <= 1e-6) return; // cara de espaldas: oculta
      visiblesContorno.push(i);

      destino.push({
        puntos: [proyectar(largo, y1, z1), proyectar(largo, y2, z2), proyectar(0, y2, z2), proyectar(0, y1, z1)],
        tono: 0,
        tipo: liso ? 'liso' : 'lado',
        profundidad: (y1 + y2) / 2 + (z1 + z2) / 2,
        cerrada: true,
      });
    });

    /* Superficies curvas: borde posterior visible y silueta longitudinal. */
    if (liso) {
      /* Une los bordes posteriores de las caras visibles en un solo trazo,
         empezando en la primera cara visible del arco. */
      const n = puntos.length;
      const inicio = visiblesContorno.findIndex((i) => !visiblesContorno.includes((i - 1 + n) % n));
      if (inicio >= 0) {
        const borde: Punto[] = [];
        for (let k = 0, i = visiblesContorno[inicio]; k < visiblesContorno.length && visiblesContorno.includes(i); k++, i = (i + 1) % n) {
          const [y1, z1] = puntos[i];
          const [y2, z2] = puntos[(i + 1) % n];
          if (!borde.length) borde.push(proyectar(0, y1, z1));
          borde.push(proyectar(0, y2, z2));
        }
        destino.push({ puntos: borde, tono: 0, tipo: 'silueta', profundidad: Infinity, cerrada: false });
      }
      const normal: Punto = [-S, C];
      const cara = puntos.map(([y, z]) => proyectar(largo, y, z));
      const proy = cara.map(([a, b]) => a * normal[0] + b * normal[1]);
      for (const i of [proy.indexOf(Math.min(...proy)), proy.indexOf(Math.max(...proy))]) {
        const [y, z] = puntos[i];
        destino.push({
          puntos: [proyectar(largo, y, z), proyectar(0, y, z)],
          tono: 0,
          tipo: 'silueta',
          profundidad: Infinity,
          cerrada: false,
        });
      }
    }
  }

  const ordenar = (caras: CaraCruda[]) => caras.sort((a, b) => a.profundidad - b.profundidad);

  /* Tapa frontal (x = largo) con sus huecos. */
  const frente: CaraCruda = {
    puntos: [],
    tono: 10,
    tipo: 'frente',
    profundidad: Infinity,
    cerrada: true,
  };
  const anillos = contornos.map((c) => c.puntos.map(([y, z]) => proyectar(largo, y, z)));

  /* Cota del largo, paralela a la pieza, por debajo. */
  const yMax = Math.max(...contornos.flatMap((c) => c.puntos.map(([y]) => y)));
  const zMin = Math.min(...contornos.flatMap((c) => c.puntos.map(([, z]) => z)));
  const yc = yMax + 16;
  const cotaPuntos = [
    proyectar(0, yc - 6, zMin),
    proyectar(0, yc + 4, zMin),
    proyectar(largo, yc - 6, zMin),
    proyectar(largo, yc + 4, zMin),
    proyectar(0, yc, zMin),
    proyectar(largo, yc, zMin),
  ];
  const textoPos = proyectar(largo / 2, yc + 12, zMin);

  /* Etiquetas: línea vertical desde el punto hasta el texto. */
  const LARGO_GUIA = 34;
  const notasCrudas = notasEntrada.map(({ texto, punto, lado = 'arriba' }) => {
    const origen = proyectar(...punto);
    const signo = lado === 'arriba' ? -1 : 1;
    const fin: Punto =
      lado === 'derecha' ? [origen[0] + LARGO_GUIA, origen[1]] : [origen[0], origen[1] + signo * LARGO_GUIA];
    const etiqueta: Punto =
      lado === 'derecha' ? [fin[0] + 4, fin[1]] : [origen[0], origen[1] + signo * (LARGO_GUIA + 7)];
    return { texto, lado, origen, fin, etiqueta };
  });

  /* Encuadre: escala y centra todo en ANCHO × ALTO. */
  const todos = [
    ...huecos.flatMap((c) => c.puntos),
    ...exteriores.flatMap((c) => c.puntos),
    ...anillos.flat(),
    ...contornos.flatMap((c) => c.puntos.map(([y, z]) => proyectar(0, y, z))),
    ...cotaPuntos,
    textoPos,
    ...notasCrudas.flatMap((n) => [n.etiqueta, [n.etiqueta[0] - (n.lado === 'derecha' ? 0 : 22), n.etiqueta[1]] as Punto, [n.etiqueta[0] + (n.lado === 'derecha' ? 40 : 22), n.etiqueta[1]] as Punto]),
  ];
  const xs = todos.map(([a]) => a);
  const ys = todos.map(([, b]) => b);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const escala = Math.min((ANCHO - MARGEN * 2) / (x1 - x0), (ALTO - MARGEN * 2) / (y1 - y0));
  const ox = (ANCHO - (x1 - x0) * escala) / 2 - x0 * escala;
  const oy = (ALTO - (y1 - y0) * escala) / 2 - y0 * escala;
  const r = (n: number) => Math.round(n * 10) / 10;
  const ajustar = ([a, b]: Punto): Punto => [r(a * escala + ox), r(b * escala + oy)];
  const trazo = (puntos: Punto[], cerrar: boolean) =>
    `M${puntos.map(ajustar).map(([a, b]) => `${a} ${b}`).join('L')}${cerrar ? 'Z' : ''}`;

  frente.puntos = anillos[0];
  const dFrente = anillos.map((anillo) => trazo(anillo, true)).join('');

  const caras: Cara[] = [
    ...ordenar(huecos).map((c) => ({ d: trazo(c.puntos, c.cerrada), tono: c.tono, tipo: c.tipo })),
    ...ordenar(exteriores).map((c) => ({ d: trazo(c.puntos, c.cerrada), tono: c.tono, tipo: c.tipo })),
    { d: dFrente, tono: frente.tono, tipo: 'frente' },
  ];

  const [c0, c1, c2, c3, c4, c5] = cotaPuntos;
  const [tx, ty] = ajustar(textoPos);

  return {
    caras,
    cota: {
      d: trazo([c0, c1], false) + trazo([c2, c3], false) + trazo([c4, c5], false),
      x: tx,
      y: ty,
      angulo: 30,
      texto: textoCota,
    },
    notas: notasCrudas.map((n) => {
      const [x, y] = ajustar(n.etiqueta);
      const [ox, oy] = ajustar(n.origen);
      return { d: trazo([n.origen, n.fin], false), x, y, ox, oy, texto: n.texto, lado: n.lado };
    }),
  };
}

/* ── Secciones transversales ─────────────────────────────────────────── */

const circulo = (radio: number, cz: number, pasos = 48): Punto[] =>
  Array.from({ length: pasos }, (_, i) => {
    const t = (i / pasos) * Math.PI * 2;
    return [Math.cos(t) * radio, cz + Math.sin(t) * radio];
  });

const rectangulo = (y0: number, z0: number, y1: number, z1: number): Punto[] => [
  [y0, z0],
  [y1, z0],
  [y1, z1],
  [y0, z1],
];

const ipr: Punto[] = [
  [-28, 0], [28, 0], [28, 7], [3.5, 7], [3.5, 65], [28, 65], [28, 72], [-28, 72], [-28, 65], [-3.5, 65], [-3.5, 7], [-28, 7],
];
const angulo: Punto[] = [[-30, 0], [30, 0], [30, 6], [-24, 6], [-24, 60], [-30, 60]];
const monten: Punto[] = [
  [-24, 0], [24, 0], [24, 14], [19, 14], [19, 5], [-19, 5], [-19, 69], [19, 69], [19, 60], [24, 60], [24, 74], [-24, 74],
];

function laminaR72(): Punto[] {
  const ondas = 4;
  const paso = 34;
  const alto = 15;
  const espesor = 2;
  const arriba: Punto[] = [];
  for (let i = 0; i < ondas; i++) {
    const y = -(ondas * paso) / 2 + i * paso;
    arriba.push([y, 0], [y + 8, 0], [y + 13, alto], [y + 25, alto], [y + 30, 0]);
  }
  arriba.push([(ondas * paso) / 2, 0]);
  /* Contorno cerrado: cara superior y su paralela desplazada hacia abajo. */
  const abajo = arriba.map(([y, z]) => [y, z - espesor] as Punto).reverse();
  return [...arriba, ...abajo];
}

export interface PiezaPlano {
  nombre: string;
  spec: string;
  texto: string;
  plano: Plano;
}

export const piezasPlano: PiezaPlano[] = [
  {
    nombre: 'Viga IPR',
    spec: 'A572 Gr. 50 · 6 a 12 m',
    texto: 'Vigas de patín ancho para estructuras, mezzanines y naves industriales.',
    plano: crearPlano([{ puntos: ipr }], 170, '12.00 m', [
      { texto: 'Patín', punto: [40, -16, 72] },
      { texto: 'Alma', punto: [170, 0, 40], lado: 'derecha' },
    ]),
  },
  {
    nombre: 'PTR',
    spec: 'Cal. 14 a 3/8″ · 6.10 m',
    texto: 'Perfil tubular rectangular y cuadrado para herrería y estructura ligera.',
    plano: crearPlano(
      [{ puntos: rectangulo(-28, 0, 28, 56) }, { puntos: rectangulo(-23, 5, 23, 51), hueco: true }],
      170,
      '6.10 m',
    ),
  },
  {
    nombre: 'Ángulo',
    spec: 'Lados iguales · 6.10 m',
    texto: 'Ángulo de acero A36 para marcos, soportes, refuerzos y herrería.',
    plano: crearPlano([{ puntos: angulo }], 180, '6.10 m'),
  },
  {
    nombre: 'Monten',
    spec: 'Canal C · Cal. 12 y 14',
    texto: 'Perfil galvanizado para largueros de techo y muro en estructura ligera.',
    plano: crearPlano([{ puntos: monten }], 170, '6.10 m'),
  },
  {
    nombre: 'Tubo redondo',
    spec: 'Cédula 30 y 40 · 6.40 m',
    texto: 'Tubería de acero al carbón para conducción, cercas y estructura.',
    plano: crearPlano(
      [
        { puntos: circulo(30, 30), liso: true },
        { puntos: circulo(25, 30), liso: true, hueco: true },
      ],
      170,
      '6.40 m',
    ),
  },
  {
    nombre: 'Lámina R-72',
    spec: 'Cal. 22 a 26 · a la medida',
    texto: 'Lámina acanalada galvanizada y pintada para techos y muros.',
    plano: crearPlano([{ puntos: laminaR72() }], 140, 'A la medida', [
      { texto: 'Cresta', punto: [30, -32, 15] },
    ]),
  },
];
