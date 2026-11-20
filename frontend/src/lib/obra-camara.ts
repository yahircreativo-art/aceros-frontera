/**
 * "Cámara" para las escenas en línea del Hero G. No es 3D real (ni WebGL ni
 * librerías): en cada cuadro proyecta los sólidos de src/lib/construcciones.ts
 * desde un ángulo distinto y escribe el resultado como trazos SVG.
 *
 * - Caras visibles: solo las que miran hacia la cámara (normal · vista > 0).
 * - Aristas ocultas: los sólidos se pintan de atrás hacia adelante, con las
 *   caras rellenas del color del fondo. El orden se recalcula en cada cuadro.
 * - Trazado: el avance de cada sólido se calcula con el tiempo (no con
 *   transiciones CSS), así el dibujo y la cámara van siempre sincronizados.
 */
import type { EscenaCamara, SolidoDef, Toma, V3 } from './construcciones';

const SVG = 'http://www.w3.org/2000/svg';
const PASO_ORDEN = 0.32;
const TRAZO = 1.1; // s que tarda en trazarse un sólido
const ESPERA = 3.2; // s con la escena terminada
const BORRADO = 1.6; // s del borrado

interface Cara { pts: V3[]; n: V3 }
interface Pieza { caras: Cara[]; det: V3[][]; min: V3; max: V3; centro: V3; retraso: number; puntos: V3[] }
interface EscenaLista { piezas: Pieza[]; dibujo: number; total: number; tomas: Toma[]; min: V3; max: V3; radio: number; humo?: V3 }

const a3 = (eje: SolidoDef['eje'], u: number, v: number, a: number): V3 =>
  eje === 'x' ? [a, u, v] : eje === 'y' ? [u, a, v] : [u, v, a];

function pieza(def: SolidoDef, retraso: number): Pieza {
  const { eje, perfil, a0, a1 } = def;
  const area = perfil.reduce((s, [u1, v1], i) => {
    const [u2, v2] = perfil[(i + 1) % perfil.length];
    return s + (u1 * v2 - u2 * v1);
  }, 0);
  const caras: Cara[] = perfil.map(([u1, v1], i) => {
    const [u2, v2] = perfil[(i + 1) % perfil.length];
    const nu = area > 0 ? v2 - v1 : v1 - v2;
    const nv = area > 0 ? u1 - u2 : u2 - u1;
    return { pts: [a3(eje, u1, v1, a0), a3(eje, u2, v2, a0), a3(eje, u2, v2, a1), a3(eje, u1, v1, a1)], n: a3(eje, nu, nv, 0) };
  });
  caras.push({ pts: perfil.map(([u, v]) => a3(eje, u, v, a1)), n: a3(eje, 0, 0, 1) });
  caras.push({ pts: perfil.map(([u, v]) => a3(eje, u, v, a0)), n: a3(eje, 0, 0, -1) });
  const puntos = [...caras.flatMap((c) => c.pts), ...def.det.flat()];
  const min = [0, 1, 2].map((k) => Math.min(...puntos.map((p) => p[k]))) as V3;
  const max = [0, 1, 2].map((k) => Math.max(...puntos.map((p) => p[k]))) as V3;
  return { caras, det: def.det, min, max, centro: [0, 1, 2].map((k) => (min[k] + max[k]) / 2) as V3, retraso, puntos };
}

function preparar(e: EscenaCamara): EscenaLista {
  const porOrden = new Map<number, number>();
  const piezas = e.solidos.map((d) => {
    const k = porOrden.get(d.orden) ?? 0;
    porOrden.set(d.orden, k + 1);
    return pieza(d, d.orden * PASO_ORDEN + Math.min(k * 0.012, 0.25));
  });
  const min = [0, 1, 2].map((k) => Math.min(...piezas.map((p) => p.min[k]))) as V3;
  const max = [0, 1, 2].map((k) => Math.max(...piezas.map((p) => p.max[k]))) as V3;
  const radio = Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2;
  const dibujo = Math.max(...piezas.map((p) => p.retraso)) + TRAZO + 0.5;
  return { piezas, dibujo, total: dibujo + ESPERA + BORRADO, tomas: e.tomas, min, max, radio, humo: e.humo };
}

const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const limitar = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Interpola entre las tomas de la escena (u = 0…1). */
function camara(tomas: Toma[], u: number): Toma {
  let i = 0;
  while (i < tomas.length - 2 && u > tomas[i + 1].t) i++;
  const A = tomas[i], B = tomas[i + 1] ?? A;
  const f = suave(limitar((u - A.t) / ((B.t - A.t) || 1)));
  const mezcla = (a: number, b: number) => a + (b - a) * f;
  return { t: u, az: mezcla(A.az, B.az), el: mezcla(A.el, B.el), zoom: mezcla(A.zoom, B.zoom), mira: [0, 1, 2].map((k) => mezcla(A.mira[k], B.mira[k])) as V3 };
}

export interface OpcionesObra {
  svg: SVGSVGElement;
  escenas: EscenaCamara[];
  /** Posición horizontal del centro de la obra (0–1 del ancho). */
  centroX?: () => number;
  /** Multiplicador del tamaño de la obra (p. ej. más grande en celular). */
  escala?: () => number;
  alCambiar?: (indice: number) => void;
  alAvanzar?: (indice: number, progreso: number) => void;
  /** Dibuja la primera escena una sola vez y se queda en el último cuadro (sin borrar ni pasar a la siguiente). */
  unaVez?: boolean;
  /** Con `unaVez`: se llama una vez, cuando la obra queda terminada. */
  alTerminar?: () => void;
}

export function iniciarObra({ svg, escenas, centroX = () => 0.5, escala: escalaExtra = () => 1, alCambiar, alAvanzar, unaVez = false, alTerminar }: OpcionesObra) {
  const listas = escenas.map(preparar);
  const max = Math.max(...listas.map((l) => l.piezas.length));
  const capa = document.createElementNS(SVG, 'g');
  const ranuras = Array.from({ length: max }, () => {
    const cara = document.createElementNS(SVG, 'path');
    const det = document.createElementNS(SVG, 'path');
    cara.setAttribute('class', 'obra-cara');
    det.setAttribute('class', 'obra-det');
    cara.setAttribute('pathLength', '1');
    det.setAttribute('pathLength', '1');
    capa.append(cara, det);
    return { cara, det };
  });
  const humo = document.createElementNS(SVG, 'g');
  humo.setAttribute('class', 'obra-humo');
  for (let k = 0; k < 4; k++) {
    const c = document.createElementNS(SVG, 'circle');
    c.setAttribute('r', String(7 + k * 2));
    c.style.setProperty('--k', String(k));
    humo.append(c);
  }
  svg.append(capa, humo);

  let W = 0, H = 0;
  const medir = () => {
    W = svg.clientWidth;
    H = svg.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.querySelector('linearGradient')?.setAttribute('y2', String(H));
  };
  medir();
  const ro = new ResizeObserver(medir);
  ro.observe(svg);

  /* Desplazamiento suave con el cursor (unos grados de giro extra). */
  let px = 0, py = 0, tpx = 0, tpy = 0;
  const alMover = (e: PointerEvent) => {
    tpx = (e.clientX / window.innerWidth - 0.5) * 2;
    tpy = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', alMover, { passive: true });

  let indice = 0;
  let inicio = performance.now();
  let pausado = false;
  let pausaDesde = 0;
  let raf = 0;
  let terminada = false;
  alCambiar?.(0);

  const n = max;
  const orden = new Int32Array(n);
  const entrantes = new Int32Array(n);
  const listo = new Uint8Array(n);
  const sig: number[][] = Array.from({ length: n }, () => []);
  const prof = new Float64Array(n);
  const caja = new Float64Array(n * 4);

  const cuadro = (ahora: number) => {
    raf = requestAnimationFrame(cuadro);
    let t = (ahora - inicio) / 1000;
    let L = listas[indice];
    if (unaVez) {
      if (t >= L.dibujo) {
        t = L.dibujo;
        if (!terminada) { terminada = true; alTerminar?.(); }
      }
    } else if (t > L.total) {
      indice = (indice + 1) % listas.length;
      inicio = ahora;
      t = 0;
      L = listas[indice];
      alCambiar?.(indice);
    }
    alAvanzar?.(indice, unaVez ? t / L.dibujo : t / L.total);

    px += (tpx - px) * 0.04;
    py += (tpy - py) * 0.04;
    const cam = camara(L.tomas, t / L.total);
    const az = ((Math.min(80, Math.max(10, cam.az + px * 6))) * Math.PI) / 180;
    const el = ((Math.min(60, Math.max(8, cam.el - py * 4))) * Math.PI) / 180;
    const ce = Math.cos(el), se = Math.sin(el), ca = Math.cos(az), sa = Math.sin(az);
    const v: V3 = [ce * ca, ce * sa, se];
    const r: V3 = [sa, -ca, 0];
    const up: V3 = [-se * ca, -se * sa, ce];
    const mira = [0, 1, 2].map((k) => L.min[k] + (L.max[k] - L.min[k]) * cam.mira[k]) as V3;
    const escala = (Math.min(W, H * 1.25) * 0.5 * cam.zoom * escalaExtra()) / L.radio;
    const cx = W * centroX();
    const cy = H * 0.52;
    const sx = (p: V3) => cx + ((p[0] - mira[0]) * r[0] + (p[1] - mira[1]) * r[1]) * escala;
    const sy = (p: V3) => cy - ((p[0] - mira[0]) * up[0] + (p[1] - mira[1]) * up[1] + (p[2] - mira[2]) * up[2]) * escala;

    const piezas = L.piezas;
    const m = piezas.length;

    /* Caja en pantalla y profundidad de cada pieza */
    for (let i = 0; i < m; i++) {
      const P = piezas[i];
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const p of P.puntos) {
        const X = sx(p), Y = sy(p);
        if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
      }
      caja[i * 4] = x0; caja[i * 4 + 1] = x1; caja[i * 4 + 2] = y0; caja[i * 4 + 3] = y1;
      prof[i] = P.centro[0] * v[0] + P.centro[1] * v[1] + P.centro[2] * v[2];
      entrantes[i] = 0; listo[i] = 0; sig[i].length = 0;
    }
    /* Quién tapa a quién (solo entre piezas que se enciman en pantalla) */
    for (let i = 0; i < m; i++)
      for (let j = i + 1; j < m; j++) {
        if (caja[i * 4 + 1] <= caja[j * 4] || caja[j * 4 + 1] <= caja[i * 4] || caja[i * 4 + 3] <= caja[j * 4 + 2] || caja[j * 4 + 3] <= caja[i * 4 + 2]) continue;
        const A = piezas[i], B = piezas[j];
        const ij = A.max[0] <= B.min[0] + 1e-6 || A.max[1] <= B.min[1] + 1e-6 || A.max[2] <= B.min[2] + 1e-6;
        const ji = B.max[0] <= A.min[0] + 1e-6 || B.max[1] <= A.min[1] + 1e-6 || B.max[2] <= A.min[2] + 1e-6;
        const iAntes = ij && !ji ? true : ji && !ij ? false : prof[i] < prof[j];
        if (iAntes) { sig[i].push(j); entrantes[j]++; } else { sig[j].push(i); entrantes[i]++; }
      }
    for (let k = 0; k < m; k++) {
      let mejor = -1;
      for (let i = 0; i < m; i++) if (!listo[i] && entrantes[i] === 0 && (mejor < 0 || prof[i] < prof[mejor])) mejor = i;
      if (mejor < 0) for (let i = 0; i < m; i++) if (!listo[i] && (mejor < 0 || prof[i] < prof[mejor])) mejor = i; // ciclo
      listo[mejor] = 1;
      orden[k] = mejor;
      for (const j of sig[mejor]) entrantes[j]--;
    }

    /* Escritura de trazos */
    const borrando = t - L.dibujo - ESPERA;
    for (let k = 0; k < n; k++) {
      const { cara, det } = ranuras[k];
      if (k >= m) { cara.setAttribute('d', ''); det.setAttribute('d', ''); continue; }
      const P = piezas[orden[k]];
      let d = '';
      for (const c of P.caras) {
        if (c.n[0] * v[0] + c.n[1] * v[1] + c.n[2] * v[2] <= 1e-6) continue;
        for (let q = 0; q < c.pts.length; q++) d += `${q ? 'L' : 'M'}${sx(c.pts[q]).toFixed(1)} ${sy(c.pts[q]).toFixed(1)}`;
        d += 'Z';
      }
      let dd = '';
      for (const linea of P.det) for (let q = 0; q < linea.length; q++) dd += `${q ? 'L' : 'M'}${sx(linea[q]).toFixed(1)} ${sy(linea[q]).toFixed(1)}`;

      let trazo: number, relleno: number, trazoDet: number;
      if (borrando < 0) {
        trazo = 1 - suave(limitar((t - P.retraso) / TRAZO));
        trazoDet = 1 - suave(limitar((t - P.retraso - 0.35) / TRAZO));
        relleno = limitar((t - P.retraso) / 0.5);
      } else {
        const b = limitar((borrando - P.retraso * 0.06) / 0.9);
        trazo = -suave(b);
        trazoDet = trazo;
        relleno = 1 - limitar((borrando - 0.5 - P.retraso * 0.06) / 0.4);
      }
      cara.setAttribute('d', d);
      cara.setAttribute('stroke-dashoffset', trazo.toFixed(3));
      cara.setAttribute('fill-opacity', relleno.toFixed(2));
      det.setAttribute('d', dd);
      det.setAttribute('stroke-dashoffset', trazoDet.toFixed(3));
    }

    /* Humo de la chimenea cuando la escena ya está terminada */
    if (L.humo && t > L.dibujo && borrando < 0) {
      humo.setAttribute('transform', `translate(${sx(L.humo).toFixed(1)} ${sy(L.humo).toFixed(1)})`);
      humo.classList.add('is-on');
    } else humo.classList.remove('is-on');
  };

  const pausar = (p: boolean) => {
    if (p === pausado) return;
    pausado = p;
    if (p) { cancelAnimationFrame(raf); pausaDesde = performance.now(); }
    else { inicio += performance.now() - pausaDesde; raf = requestAnimationFrame(cuadro); }
  };
  raf = requestAnimationFrame(cuadro);

  return {
    pausar,
    ir(i: number) { indice = i % listas.length; inicio = performance.now(); alCambiar?.(indice); },
    destruir() { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('pointermove', alMover); capa.remove(); humo.remove(); },
  };
}
