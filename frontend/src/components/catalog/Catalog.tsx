import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { normalizar } from '../../lib/format';
import { rutaCategoria } from '../../lib/categorias';
import { rutaActualSinBase, rutaInterna } from '../../lib/asset-url';
import { rutaProducto } from '../../lib/rutas-producto';
import type { Producto } from '../../lib/types';

interface CatalogProps {
  productos: Producto[];
  categoriaInicial?: string;
}

/* 24 llena filas completas en todas las rejillas (2, 3, 4 y 6 columnas). */
const PRODUCTOS_POR_PAGINA = 24;

/* Una fila de productos de muestra por bloque de categoría. */
const PRODUCTOS_POR_CATEGORIA = 3;

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

export default function Catalog({ productos, categoriaInicial }: CatalogProps) {
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

  useEffect(() => {
    document.getElementById('catalogo')?.setAttribute('data-hidratado', '');
  }, []);

  const [filtro, setFiltro] = useState(categoriaInicial ?? 'todos');
  const [pagina, setPagina] = useState(1);

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

  /* Enlaces antiguos /catalogo?producto=SKU: se redirige a la subpágina del producto. */
  useEffect(() => {
    const sku = new URL(window.location.href).searchParams.get('producto');
    if (!sku) return;
    const producto = productos.find((item) => String(item.SKU) === sku);
    if (producto) window.location.replace(rutaInterna(rutaProducto(producto)));
  }, []);

  useEffect(() => {
    const recibirCategoria = (evento: Event) => {
      const categoria = (evento as CustomEvent<string>).detail ?? '';
      const esTodos = categoria.toLowerCase().trim() === 'todos';
      setFiltro(esTodos ? 'todos' : resolverCategoria(categoria) ?? 'todos');
    };

    const reiniciarCatalogo = () => {
      setFiltro('todos');
      const url = new URL(window.location.href);
      url.searchParams.delete('categoria');
      window.history.replaceState({}, '', url);
    };

    window.addEventListener('catalog-category', recibirCategoria);
    window.addEventListener('catalog-reset', reiniciarCatalogo);
    return () => {
      window.removeEventListener('catalog-category', recibirCategoria);
      window.removeEventListener('catalog-reset', reiniciarCatalogo);
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
    window.dispatchEvent(new CustomEvent('catalog-search', { detail: '' }));
  };

  return (
    <div className="mt-3">
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

                  {/* 2 productos en celular, 3 desde md. */}
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {muestra.map((producto, indice) => (
                      <div
                        key={producto.ID ?? producto.SKU}
                        className={indice >= 2 ? 'hidden md:block' : undefined}
                      >
                        <ProductCard
                          producto={producto}
                          href={rutaProducto(producto)}
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
                        href={rutaProducto(producto)}
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
    </div>
  );
}
