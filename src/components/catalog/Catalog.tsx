import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import ProductRow from './ProductRow';
import Icon from '../ui/Icon';
import { formatCLP, normalizar } from '../../lib/format';
import type { Producto } from '../../lib/types';

interface CatalogProps {
  productos: Producto[];
  categorias: string[];
  whatsapp: string;
}

// Filtros generales que se muestran antes de las categorías del catálogo.
const FILTROS_FIJOS = [
  { id: 'todos', label: 'Todos' },
  { id: 'destacados', label: 'Más vendidos' },
  { id: 'ofertas', label: 'Ofertas' },
];

const FILTROS_ESPECIALES = FILTROS_FIJOS.map((filtro) => filtro.id);

export default function Catalog({ productos, categorias, whatsapp }: CatalogProps) {
  // Estado compartido por la búsqueda, los filtros y la ficha seleccionada.
  const [consulta, setConsulta] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [productoActivo, setProductoActivo] = useState<Producto | null>(null);

  // Guarda el producto en la URL para conservar la ficha al recargar o navegar atrás/adelante.
  const actualizarUrlProducto = (slug: string | null, reemplazar = false) => {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set('producto', slug);
    else url.searchParams.delete('producto');

    window.history[reemplazar ? 'replaceState' : 'pushState']({}, '', url);
  };

  // Sincroniza búsqueda, ficha y URL con los eventos del navbar y del historial del navegador.
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
      const producto = productos.find((item) => item.slug === slug) ?? null;
      setProductoActivo(producto);
      if (producto && new URL(window.location.href).searchParams.get('producto') !== slug) {
        actualizarUrlProducto(slug);
      }
    };

    const restaurarDesdeUrl = () => {
      const slug = new URL(window.location.href).searchParams.get('producto');
      const producto = productos.find((item) => item.slug === slug) ?? null;
      setProductoActivo(producto);
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
      const productoInicial = productos.find((producto) => producto.slug === slugInicial);
      if (productoInicial) {
        setProductoActivo(productoInicial);
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
  }, [productos]);

  // Combina filtros fijos con las categorías disponibles.
  const tabs = useMemo(
    () => [...FILTROS_FIJOS, ...categorias.map((categoria) => ({ id: categoria, label: categoria }))],
    [categorias],
  );

  // Filtra por estado/categoría y busca términos en nombre, marca, SKU y etiquetas.
  const resultados = useMemo(() => {
    const terminos = normalizar(consulta).split(/\s+/).filter(Boolean);

    return productos.filter((producto) => {
      if (filtro === 'destacados' && !producto.destacado) return false;
      if (filtro === 'ofertas' && !producto.precioAnterior) return false;
      if (!FILTROS_ESPECIALES.includes(filtro) && producto.categoria !== filtro) return false;

      if (terminos.length === 0) return true;

      const texto = normalizar(
        [
          producto.nombre,
          producto.marca ?? '',
          producto.sku ?? '',
          producto.categoria,
          producto.etiquetas.join(' '),
        ].join(' '),
      );

      return terminos.every((termino) => texto.includes(termino));
    });
  }, [productos, consulta, filtro]);

  // Productos de la misma categoría, completados con destacados si hay pocos relacionados.
  const productosRelacionados = useMemo(() => {
    if (!productoActivo) return [];

    const disponibles = productos.filter((producto) => producto.slug !== productoActivo.slug);
    const mismaCategoria = disponibles.filter(
      (producto) => producto.categoria === productoActivo.categoria,
    );
    const complementarios = disponibles.filter(
      (producto) => producto.categoria !== productoActivo.categoria && producto.destacado,
    );

    return [...mismaCategoria, ...complementarios].slice(0, 4);
  }, [productos, productoActivo]);

  const hayFiltros = consulta.trim() !== '' || filtro !== 'todos';

  // Acciones de catálogo y navegación a la ficha exclusiva de un producto.
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

  const mensajeCotizar = productoActivo
    ? `Hola, quiero cotizar: ${productoActivo.nombre}${productoActivo.sku ? ` (SKU ${productoActivo.sku})` : ''}${productoActivo.precio ? ` por ${formatCLP(productoActivo.precio)}` : ''}.`
    : '';
  const mensajeMayorista = productoActivo
    ? `Hola, necesito precio por volumen de: ${productoActivo.nombre}${productoActivo.sku ? ` (SKU ${productoActivo.sku})` : ''}.`
    : '';

  return (
    <div className={productoActivo ? 'mt-0' : 'mt-10'}>
      {/* Controles para filtrar el catálogo; se ocultan dentro de la ficha. */}
      {!productoActivo ? <div className="rounded-panel border border-line bg-white p-4 shadow-card">
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
                    ? 'bg-white text-ink-900 shadow-card'
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
              placeholder="Buscar por producto, marca o SKU…"
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
      </div> : null}

      {/* Vista exclusiva del producto con precio, disponibilidad, especificaciones y cotización. */}
      {productoActivo ? (
        <section aria-labelledby="detalle-producto-titulo" className="grid bg-white md:grid-cols-2">
            <div className="flex min-h-64 items-center justify-center bg-white p-6 sm:min-h-[60vh] sm:p-10 lg:min-h-0">
              <img
                src={productoActivo.imagen}
                alt={productoActivo.nombre}
                width="800"
                height="600"
                className="max-h-[28rem] w-full object-contain"
              />
            </div>
            <div className="mx-auto flex w-full max-w-2xl flex-col p-5 sm:p-8 lg:justify-center lg:p-12 xl:p-16">
              <button
                type="button"
                onClick={volverAResultados}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                <Icon name="arrow-right" className="size-4 rotate-180" />
                Volver a resultados
              </button>
              <p className="mt-6 text-xs font-bold uppercase tracking-wide text-ink-500">
                {[productoActivo.marca, productoActivo.categoria, productoActivo.sku ? `SKU ${productoActivo.sku}` : ''].filter(Boolean).join(' · ')}
              </p>
              <h2 id="detalle-producto-titulo" className="mt-2 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
                {productoActivo.nombre}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-600">{productoActivo.resumen}</p>
              <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-3xl font-extrabold text-ink-900">
                  {productoActivo.precio ? formatCLP(productoActivo.precio) : 'Consultar precio'}
                </span>
                {productoActivo.precio && productoActivo.precioAnterior ? (
                  <span className="text-sm text-ink-400 line-through">
                    {formatCLP(productoActivo.precioAnterior)}
                  </span>
                ) : null}
                <span className={`text-sm font-semibold ${productoActivo.stock && productoActivo.stock > 0 ? 'text-brand-700' : 'text-ink-500'}`}>
                  {productoActivo.stock ? `${productoActivo.stock} en stock` : productoActivo.stock === 0 ? 'Sobre pedido' : 'Consultar disponibilidad'}
                </span>
              </div>
              {productoActivo.especificaciones && Object.keys(productoActivo.especificaciones).length > 0 ? (
                <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-line pt-5 text-sm">
                  {Object.entries(productoActivo.especificaciones).map(([nombre, valor]) => (
                    <div key={nombre}>
                      <dt className="text-xs text-ink-500">{nombre}</dt>
                      <dd className="mt-0.5 font-semibold text-ink-800">{valor}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <div className="mt-7 flex flex-col gap-3 xl:flex-row">
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeCotizar)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-field bg-accent-400 px-4 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-accent-500 md:flex-1"
                >
                  <Icon name="whatsapp" className="size-5" />
                  Cotizar este producto
                </a>
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeMayorista)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-field border border-line bg-white px-4 py-3 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-300 hover:bg-ink-50 md:flex-1"
                >
                  <Icon name="building" className="size-5" />
                  Precio por volumen
                </a>
              </div>
            </div>
            {productosRelacionados.length > 0 ? (
              <div className="border-t border-line py-8 sm:px-8 md:col-span-2 lg:px-12 lg:py-10 xl:px-16">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-[0.16em] text-brand-600">
                      También puede interesarte
                    </p>
                    <h3 className="mt-1 font-display text-xl font-bold text-ink-900">
                      Productos relacionados
                    </h3>
                  </div>
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
      {/* Resultados como lista al buscar y como tarjetas en la vista general. */}
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
            No encontramos productos con esos filtros. Prueba con otra palabra o revisa todo el
            catálogo.
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
