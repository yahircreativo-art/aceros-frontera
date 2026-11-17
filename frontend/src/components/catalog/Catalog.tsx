import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import ProductRow from './ProductRow';
import Icon from '../ui/Icon';
import { normalizar } from '../../lib/format';
import { obtenerProductosSupabase } from '../../lib/supabase-productos';
import type { Producto } from '../../lib/types';

interface CatalogProps {
  productos: Producto[];
  whatsapp: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  supabaseTable?: string;
}

// Filtro inicial para ver todos los productos
const FILTROS_FIJOS = [
  { id: 'todos', label: 'Todos' },
];

export default function Catalog({
  productos,
  whatsapp,
  supabaseUrl,
  supabaseKey,
  supabaseTable,
}: CatalogProps) {
  const [productosActuales, setProductosActuales] = useState(productos);
  const [imgError, setImgError] = useState(false);

  const categoriasActuales = useMemo(
    () => [...new Set(productosActuales.map((producto) => producto.categoria).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    ),
    [productosActuales],
  );

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey || !supabaseTable) return;

    let cancelado = false;
    obtenerProductosSupabase({
      url: supabaseUrl,
      clavePublica: supabaseKey,
      tabla: supabaseTable,
    })
      .then((productosNuevos) => {
        if (cancelado) return;
        const ordenados = productosNuevos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        setProductosActuales(ordenados);
        window.dispatchEvent(new CustomEvent('catalog-products-updated', { detail: ordenados }));
      })
      .catch((error: unknown) => {
        if (!cancelado) console.error('[catálogo] No se pudieron actualizar los productos desde Supabase.', error);
      });

    return () => {
      cancelado = true;
    };
  }, [supabaseUrl, supabaseKey, supabaseTable]);

  // Estado compartido por la búsqueda, los filtros y la ficha seleccionada
  const [consulta, setConsulta] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [productoActivo, setProductoActivo] = useState<Producto | null>(null);

  // Guarda el producto en la URL para conservar la ficha al recargar o navegar atrás/adelante
  const actualizarUrlProducto = (slug: string | null, reemplazar = false) => {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set('producto', slug);
    else url.searchParams.delete('producto');

    window.history[reemplazar ? 'replaceState' : 'pushState']({}, '', url);
  };

  useEffect(() => {
    const recibirBusqueda = (evento: Event) => {
      setConsulta((evento as CustomEvent<string>).detail);
    };

    const recibirCategoria = (evento: Event) => {
      setFiltro((evento as CustomEvent<string>).detail);
      setProductoActivo(null);
    };

    const reiniciarCatalogo = () => {
      setConsulta('');
      setFiltro('todos');
      setProductoActivo(null);
      actualizarUrlProducto(null, true);
    };

    const mostrarDetalle = (evento: Event) => {
      const slug = (evento as CustomEvent<string>).detail;
      const producto = productosActuales.find((item) => item.slug === slug) ?? null;
      setProductoActivo(producto);
      setImgError(false);
      if (producto && new URL(window.location.href).searchParams.get('producto') !== slug) {
        actualizarUrlProducto(slug);
      }
    };

    const restaurarDesdeUrl = () => {
      const slug = new URL(window.location.href).searchParams.get('producto');
      const producto = productosActuales.find((item) => item.slug === slug) ?? null;
      setProductoActivo(producto);
      setImgError(false);
      if (producto) {
        window.dispatchEvent(new CustomEvent('catalog-search', { detail: producto.nombre }));
        window.dispatchEvent(new CustomEvent('catalog-product-detail', { detail: producto.slug }));
      } else {
        window.dispatchEvent(new Event('catalog-product-close'));
      }
    };

    window.addEventListener('catalog-search', recibirBusqueda);
    window.addEventListener('catalog-category', recibirCategoria);
    window.addEventListener('catalog-reset', reiniciarCatalogo);
    window.addEventListener('catalog-product-detail', mostrarDetalle);
    window.addEventListener('popstate', restaurarDesdeUrl);

    const slugInicial = new URL(window.location.href).searchParams.get('producto');
    if (slugInicial) {
      const productoInicial = productosActuales.find((producto) => producto.slug === slugInicial);
      if (productoInicial) {
        setProductoActivo(productoInicial);
        setImgError(false);
        window.dispatchEvent(new CustomEvent('catalog-search', { detail: productoInicial.nombre }));
        window.dispatchEvent(new CustomEvent('catalog-product-detail', { detail: productoInicial.slug }));
      }
    }

    return () => {
      window.removeEventListener('catalog-search', recibirBusqueda);
      window.removeEventListener('catalog-category', recibirCategoria);
      window.removeEventListener('catalog-reset', reiniciarCatalogo);
      window.removeEventListener('catalog-product-detail', mostrarDetalle);
      window.removeEventListener('popstate', restaurarDesdeUrl);
    };
  }, [productosActuales]);

  // Pestañas de categorías disponibles
  const tabs = useMemo(
    () => [...FILTROS_FIJOS, ...categoriasActuales.map((categoria) => ({ id: categoria, label: categoria }))],
    [categoriasActuales],
  );

  // Filtra por categoría y busca términos en Nombre y Clave
  const resultados = useMemo(() => {
    const terminos = normalizar(consulta).split(/\s+/).filter(Boolean);

    return productosActuales.filter((producto) => {
      if (filtro !== 'todos' && producto.categoria !== filtro) return false;

      if (terminos.length === 0) return true;

      const texto = normalizar(
        [
          producto.nombre,
          producto.clave,
          producto.sku ?? '',
          producto.categoria,
        ].filter(Boolean).join(' '),
      );

      return terminos.every((termino) => texto.includes(termino));
    });
  }, [productosActuales, consulta, filtro]);

  // Productos relacionados de la misma categoría
  const productosRelacionados = useMemo(() => {
    if (!productoActivo) return [];

    return productosActuales
      .filter((producto) => producto.slug !== productoActivo.slug && producto.categoria === productoActivo.categoria)
      .slice(0, 4);
  }, [productosActuales, productoActivo]);

  const hayFiltros = consulta.trim() !== '' || filtro !== 'todos';

  const limpiar = () => {
    setConsulta('');
    setFiltro('todos');
    setProductoActivo(null);
    actualizarUrlProducto(null, true);
    window.dispatchEvent(new CustomEvent('catalog-search', { detail: '' }));
  };

  const verDetalle = (producto: Producto) => {
    window.dispatchEvent(new CustomEvent('catalog-product-detail', { detail: producto.slug }));
    window.scrollTo(0, 0);
  };

  const volverAResultados = () => {
    setProductoActivo(null);
    actualizarUrlProducto(null, true);
    window.dispatchEvent(new Event('catalog-product-close'));
  };

  const claveActiva = productoActivo?.clave ?? productoActivo?.sku;
  const mensajeCotizar = productoActivo
    ? `Hola, quiero cotizar el producto: ${productoActivo.nombre}${claveActiva ? ` (Clave: ${claveActiva})` : ''}.`
    : '';

  return (
    <div className={productoActivo ? 'mt-0' : 'mt-10'}>
      {/* Controles para filtrar por categoría y búsqueda */}
      {!productoActivo ? (
        <div className="rounded-panel border border-line bg-white p-4 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Filtrar productos por categoría"
              className="flex gap-1 overflow-x-auto rounded-field bg-ink-50 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={filtro === tab.id}
                  onClick={() => setFiltro(tab.id)}
                  className={`shrink-0 rounded-[6px] px-3 py-2 text-sm font-medium transition-colors ${
                    filtro === tab.id
                      ? 'bg-white text-ink-900 shadow-card font-bold'
                      : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-80">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
              />
              <label className="sr-only" htmlFor="buscar-producto">
                Buscar productos
              </label>
              <input
                id="buscar-producto"
                type="search"
                value={consulta}
                onChange={(evento) => {
                  const valor = evento.target.value;
                  setConsulta(valor);
                  window.dispatchEvent(new CustomEvent('catalog-search', { detail: valor }));
                }}
                placeholder="Buscar por nombre o clave…"
                autoComplete="off"
                className="h-11 w-full rounded-field border border-line bg-white pl-9 pr-10 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              />
              {consulta ? (
                <button
                  type="button"
                  onClick={() => setConsulta('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
                >
                  <Icon name="x" className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Vista de detalle de un producto */}
      {productoActivo ? (
        <section aria-labelledby="detalle-producto-titulo" className="grid bg-white md:grid-cols-2 rounded-panel border border-line shadow-card overflow-hidden">
          <div className="flex min-h-64 items-center justify-center bg-ink-50/50 p-6 sm:min-h-[50vh] sm:p-10">
            {productoActivo.imagen && !imgError ? (
              <img
                src={productoActivo.imagen}
                alt={productoActivo.nombre}
                width="800"
                height="600"
                onError={() => setImgError(true)}
                className="max-h-[28rem] w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-ink-300">
                <Icon name="tag" className="size-16 text-brand-600/30" />
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Aceros Frontera</span>
              </div>
            )}
          </div>

          <div className="mx-auto flex w-full max-w-2xl flex-col p-6 sm:p-8 lg:justify-center lg:p-12">
            <button
              type="button"
              onClick={volverAResultados}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
            >
              <Icon name="arrow-right" className="size-4 rotate-180" />
              Volver al catálogo
            </button>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded bg-brand-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
                {productoActivo.categoria}
              </span>
              {claveActiva ? (
                <span className="font-mono text-xs font-bold text-ink-500 bg-ink-50 px-2.5 py-1 rounded">
                  Clave: <span className="text-ink-900">{claveActiva}</span>
                </span>
              ) : null}
            </div>

            <h2 id="detalle-producto-titulo" className="mt-4 font-display text-2xl font-bold text-ink-900 sm:text-3xl leading-snug">
              {productoActivo.nombre}
            </h2>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeCotizar)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-field bg-accent-400 px-5 py-3 text-sm font-bold text-ink-950 transition-colors hover:bg-accent-500 shadow-sm"
              >
                <Icon name="whatsapp" className="size-5" />
                Cotizar este producto por WhatsApp
              </a>
            </div>
          </div>

          {productosRelacionados.length > 0 ? (
            <div className="border-t border-line py-8 px-6 sm:px-8 md:col-span-2 lg:px-12">
              <div className="mb-5">
                <p className="text-2xs font-bold uppercase tracking-[0.16em] text-brand-600">
                  Categoría {productoActivo.categoria}
                </p>
                <h3 className="mt-1 font-display text-xl font-bold text-ink-900">
                  Otros productos relacionados
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {productosRelacionados.map((producto) => (
                  <ProductCard
                    key={producto.slug}
                    producto={producto}
                    whatsapp={whatsapp}
                    onView={verDetalle}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          {/* Contador de resultados */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-500">
            <p aria-live="polite">
              <strong className="font-semibold text-ink-900">{resultados.length}</strong>{' '}
              {resultados.length === 1 ? 'producto' : 'productos'}
              {consulta ? ` para “${consulta}”` : ''}
            </p>

            {hayFiltros ? (
              <button
                type="button"
                onClick={limpiar}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700 transition-colors hover:text-brand-800 hover:underline"
              >
                <Icon name="x" className="size-3.5" />
                Limpiar filtros
              </button>
            ) : null}
          </div>

          {resultados.length > 0 ? (
            consulta.trim() ? (
              <div className="mt-5 space-y-3">
                {resultados.map((producto) => (
                  <ProductRow key={producto.slug} producto={producto} onView={verDetalle} />
                ))}
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {resultados.map((producto) => (
                  <ProductCard
                    key={producto.slug}
                    producto={producto}
                    whatsapp={whatsapp}
                    onView={verDetalle}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="mt-5 flex flex-col items-center rounded-card border border-dashed border-ink-300 bg-white px-6 py-16 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-ink-50 text-ink-400">
                <Icon name="search" className="size-6" />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-ink-900">Sin resultados</h3>
              <p className="mt-2 max-w-md text-sm text-ink-500">
                No encontramos productos con esos filtros. Prueba con otra palabra o revisa todo el catálogo.
              </p>
              <button
                type="button"
                onClick={limpiar}
                className="mt-5 inline-flex items-center gap-2 rounded-field bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Ver todos los productos
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
