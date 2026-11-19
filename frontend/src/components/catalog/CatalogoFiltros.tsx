/**
 * Catálogo con filtro lateral, cantidad y lista de cotización por WhatsApp.
 * Lo usan las familias de acero (/acero/<familia>/, medidas de
 * data/medidas-acero.ts) y el catálogo en línea (/catalogo/ y
 * /catalogo/<categoria>/, productos de Supabase).
 * El filtro lateral sale de las propiedades de cada artículo, así que cambia
 * según el producto. Sin precios ni existencias: no se publican.
 */
import { useEffect, useMemo, useState } from 'react';
import Icon from '../ui/Icon';
import { buttonClasses } from '../ui/button-styles';
import type { FormaDibujo } from '../../data/medidas-acero';
import type { ArticuloCatalogo } from '../../lib/catalogo';

interface Props {
  articulos: ArticuloCatalogo[];
  /** Nombre de la familia o categoría ("Estructurales", "Ferretería"). */
  titulo: string;
  /** Número de WhatsApp en formato internacional (seo.json → site.whatsapp). */
  whatsapp: string;
  /** Título del primer grupo del filtro ("Tipo", "Categoría"). */
  etiquetaTipo?: string;
  /** Nombre en plural de cada tipo para el filtro ("Ángulo" → "Ángulos"). */
  plurales?: Record<string, string>;
  /** Palabra para el conteo ("medidas", "productos"). */
  unidadConteo?: string;
  /** Tablas de origen por tipo (solo acero). */
  fuentes?: Record<string, string>;
}

type Orden = 'natural' | 'az' | 'za' | 'peso-asc' | 'peso-desc';
type Vista = 'tarjetas' | 'tabla';

const POR_PAGINA = 24;
const VALORES_VISIBLES = 8;

const waUrl = (numero: string, mensaje: string) => `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
const kg = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 2 });
const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const porNombre = (a: ArticuloCatalogo, b: ArticuloCatalogo) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true });
/* Medidas por tamaño; productos con foto primero y luego por nombre. */
const comparar = (a: ArticuloCatalogo, b: ArticuloCatalogo) =>
  a.orden && b.orden
    ? a.orden[0] - b.orden[0] || a.orden[1] - b.orden[1]
    : Number(Boolean(b.imagen)) - Number(Boolean(a.imagen)) || porNombre(a, b);

/* Peso de una pieza o tramo, si la tabla lo trae ("Tramo de 6.1 m: 7.3 kg"). */
const pesoPieza = (p: ArticuloCatalogo) => {
  const [etiqueta, valor] = p.pesos?.[0] ?? ['', ''];
  return /^(Tramo|Pieza) de/.test(etiqueta) && / kg$/.test(valor) ? parseFloat(valor) : null;
};
/* "tramo de 6.1 m" / "tramos de 6.1 m"; si no hay largo, "pieza(s)". */
const unidad = (p: ArticuloCatalogo, n: number) => {
  const etiqueta = p.pesos?.[0]?.[0] ?? '';
  const largo = etiqueta.match(/^(?:Tramo|Pieza) de (.+)$/)?.[1];
  const base = largo && etiqueta.startsWith('Tramo') ? 'tramo' : 'pieza';
  return `${base}${n === 1 ? '' : 's'}${largo ? ` de ${largo}` : ''}`;
};

/* Orden de las opciones: medidas por valor (1 1/4″, .109″, 12 mm, Cal. 12, 6 m); texto por abecedario. */
const esMedida = (v: string) => /^(\d|\.\d|Cal\. )/.test(v);
const valorOrden = (v: string) => {
  const cal = v.match(/^Cal\. (\d+)/);
  if (cal) return -Number(cal[1]);
  const mm = v.match(/^([\d.]+) mm/);
  if (mm) return Number(mm[1]) / 25.4;
  return v.replace(/[″"mL]/g, '').trim().split(/\s+/).reduce((t, parte) => {
    const [n, d] = parte.split('/');
    return t + (d ? Number(n) / Number(d) : Number(n) || 0);
  }, 0);
};
const compararValores = (a: string, b: string) =>
  esMedida(a) && esMedida(b) ? valorOrden(a) - valorOrden(b) : a.localeCompare(b, 'es', { numeric: true });

/* ---------- Dibujo de la sección (proporciones reales en mm) ---------- */
function Seccion({ dibujo }: { dibujo: FormaDibujo }) {
  let w = 0;
  let h = 0;
  let d = '';
  switch (dibujo.forma) {
    case 'angulo': {
      const { a, e } = dibujo;
      w = a; h = a;
      d = `M0 0H${e}V${a - e}H${a}V${a}H0Z`;
      break;
    }
    case 'cuadrado':
      w = dibujo.a; h = dibujo.a;
      d = `M0 0H${w}V${h}H0Z`;
      break;
    case 'polin': {
      const { d: alto, b, e } = dibujo;
      w = b; h = alto;
      d = `M${b} 0H0V${alto}H${b}V${alto - e}H${e}V${e}H${b}Z`;
      break;
    }
    case 'viga': {
      const { d: alto, b, tf, tw } = dibujo;
      w = b; h = alto;
      const x1 = (b - tw) / 2;
      const x2 = x1 + tw;
      d = `M0 0H${b}V${tf}H${x2}V${alto - tf}H${b}V${alto}H0V${alto - tf}H${x1}V${tf}H0Z`;
      break;
    }
  }
  /* Encaja la pieza en 84 × 84 dentro de un lienzo de 160 × 120. */
  const s = 84 / Math.max(w, h);
  const ox = (160 - w * s) / 2 + 6;
  const oy = (120 - h * s) / 2 - 6;
  const yAncho = oy + h * s + 12;
  const xAlto = ox - 12;
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full max-sm:scale-[1.6]" aria-hidden="true">
      <path d={d} transform={`translate(${ox} ${oy}) scale(${s})`} className="fill-green-700/15 stroke-green-800" strokeWidth={1.5 / s} strokeLinejoin="miter" />
      <g className="stroke-neutral-500 max-sm:hidden" strokeWidth="0.75">
        <path d={`M${ox} ${yAncho}H${ox + w * s}M${ox} ${yAncho - 3}V${yAncho + 3}M${ox + w * s} ${yAncho - 3}V${yAncho + 3}`} />
        <path d={`M${xAlto} ${oy}V${oy + h * s}M${xAlto - 3} ${oy}H${xAlto + 3}M${xAlto - 3} ${oy + h * s}H${xAlto + 3}`} />
      </g>
      <text x={ox + (w * s) / 2} y={yAncho + 10} textAnchor="middle" className="fill-neutral-600 text-[8px] max-sm:hidden">{`${kg(w)} mm`}</text>
      <text x={xAlto - 4} y={oy + (h * s) / 2} textAnchor="middle" transform={`rotate(-90 ${xAlto - 4} ${oy + (h * s) / 2})`} className="fill-neutral-600 text-[8px] max-sm:hidden">{`${kg(h)} mm`}</text>
    </svg>
  );
}

/* Foto del producto; si falla o no hay, un aviso discreto. */
function Media({ articulo }: { articulo: ArticuloCatalogo }) {
  const [error, setError] = useState(false);
  if (articulo.imagen && !error) {
    return (
      <img
        src={articulo.imagen}
        alt={articulo.nombre}
        width={400}
        height={300}
        loading="lazy"
        decoding="async"
        onError={() => setError(true)}
        className="size-full object-contain p-2 mix-blend-multiply sm:p-4"
      />
    );
  }
  if (articulo.dibujo) return <Seccion dibujo={articulo.dibujo} />;
  return <span className="grid size-full place-items-center p-2 text-center type-body-s text-text-muted">Sin foto</span>;
}

function Cantidad({ valor, nombre, cambiar, className = '' }: { valor: number; nombre: string; cambiar: (n: number) => void; className?: string }) {
  const boton = 'ca-campo grid size-11 shrink-0 place-items-center type-h4 bg-surface-control text-text-primary hover:bg-surface-control-hover';
  return (
    <div className={`flex shrink-0 items-stretch ${className}`} role="group" aria-label={`Cantidad de ${nombre}`}>
      <button type="button" className={boton} onClick={() => cambiar(valor - 1)} aria-label={valor === 1 ? `Quitar ${nombre} de la lista` : 'Una menos'}>
        {valor === 1 ? <Icon name="x" className="size-4" /> : '−'}
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={9999}
        value={valor}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) cambiar(n);
        }}
        className="ca-campo ca-num w-12 min-w-0 flex-1 border-0 bg-surface-field text-center type-label text-text-primary"
        aria-label={`Cantidad de ${nombre}`}
      />
      <button type="button" className={boton} onClick={() => cambiar(valor + 1)} aria-label="Una más">+</button>
    </div>
  );
}

export default function CatalogoFiltros({
  articulos,
  titulo,
  whatsapp,
  etiquetaTipo = 'Tipo',
  plurales = {},
  unidadConteo = 'productos',
  fuentes,
}: Props) {
  const tipos = useMemo(() => [...new Set(articulos.map((p) => p.tipo))], [articulos]);
  const conPeso = useMemo(() => articulos.some((p) => p.kgm != null), [articulos]);
  const plural = (t: string) => plurales[t] ?? t;

  const [busqueda, setBusqueda] = useState('');
  const [tiposSel, setTiposSel] = useState<string[]>([]);
  const [filtros, setFiltros] = useState<Record<string, string[]>>({});
  const [pesoMin, setPesoMin] = useState('');
  const [pesoMax, setPesoMax] = useState('');
  const [orden, setOrden] = useState<Orden>('natural');
  const [vista, setVista] = useState<Vista>('tarjetas');
  const [pagina, setPagina] = useState(1);
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});
  const [verFiltros, setVerFiltros] = useState(false);
  /* Lista de cotización: id del artículo → cantidad. */
  const [lista, setLista] = useState<Record<string, number>>({});

  const ordenados = useMemo(
    () => [...articulos].sort((a, b) => tipos.indexOf(a.tipo) - tipos.indexOf(b.tipo) || comparar(a, b)),
    [articulos, tipos],
  );

  const min = parseFloat(pesoMin);
  const max = parseFloat(pesoMax);
  const termino = sinAcentos(busqueda.trim());

  /* Cumple todos los filtros, salvo el que se indique (para contar sus opciones). */
  const cumple = (p: ArticuloCatalogo, excepto?: string) => {
    if (termino && !sinAcentos(`${p.nombre} ${p.medida}`).includes(termino)) return false;
    if (excepto !== '__tipo' && tiposSel.length && !tiposSel.includes(p.tipo)) return false;
    if (!Number.isNaN(min) && (p.kgm ?? 0) < min) return false;
    if (!Number.isNaN(max) && (p.kgm ?? 0) > max) return false;
    return Object.entries(filtros).every(
      ([clave, valores]) => clave === excepto || !valores.length || valores.includes(p.props[clave]),
    );
  };

  const resultado = useMemo(() => {
    const r = ordenados.filter((p) => cumple(p));
    if (orden === 'az') r.sort(porNombre);
    if (orden === 'za') r.sort((a, b) => porNombre(b, a));
    if (orden === 'peso-asc') r.sort((a, b) => (a.kgm ?? 0) - (b.kgm ?? 0));
    if (orden === 'peso-desc') r.sort((a, b) => (b.kgm ?? 0) - (a.kgm ?? 0));
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenados, termino, tiposSel, filtros, pesoMin, pesoMax, orden]);

  /* Propiedades filtrables de los tipos elegidos, con conteo por opción. */
  const facetas = useMemo(() => {
    const base = ordenados.filter((p) => !tiposSel.length || tiposSel.includes(p.tipo));
    const claves = [...new Set(base.flatMap((p) => Object.keys(p.props)))];
    return claves.map((clave) => {
      const valores = [...new Set(base.map((p) => p.props[clave]).filter(Boolean))].sort(compararValores);
      const conteo = (v: string) => ordenados.filter((p) => p.props[clave] === v && cumple(p, clave)).length;
      return { clave, valores: valores.map((v) => ({ valor: v, n: conteo(v) })) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenados, termino, tiposSel, filtros, pesoMin, pesoMax]);

  useEffect(() => setPagina(1), [termino, tiposSel, filtros, pesoMin, pesoMax, orden]);

  const paginas = Math.max(1, Math.ceil(resultado.length / POR_PAGINA));
  const visibles = resultado.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const alternar = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const alternarFiltro = (clave: string, valor: string) =>
    setFiltros((f) => ({ ...f, [clave]: alternar(f[clave] ?? [], valor) }));

  const chips = [
    ...(termino ? [{ texto: `“${busqueda.trim()}”`, quitar: () => setBusqueda('') }] : []),
    ...tiposSel.map((t) => ({ texto: plural(t), quitar: () => setTiposSel((s) => s.filter((x) => x !== t)) })),
    ...Object.entries(filtros).flatMap(([clave, valores]) =>
      valores.map((v) => ({ texto: `${clave} ${v}`, quitar: () => alternarFiltro(clave, v) })),
    ),
    ...(pesoMin || pesoMax
      ? [{ texto: `${pesoMin || '0'}–${pesoMax || 'máx.'} kg/m`, quitar: () => { setPesoMin(''); setPesoMax(''); } }]
      : []),
  ];
  const limpiar = () => { setBusqueda(''); setTiposSel([]); setFiltros({}); setPesoMin(''); setPesoMax(''); };

  const cantidad = (id: string) => lista[id] ?? 0;
  const enLista = (id: string) => cantidad(id) > 0;
  const fijarCantidad = (id: string, n: number) =>
    setLista((l) => {
      const copia = { ...l };
      if (n > 0) copia[id] = Math.min(Math.round(n), 9999);
      else delete copia[id];
      return copia;
    });
  const alternarLista = (id: string) => fijarCantidad(id, enLista(id) ? 0 : 1);
  const enMiLista = ordenados.filter((p) => enLista(p.id));
  const totalPiezas = enMiLista.reduce((t, p) => t + cantidad(p.id), 0);
  const pesoTotal = enMiLista.length && enMiLista.every((p) => pesoPieza(p) !== null)
    ? enMiLista.reduce((t, p) => t + (pesoPieza(p) ?? 0) * cantidad(p.id), 0)
    : null;
  const describir = (p: ArticuloCatalogo) => `${p.nombre} (${p.medida}${p.norma ? `, ${p.norma}` : ''})`;
  const renglon = (p: ArticuloCatalogo, n: number) => {
    const peso = pesoPieza(p);
    return `${n} ${unidad(p, n)} de ${describir(p)}${peso !== null ? `, aprox. ${kg(peso * n)} kg` : ''}`;
  };
  const mensajePieza = (p: ArticuloCatalogo) =>
    enLista(p.id) ? `Hola, quiero cotizar: ${renglon(p, cantidad(p.id))}.` : `Hola, quiero cotizar: ${describir(p)}. Cantidad: `;
  const mensajeLista = () =>
    [
      'Hola, quiero cotizar estos productos:',
      ...enMiLista.map((p) => `- ${renglon(p, cantidad(p.id))}`),
      pesoTotal !== null ? `Peso aproximado total: ${kg(pesoTotal)} kg` : '',
    ]
      .filter(Boolean)
      .join('\n');

  const irAPagina = (n: number) => {
    setPagina(n);
    document.getElementById('catalogo-filtros')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const casilla = 'size-4 shrink-0 accent-green-700';
  const tituloFiltro = 'flex w-full items-center justify-between py-1 type-label uppercase text-text-primary';
  const enlaceNombre = (p: ArticuloCatalogo, clase: string) =>
    p.href ? <a href={p.href} className={`${clase} hover:text-text-brand hover:underline`}>{p.nombre}</a> : <span className={clase}>{p.nombre}</span>;
  const fuentesUsadas = fuentes ? Object.entries(fuentes).filter(([t]) => tipos.includes(t)) : [];

  return (
    <div id="catalogo-filtros" data-catalogo className="grid scroll-mt-24 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* ---------- Filtro lateral ---------- */}
      <div className="min-w-0">
        <button
          type="button"
          className={buttonClasses({ variant: 'outline', size: 'md', className: 'w-full lg:hidden' })}
          aria-expanded={verFiltros}
          aria-controls="ca-filtros"
          onClick={() => setVerFiltros((v) => !v)}
        >
          {verFiltros ? 'Ocultar filtros' : `Filtrar${chips.length ? ` (${chips.length})` : ''}`}
        </button>
        <aside
          id="ca-filtros"
          aria-label="Filtros"
          className={`${verFiltros ? 'block' : 'hidden'} mt-3 bg-surface-primary p-5 lg:sticky lg:top-24 lg:mt-0 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto`}
        >
          <div className="flex items-center justify-between">
            <p className="type-h4 text-text-primary">Filtros</p>
            {chips.length > 0 && (
              <button type="button" onClick={limpiar} className="type-label text-text-brand hover:underline">Limpiar todo</button>
            )}
          </div>

          {chips.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {chips.map((c) => (
                <li key={c.texto}>
                  <button type="button" onClick={c.quitar} className="inline-flex items-center gap-2 bg-neutral-100 px-3 py-1.5 type-body-s text-text-primary hover:bg-neutral-200" aria-label={`Quitar filtro ${c.texto}`}>
                    {c.texto}
                    <Icon name="x" className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tipos.length > 1 && (
            <fieldset className="mt-5 border-t border-border-default pt-4">
              <legend className={tituloFiltro}>{etiquetaTipo}</legend>
              <ul className="mt-2 flex flex-col gap-2">
                {tipos.map((t) => {
                  const n = ordenados.filter((p) => p.tipo === t && cumple(p, '__tipo')).length;
                  return (
                    <li key={t}>
                      <label className={`flex cursor-pointer items-center gap-3 type-body-s ${n ? 'text-text-primary' : 'text-text-muted'}`}>
                        <input type="checkbox" className={casilla} checked={tiposSel.includes(t)} onChange={() => setTiposSel((s) => alternar(s, t))} />
                        <span className="flex-1">{plural(t)}</span>
                        <span className="text-text-muted">({n})</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}

          {facetas.map(({ clave, valores }) => {
            if (valores.length < 2) return null;
            const todos = abiertos[clave];
            const mostrados = todos ? valores : valores.slice(0, VALORES_VISIBLES);
            const sel = filtros[clave] ?? [];
            const largos = valores.some(({ valor }) => valor.length > 9);
            return (
              <fieldset key={clave} className="mt-5 border-t border-border-default pt-4">
                <legend className={tituloFiltro}>
                  <span>{clave}</span>
                  {sel.length > 0 && <span className="ml-2 bg-green-700 px-1.5 type-label text-text-on-brand">{sel.length}</span>}
                </legend>
                <ul className={`mt-2 grid gap-x-3 gap-y-2 ${largos ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {mostrados.map(({ valor, n }) => (
                    <li key={valor}>
                      <label className={`flex cursor-pointer items-center gap-2 type-body-s ${n ? 'text-text-primary' : 'text-text-muted'}`}>
                        <input type="checkbox" className={casilla} checked={sel.includes(valor)} disabled={!n && !sel.includes(valor)} onChange={() => alternarFiltro(clave, valor)} />
                        <span className="flex-1">{valor}</span>
                        <span className="text-text-muted">{n}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                {valores.length > VALORES_VISIBLES && (
                  <button type="button" onClick={() => setAbiertos((a) => ({ ...a, [clave]: !todos }))} className="mt-3 type-label text-text-brand hover:underline" aria-expanded={!!todos}>
                    {todos ? 'Ver menos' : `Ver más (${valores.length - VALORES_VISIBLES})`}
                  </button>
                )}
              </fieldset>
            );
          })}

          {conPeso && (
            <fieldset className="mt-5 border-t border-border-default pt-4">
              <legend className={tituloFiltro}>Peso por metro</legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="type-body-s text-text-secondary">
                  Mínimo
                  <input type="number" inputMode="decimal" min="0" step="0.5" value={pesoMin} onChange={(e) => setPesoMin(e.target.value)} placeholder="kg/m" className="ca-campo mt-1 h-10 w-full border-0 border-b border-border-field bg-surface-field px-3 text-text-primary" />
                </label>
                <label className="type-body-s text-text-secondary">
                  Máximo
                  <input type="number" inputMode="decimal" min="0" step="0.5" value={pesoMax} onChange={(e) => setPesoMax(e.target.value)} placeholder="kg/m" className="ca-campo mt-1 h-10 w-full border-0 border-b border-border-field bg-surface-field px-3 text-text-primary" />
                </label>
              </div>
            </fieldset>
          )}

          {fuentesUsadas.length > 0 && (
            <p className="mt-6 border-t border-border-default pt-4 type-body-s text-text-muted">
              Pesos y dimensiones teóricos, de las tablas de{' '}
              {fuentesUsadas.map(([t, url], i, arr) => (
                <span key={t}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-text-primary">{t.toLocaleLowerCase('es-MX')}</a>
                  {i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ' y ' : ''}
                </span>
              ))}
              {' '}de acerosfrontera.com.
            </p>
          )}
        </aside>
      </div>

      {/* ---------- Resultados ---------- */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3 bg-surface-primary px-4 py-3 sm:px-5">
          <p className="mr-auto type-body-s text-text-secondary" aria-live="polite">
            <strong className="type-label text-text-primary">{resultado.length}</strong> {unidadConteo} en {titulo.toLocaleLowerCase('es-MX')}
          </p>
          <label className="relative w-full sm:w-56">
            <span className="sr-only">Buscar por nombre o clave</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o clave"
              className="ca-campo h-10 w-full border border-border-default bg-surface-primary pl-9 pr-3 type-body-s text-text-primary"
            />
          </label>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label className="sr-only" htmlFor="ca-orden">Ordenar</label>
            <select id="ca-orden" value={orden} onChange={(e) => setOrden(e.target.value as Orden)} className="ca-campo h-10 min-w-0 flex-1 border border-border-default bg-surface-primary px-3 type-body-s text-text-primary sm:flex-none">
              {conPeso ? (
                <>
                  <option value="natural">Por medida</option>
                  <option value="peso-asc">Peso: menor a mayor</option>
                  <option value="peso-desc">Peso: mayor a menor</option>
                </>
              ) : (
                <>
                  <option value="natural">Con foto primero</option>
                  <option value="az">Nombre: A a Z</option>
                  <option value="za">Nombre: Z a A</option>
                </>
              )}
            </select>
            <div className="flex" role="group" aria-label="Vista">
              {(['tarjetas', 'tabla'] as Vista[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={vista === v}
                  onClick={() => setVista(v)}
                  className={`ca-campo grid size-10 place-items-center border border-border-default ${vista === v ? 'bg-green-700 text-text-on-brand' : 'bg-surface-primary text-text-secondary hover:text-text-primary'}`}
                  aria-label={v === 'tarjetas' ? 'Ver como tarjetas' : 'Ver como tabla'}
                >
                  {v === 'tarjetas' ? (
                    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M3 4h18v3H3zM3 10.5h18v3H3zM3 17h18v3H3z" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {resultado.length === 0 ? (
          <div className="mt-4 bg-surface-primary p-10 text-center">
            <p className="type-h4 text-text-primary">Nada coincide con esos filtros.</p>
            <p className="mt-2 type-body-s text-text-secondary">Quita algún filtro o pregúntanos por lo que buscas.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={limpiar} className={buttonClasses({ variant: 'tertiary', size: 'md' })}>Limpiar filtros</button>
              <a href={waUrl(whatsapp, `Hola, busco ${busqueda.trim() ? `"${busqueda.trim()}"` : `un producto de ${titulo.toLocaleLowerCase('es-MX')}`} y no lo encuentro en el catálogo.`)} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'secondary', size: 'md' })}>
                Preguntar por WhatsApp <Icon name="whatsapp" />
              </a>
            </div>
          </div>
        ) : vista === 'tarjetas' ? (
          <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {visibles.map((p) => (
              <li key={p.id} className="grid min-w-0 grid-cols-[6rem_minmax(0,1fr)] bg-surface-primary sm:flex sm:flex-col">
                <div className="ca-plano relative overflow-hidden border-r border-border-default sm:aspect-[4/3] sm:border-r-0 sm:border-b">
                  <Media articulo={p} />
                  {p.norma && <span className="absolute left-3 top-3 hidden bg-accent-primary px-2 py-0.5 type-label text-text-on-accent sm:block">{p.norma}</span>}
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                  <h3 className="type-h4 text-text-primary">{enlaceNombre(p, '')}</h3>
                  <p className="mt-1 type-body-s text-text-secondary">
                    {p.medida}
                    {p.norma && <span className="sm:hidden">, {p.norma}</span>}
                  </p>
                  {p.kgm != null && (
                    <p className="mt-2 font-display text-2xl font-extrabold text-text-primary sm:mt-4 sm:text-3xl">
                      {kg(p.kgm)} <span className="text-base font-bold text-text-secondary sm:text-lg">kg/m</span>
                    </p>
                  )}
                  {p.pesos && (
                    <dl className="mt-1 grid gap-0.5 type-body-s text-text-secondary">
                      {p.pesos.map(([etiqueta, valor], k) => (
                        <div key={etiqueta} className={`${k > 0 ? 'hidden sm:flex' : 'flex'} justify-between gap-3`}>
                          <dt>{etiqueta}</dt>
                          <dd className="text-text-primary">{valor}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2 pt-3 sm:pt-5">
                    <a href={waUrl(whatsapp, mensajePieza(p))} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'secondary', size: 'md', className: `min-w-0 flex-1 px-3! ${enLista(p.id) ? 'max-sm:basis-full' : ''}` })}>
                      Cotizar <Icon name="whatsapp" />
                    </a>
                    {enLista(p.id) ? (
                      <Cantidad valor={cantidad(p.id)} nombre={p.nombre} cambiar={(n) => fijarCantidad(p.id, n)} className="max-sm:basis-full sm:w-32" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => alternarLista(p.id)}
                        className={buttonClasses({ variant: 'tertiary', size: 'md', className: 'w-11 shrink-0 px-0! sm:w-full sm:basis-full sm:px-6!' })}
                      >
                        <span className="sr-only sm:not-sr-only">Agregar a mi lista</span>
                        <Icon name="cart-plus" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <>
            {/* Celular: lista compacta en lugar de la tabla ancha. */}
            <ul className="mt-4 divide-y divide-border-default bg-surface-primary sm:hidden">
              {visibles.map((p) => (
                <li key={p.id} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 type-body-s font-semibold text-text-primary">{enlaceNombre(p, '')}</p>
                    {p.kgm != null && <p className="shrink-0 type-body-s font-semibold text-text-primary">{kg(p.kgm)} kg/m</p>}
                  </div>
                  <p className="mt-0.5 type-body-s text-text-secondary">{p.medida}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <a href={waUrl(whatsapp, mensajePieza(p))} target="_blank" rel="noopener noreferrer" className="type-label text-text-brand">Cotizar</a>
                    {enLista(p.id) ? (
                      <Cantidad valor={cantidad(p.id)} nombre={p.nombre} cambiar={(n) => fijarCantidad(p.id, n)} className="w-32" />
                    ) : (
                      <button type="button" onClick={() => alternarLista(p.id)} className="type-label text-text-secondary">Agregar a lista</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 hidden max-w-full overflow-x-auto bg-surface-primary sm:block">
              <table className="w-full min-w-[40rem] text-left type-body-s">
                <thead className="border-b-2 border-neutral-900 type-label uppercase text-text-primary">
                  <tr>
                    <th scope="col" className="px-4 py-3">{conPeso ? 'Pieza' : 'Producto'}</th>
                    <th scope="col" className="px-4 py-3">{conPeso ? 'Medida' : 'Clave'}</th>
                    {conPeso ? (
                      <>
                        <th scope="col" className="px-4 py-3 text-right">kg/m</th>
                        <th scope="col" className="px-4 py-3">Dato de tabla</th>
                      </>
                    ) : (
                      <th scope="col" className="px-4 py-3">{etiquetaTipo}</th>
                    )}
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((p) => (
                    <tr key={p.id} className="border-b border-border-default">
                      <th scope="row" className={`px-4 py-3 font-semibold text-text-primary ${conPeso ? 'whitespace-nowrap' : ''}`}>{enlaceNombre(p, '')}</th>
                      <td className="px-4 py-3 text-text-secondary">{p.medida}</td>
                      {conPeso ? (
                        <>
                          <td className="px-4 py-3 text-right font-semibold text-text-primary">{p.kgm != null ? kg(p.kgm) : ''}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{p.pesos?.[0] ? `${p.pesos[0][0]}: ${p.pesos[0][1]}` : ''}</td>
                        </>
                      ) : (
                        <td className="px-4 py-3 text-text-secondary">{p.tipo}</td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                          <a href={waUrl(whatsapp, mensajePieza(p))} target="_blank" rel="noopener noreferrer" className="type-label text-text-brand hover:underline">Cotizar</a>
                          {enLista(p.id) ? (
                            <Cantidad valor={cantidad(p.id)} nombre={p.nombre} cambiar={(n) => fijarCantidad(p.id, n)} className="w-32" />
                          ) : (
                            <button type="button" onClick={() => alternarLista(p.id)} className="type-label text-text-secondary hover:text-text-primary hover:underline">Agregar a lista</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {paginas > 1 && (
          <nav aria-label="Páginas de resultados" className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button type="button" disabled={pagina === 1} onClick={() => irAPagina(pagina - 1)} className="px-3 py-2 type-label text-text-secondary hover:text-text-primary disabled:text-text-disabled">Anterior</button>
            {Array.from({ length: paginas }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === paginas || Math.abs(n - pagina) <= 1)
              .map((n, i, arr) => (
                <span key={n} className="flex items-center gap-2">
                  {i > 0 && n - arr[i - 1] > 1 && <span className="text-text-muted" aria-hidden="true">…</span>}
                  <button
                    type="button"
                    aria-current={n === pagina ? 'page' : undefined}
                    onClick={() => irAPagina(n)}
                    className={`ca-campo grid size-10 place-items-center type-label ${n === pagina ? 'bg-green-700 text-text-on-brand' : 'bg-surface-primary text-text-primary hover:bg-neutral-200'}`}
                  >
                    {n}
                  </button>
                </span>
              ))}
            <button type="button" disabled={pagina === paginas} onClick={() => irAPagina(pagina + 1)} className="px-3 py-2 type-label text-text-secondary hover:text-text-primary disabled:text-text-disabled">Siguiente</button>
          </nav>
        )}

        {enMiLista.length > 0 && (
          <div className="sticky bottom-4 z-20 mt-6 mr-18 flex items-center justify-between gap-3 bg-neutral-950 px-4 py-3 text-text-inverse shadow-lg sm:px-5 sm:py-4 lg:mr-0" role="region" aria-label="Tu lista de cotización">
            <p className="shrink-0 whitespace-nowrap type-body-s">
              <strong className="type-label text-text-accent">{totalPiezas} {totalPiezas === 1 ? 'pieza' : 'piezas'}</strong>
              <span className="hidden sm:inline">
                {' '}en tu lista{pesoTotal !== null ? `, aprox. ${kg(pesoTotal)} kg` : ''}
              </span>
            </p>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button type="button" onClick={() => setLista({})} aria-label="Vaciar la lista" className="grid size-10 place-items-center type-label text-text-inverse-muted hover:text-text-inverse sm:size-auto sm:px-3 sm:py-2"><Icon name="x" className="size-4 sm:hidden" /><span className="hidden sm:inline">Vaciar</span></button>
              <a href={waUrl(whatsapp, mensajeLista())} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'secondary', size: 'md', className: 'px-4! sm:px-6!' })}>
                <span>Cotizar<span className="hidden sm:inline"> mi lista</span></span> <Icon name="whatsapp" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
