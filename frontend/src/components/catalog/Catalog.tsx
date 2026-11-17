import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { badgeClasses } from '../ui/badge-styles';
import { normalizar } from '../../lib/format';
import { rutaCategoria } from '../../lib/categorias';
import { rutaActualSinBase, rutaInterna } from '../../lib/asset-url';
import type { Producto } from '../../lib/types';

interface CatalogProps {
  productos: Producto[];
  whatsapp: string;
  categoriaInicial?: string;
}

/* 24 llena filas completas en todas las rejillas (2, 3, 4 y 6 columnas). */
const PRODUCTOS_POR_PAGINA = 24;

/* Una fila de productos de muestra por bloque de categoría. */
const PRODUCTOS_POR_CATEGORIA = 4;

/* Frase corta que acompaña el nombre de cada categoría. */
const FRASES_CATEGORIA: { palabras: string[]; frase: string }[] = [
  { palabras: ['ferreter'], frase: 'Herramienta, fijación y consumibles para el día a día.' },
  { palabras: ['aerosol'], frase: 'Aplicación rápida y pareja, sin preparar mezclas.' },
  { palabras: ['pintura'], frase: 'Color, protección y acabados para cada superficie.' },
  { palabras: ['puerta', 'ventana'], frase: 'Perfiles, mallas y herrajes para tus instalaciones.' },
  { palabras: ['soldadura'], frase: 'Equipo y consumibles para unir metal con confianza.' },
  { palabras: ['disco', 'austromex'], frase: 'Corte y desbaste de alto rendimiento.' },
  { palabras: ['figura', 'artistic'], frase: 'Detalles forjados y piezas decorativas.' },
  { palabras: ['truper'], frase: 'Herramienta profesional de la marca Truper.' },
  { palabras: ['presto'], frase: 'Accesorios y refacciones para tu compresor.' },
  { palabras: ['fandeli'], frase: 'Abrasivos y lijas para un acabado limpio.' },
];

const fraseDeCategoria = (categoria: string) => {
  const clave = normalizar(categoria);
  const encontrada = FRASES_CATEGORIA.find(({ palabras }) =>
    palabras.some((palabra) => clave.includes(palabra)),
  );

  return encontrada?.frase ?? 'Explora los productos disponibles de esta categoría.';
};

export default function Catalog({ productos, whatsapp, categoriaInicial }: CatalogProps) {
  const [productosActuales, setProductosActuales] = useState(productos);

  /* Orden al azar: se mezcla al montar en el navegador (no en el render del
     servidor) para que cada visita tenga un orden distinto sin romper la
     hidratación de React. */
  useEffect(() => {
    setProductosActuales((actuales) => {
      const copia = [...actuales];
      for (let i = copia.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
      }
      return copia;
    });
  }, []);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    document.getElementById('catalogo')?.setAttribute('data-hidratado', '');
  }, []);

  const [filtro, setFiltro] = useState(categoriaInicial ?? 'todos');
  const [pagina, setPagina] = useState(1);
  const [productoActivo, setProductoActivo] = useState<Producto | null>(null);

  const actualizarUrlProducto = (sku: string | null, reemplazar = false) => {
    const url = new URL(window.location.href);
    if (sku) url.searchParams.set('producto', sku);
    else url.searchParams.delete('producto');

    window.history[reemplazar ? 'replaceState' : 'pushState']({}, '', url);
  };

  const categoriasActuales = useMemo(
    () =>
      [
        ...new Set(
          productosActuales
            .map((producto) => String(producto.Categoria ?? '').trim())
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b, 'es')),
    [productosActuales],
  );

  /* Busca la categoría real que corresponde al texto recibido, para que las
     mayúsculas y los acentos no impidan el filtrado. */
  const resolverCategoria = (valor: string) => {
    const buscada = normalizar(valor);
    return categoriasActuales.find((categoria) => normalizar(categoria ?? '') === buscada) ?? null;
  };

  /* Si se llega con ?categoria=... (menú o promociones) se aplica el filtro. */
  useEffect(() => {
    const categoria = new URL(window.location.href).searchParams.get('categoria');
    if (!categoria) return;

    const resuelta = resolverCategoria(categoria);
    if (resuelta) setFiltro(resuelta);
  }, [categoriasActuales]);

  /* El filtro activo se refleja en la URL. */
  useEffect(() => {
    if (rutaActualSinBase(window.location.pathname) !== '/catalogo') return;

    const url = new URL(window.location.href);
    if (filtro === 'todos') url.searchParams.delete('categoria');
    else url.searchParams.set('categoria', filtro);
    window.history.replaceState({}, '', url);
  }, [filtro]);

  useEffect(() => {
    /* El buscador del header es independiente: solo filtra el catálogo la
       categoría elegida en el menú o en “Compra por categoría”. */
    const recibirCategoria = (evento: Event) => {
      const categoria = (evento as CustomEvent<string>).detail ?? '';
      const esTodos = categoria.toLowerCase().trim() === 'todos';

      setFiltro(esTodos ? 'todos' : resolverCategoria(categoria) ?? 'todos');
      setProductoActivo(null);
    };

    const reiniciarCatalogo = () => {
      setFiltro('todos');
      setProductoActivo(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('categoria');
      window.history.replaceState({}, '', url);
      actualizarUrlProducto(null, true);
    };

    const mostrarDetalle = (evento: Event) => {
      const sku = (evento as CustomEvent<string>).detail;
      const producto = productosActuales.find((item) => String(item.SKU) === sku) ?? null;
      setProductoActivo(producto);
      setImgError(false);
      if (producto && new URL(window.location.href).searchParams.get('producto') !== sku) {
        actualizarUrlProducto(sku);
      }
    };

    const restaurarDesdeUrl = () => {
      const sku = new URL(window.location.href).searchParams.get('producto');
      const producto = productosActuales.find((item) => String(item.SKU) === sku) ?? null;
      setProductoActivo(producto);
      setImgError(false);
      if (producto) {
        window.dispatchEvent(new CustomEvent('catalog-search', { detail: producto.Nombre ?? '' }));
        window.dispatchEvent(new CustomEvent('catalog-product-detail', { detail: producto.SKU ?? '' }));
      } else {
        window.dispatchEvent(new Event('catalog-product-close'));
      }
    };

    window.addEventListener('catalog-category', recibirCategoria);
    window.addEventListener('catalog-reset', reiniciarCatalogo);
    window.addEventListener('catalog-product-detail', mostrarDetalle);
    window.addEventListener('popstate', restaurarDesdeUrl);

    const skuInicial = new URL(window.location.href).searchParams.get('producto');
    if (skuInicial) {
      const productoInicial = productosActuales.find((producto) => String(producto.SKU) === skuInicial);
      if (productoInicial) {
        setProductoActivo(productoInicial);
        setImgError(false);
        window.dispatchEvent(new CustomEvent('catalog-search', { detail: productoInicial.Nombre ?? '' }));
        window.dispatchEvent(new CustomEvent('catalog-product-detail', { detail: productoInicial.SKU ?? '' }));
      }
    }

    return () => {
      window.removeEventListener('catalog-category', recibirCategoria);
      window.removeEventListener('catalog-reset', reiniciarCatalogo);
      window.removeEventListener('catalog-product-detail', mostrarDetalle);
      window.removeEventListener('popstate', restaurarDesdeUrl);
    };
  }, [productosActuales]);

  const resultados = useMemo(
    () =>
      productosActuales.filter(
        (producto) =>
          filtro === 'todos' || String(producto.Categoria ?? '').trim() === filtro,
      ),
    [productosActuales, filtro],
  );

  const productosRelacionados = useMemo(() => {
    if (!productoActivo) return [];

    return productosActuales
      .filter(
        (producto) =>
          String(producto.SKU) !== String(productoActivo.SKU) &&
          producto.Categoria === productoActivo.Categoria,
      )
      .slice(0, 4);
  }, [productosActuales, productoActivo]);

  useEffect(() => {
    setPagina(1);
  }, [filtro]);

  const totalPaginas = Math.max(1, Math.ceil(resultados.length / PRODUCTOS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicioPagina = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
  const productosPagina = useMemo(
    () => resultados.slice(inicioPagina, inicioPagina + PRODUCTOS_POR_PAGINA),
    [resultados, inicioPagina],
  );

  /* Números visibles: primera, última, la actual y sus vecinas.
     Cuando hay un salto entre números se muestra un “…” para que
     todo quepa en una sola fila. */
  const paginasVisibles = useMemo(() => {
    const incluir = new Set<number>([1, totalPaginas, paginaActual]);

    for (let distancia = 1; distancia <= 1; distancia += 1) {
      if (paginaActual - distancia >= 1) incluir.add(paginaActual - distancia);
      if (paginaActual + distancia <= totalPaginas) incluir.add(paginaActual + distancia);
    }

    const ordenadas = Array.from(incluir).sort((a, b) => a - b);

    return ordenadas.reduce<Array<number | 'gap'>>((acumulado, numero, indice) => {
      if (indice > 0 && numero - ordenadas[indice - 1] > 1) acumulado.push('gap');
      acumulado.push(numero);
      return acumulado;
    }, []);
  }, [paginaActual, totalPaginas]);

  /* Portada del catálogo: una muestra de productos por categoría. */
  const gruposPorCategoria = useMemo(() => {
    const porCategoria = new Map<string, Producto[]>();

    for (const producto of productosActuales) {
      const categoria = (producto.Categoria ?? '').trim();
      if (!categoria) continue;

      const lista = porCategoria.get(categoria) ?? [];
      lista.push(producto);
      porCategoria.set(categoria, lista);
    }

    return [...porCategoria.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([categoria, lista]) => ({
        categoria,
        productos: lista.slice(0, PRODUCTOS_POR_CATEGORIA),
      }));
  }, [productosActuales]);

  /* Sin búsqueda ni categoría elegidas se muestra la portada por categorías. */
  const verPorCategorias = filtro === 'todos';

  const irAPagina = (nuevaPagina: number) => {
    const destino = Math.min(Math.max(nuevaPagina, 1), totalPaginas);
    if (destino === paginaActual) return;
    setPagina(destino);
    if (categoriaInicial) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const limpiar = () => {
    if (rutaActualSinBase(window.location.pathname) !== '/catalogo') {
      window.location.href = rutaInterna('/catalogo');
      return;
    }

    setFiltro('todos');
    setProductoActivo(null);
    actualizarUrlProducto(null, true);
    window.dispatchEvent(new CustomEvent('catalog-search', { detail: '' }));
  };

  const verDetalle = (producto: Producto) => {
    window.dispatchEvent(new CustomEvent('catalog-product-detail', { detail: producto.SKU ?? '' }));
    window.scrollTo(0, 0);
  };

  const volverAResultados = () => {
    setProductoActivo(null);
    actualizarUrlProducto(null, true);
    window.dispatchEvent(new Event('catalog-product-close'));
  };

  const claveActiva = productoActivo?.SKU;

  /* Los textos traen el SKU repetido al final, y el SKU ya se muestra arriba. */
  const sinSkuFinal = (texto?: string | null) =>
    String(texto ?? '')
      .replace(/\s*\|?\s*SKU:.*$/i, '')
      .trim();

  const descripcionCorta = sinSkuFinal(productoActivo?.DescripcionCorta);
  const descripcion = sinSkuFinal(productoActivo?.Descripcion);

  const mostrarDescripcionCorta =
    descripcionCorta.length > 0 &&
    normalizar(descripcionCorta) !== normalizar(productoActivo?.Nombre ?? '');

  return (
    <div className={productoActivo ? 'mt-4' : 'mt-4'}>
      {productoActivo ? (
        <section
          aria-labelledby="detalle-producto-titulo"
          className="grid grid-cols-1 md:grid-cols-2 overflow-hidden"
        >
          <div className="media-steel flex min-h-56 items-center justify-center p-3 sm:min-h-[50vh] sm:p-10">
            {productoActivo.Imagen && !imgError ? (
              <img
                src={productoActivo.Imagen}
                alt={productoActivo.Nombre ?? 'Producto'}
                width="800"
                height="600"
                onError={() => setImgError(true)}
                className="max-h-[28rem] w-full object-contain mix-blend-multiply"
              />
            ) : (
              <span className="type-overline text-text-muted">Aceros Frontera</span>
            )}
          </div>

          <div className="mx-auto flex w-full max-w-2xl flex-col p-3 sm:p-8 lg:justify-center lg:p-12">
            <Button
              variant="link"
              size="none"
              icon="arrow-right"
              iconClass="rotate-180"
              label="Volver al catálogo"
              onClick={volverAResultados}
              className="w-fit"
            />

            <h2
              id="detalle-producto-titulo"
              className="mt-4 type-h2 text-text-primary"
            >
              {productoActivo.Nombre}
            </h2>

            {mostrarDescripcionCorta ? (
              <p className="mt-3 type-subtitle text-text-secondary">
                {descripcionCorta}
              </p>
            ) : null}

            {descripcion ? (
              <p className="mt-3 max-w-prose type-body-s text-text-secondary">
                {descripcion}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className={badgeClasses('brand')}>
                {productoActivo.Categoria}
              </span>
              {claveActiva ? (
                <span className={badgeClasses('neutral')}>SKU {claveActiva}</span>
              ) : null}
            </div>


            <div className="mt-8 flex flex-col gap-3">
              <Button
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                  `Hola, quiero cotizar el producto: ${productoActivo.Nombre ?? ''} ${claveActiva ? `(SKU: ${claveActiva})` : ''
                  }.`,
                )}`}
                target="_blank"
                variant="secondary"
                size="lg"
                icon="whatsapp"
                iconPosition="right"
                label="Cotizar por WhatsApp"
                fullWidth
              />
            </div>
          </div>

          {productosRelacionados.length > 0 ? (
            <div className="border-t border-border-default px-4 py-8 sm:px-8 md:col-span-2 lg:px-12">
              <div className="mb-5">
                <p className="type-overline text-text-brand">
                  Categoría {productoActivo.Categoria}
                </p>
                <h3 className="mt-1 type-h3 text-text-primary">
                  Otros productos relacionados
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
                {productosRelacionados.map((producto) => (
                  <ProductCard
                    key={producto.ID ?? producto.SKU}
                    producto={producto}
                    onView={verDetalle}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          {verPorCategorias ? (
            /* Portada: cada categoría con su frase y una fila de productos de muestra,
               en dos columnas de grupos en pantallas grandes. */
            <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-2">
              {gruposPorCategoria.map(({ categoria, productos: muestra }) => (
                <section key={categoria} aria-labelledby={`categoria-${categoria}`}>
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border-default pb-3">
                    <div>
                      <h2
                        id={`categoria-${categoria}`}
                        className="type-h3 text-text-primary"
                      >
                        {categoria}
                      </h2>
                      <p className="mt-1 type-body-s text-text-muted">{fraseDeCategoria(categoria)}</p>
                    </div>

                    <Button
                      variant="link"
                      size="none"
                      icon="arrow-right"
                      iconPosition="right"
                      iconClass="size-4"
                      label="Ver todos"
                      href={rutaCategoria(
                        categoria,
                        gruposPorCategoria.map((grupo) => grupo.categoria),
                      )}
                      aria-label={`Ver todos los productos de ${categoria}`}
                    />
                  </div>

                  <div className="mt-4 flex gap-3 overflow-x-auto">
                    {muestra.map((producto) => (
                      <div
                        key={producto.ID ?? producto.SKU}
                        className="min-w-[calc((100%-0.75rem)/2)] sm:min-w-0 sm:flex-1"
                      >
                        <ProductCard
                          producto={producto}
                          onView={verDetalle}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <>
              {categoriaInicial ? (
                <div className="mt-6">
                  <a
                    href={rutaInterna('/catalogo')}
                    className="type-label text-text-brand hover:text-brand-hover"
                  >
                    Catálogo
                  </a>
                  <span aria-hidden="true" className="mx-2 text-text-disabled">/</span>
                  <span className="type-body-s text-text-secondary">{categoriaInicial}</span>
                  <h1 className="mt-2 type-h1 text-text-primary">
                    {categoriaInicial}
                  </h1>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 type-body-s text-text-muted">
                <p aria-live="polite">
                  Mostrando{' '}
                  <strong className="font-semibold text-text-primary">
                    {resultados.length === 0 ? 0 : inicioPagina + 1}
                    –
                    {Math.min(inicioPagina + PRODUCTOS_POR_PAGINA, resultados.length)}
                  </strong>{' '}
                  de <strong className="font-semibold text-text-primary">{resultados.length}</strong>{' '}
                  {resultados.length === 1 ? 'producto' : 'productos'}
                </p>
              </div>

              {resultados.length > 0 ? (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 2xl:grid-cols-5">
                    {productosPagina.map((producto) => (
                      <ProductCard
                        key={producto.ID ?? producto.SKU}
                        producto={producto}
                        onView={verDetalle}
                      />
                    ))}
                  </div>

                  {totalPaginas > 1 ? (
                    <nav
                      aria-label="Paginación del catálogo"
                      className="mt-8 flex flex-nowrap items-center justify-center gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        icon="arrow-right"
                        iconClass="rotate-180"
                        onClick={() => irAPagina(paginaActual - 1)}
                        disabled={paginaActual === 1}
                        aria-label="Página anterior"
                      />

                      {paginasVisibles.map((elemento, indice) =>
                        elemento === 'gap' ? (
                          <span
                            key={`gap-${indice}`}
                            aria-hidden="true"
                            className="px-1 type-label text-text-disabled"
                          >
                            …
                          </span>
                        ) : (
                          <Button
                            key={elemento}
                            variant={elemento === paginaActual ? 'primary' : 'outline'}
                            size="icon"
                            label={elemento}
                            onClick={() => irAPagina(elemento)}
                            aria-label={`Ir a la página ${elemento}`}
                            aria-current={elemento === paginaActual ? 'page' : undefined}
                          />
                        ),
                      )}

                      <Button
                        variant="outline"
                        size="icon"
                        icon="arrow-right"
                        onClick={() => irAPagina(paginaActual + 1)}
                        disabled={paginaActual === totalPaginas}
                        aria-label="Página siguiente"
                      />
                    </nav>
                  ) : null}
                </>
              ) : (
                <div className="mt-5 flex flex-col items-center bg-surface-primary px-6 py-16 text-center">
                  <span className="grid size-14 place-items-center bg-surface-field text-text-muted">
                    <Icon name="search" className="size-6" />
                  </span>
                  <h3 className="mt-4 type-h3 text-text-primary">Sin resultados</h3>
                  <p className="mt-2 max-w-md type-body-s text-text-muted">
                    No encontramos productos con esa búsqueda. Prueba con otra palabra o revisa todo el catálogo.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    label="Ver todos los productos"
                    onClick={limpiar}
                    className="mt-5"
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
