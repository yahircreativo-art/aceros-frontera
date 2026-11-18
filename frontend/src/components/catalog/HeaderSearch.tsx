import { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { normalizar } from '../../lib/format';
import { rutaInterna } from '../../lib/asset-url';

/** Entrada del índice ligero generado por src/pages/buscar.json.ts. */
interface ProductoIndice {
  n: string;
  s: string;
  c: string;
  r: string;
}

/* Una sola descarga por visita, compartida si hay más de un buscador en la página. */
let indicePendiente: Promise<ProductoIndice[]> | null = null;
function cargarIndice(): Promise<ProductoIndice[]> {
  indicePendiente ??= fetch(rutaInterna('/buscar.json'))
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => {
      indicePendiente = null;
      return [];
    });
  return indicePendiente;
}

/**
 * Figma: Search Bar [Type=Header] + Search Dropdown / Search Suggestion.
 * Campo blanco con borde inferior (border/field → border/focus de 2 px al
 * enfocar), botón de búsqueda amarillo de 48 px y esquinas de 4 px.
 */
interface HeaderSearchProps {
  /** Prefijo de ids cuando hay más de un buscador en la página (escritorio y menú móvil). */
  idBase?: string;
}

export default function HeaderSearch({ idBase = 'buscar' }: HeaderSearchProps) {
  const [productosActuales, setProductosActuales] = useState<ProductoIndice[]>([]);
  const [cargado, setCargado] = useState(false);
  const [listo, setListo] = useState(false);
  const pedirIndice = () => {
    if (cargado) return;
    setCargado(true);
    cargarIndice().then((indice) => {
      setProductosActuales(indice);
      setListo(true);
    });
  };
  const [consulta, setConsulta] = useState('');
  const [enfocado, setEnfocado] = useState(false);
  const [indiceSugerencia, setIndiceSugerencia] = useState(-1);

  useEffect(() => {
    const sincronizarBusqueda = (evento: Event) => {
      setConsulta((evento as CustomEvent<string>).detail);
      setIndiceSugerencia(-1);
    };

    const reiniciarBusqueda = () => {
      setConsulta('');
      setEnfocado(false);
      setIndiceSugerencia(-1);
    };

    const detectarRegreso = (evento: MouseEvent) => {
      if ((evento.target as Element).closest('a[href="#inicio"]')) {
        window.dispatchEvent(new Event('catalog-reset'));
      }
    };

    const reiniciarAlRegresar = () => window.dispatchEvent(new Event('catalog-reset'));

    window.addEventListener('catalog-search', sincronizarBusqueda);
    window.addEventListener('catalog-reset', reiniciarBusqueda);
    document.addEventListener('click', detectarRegreso);
    window.addEventListener('popstate', reiniciarAlRegresar);
    return () => {
      window.removeEventListener('catalog-search', sincronizarBusqueda);
      window.removeEventListener('catalog-reset', reiniciarBusqueda);
      document.removeEventListener('click', detectarRegreso);
      window.removeEventListener('popstate', reiniciarAlRegresar);
    };
  }, []);

  const sugerencias = useMemo(() => {
    const terminos = normalizar(consulta).split(/\s+/).filter(Boolean);
    if (terminos.length === 0) return [];

    return productosActuales
      .filter((producto) => {
        const texto = normalizar(
          [producto.n, producto.s, producto.c].filter(Boolean).join(' '),
        );
        return terminos.every((termino) => texto.includes(termino));
      })
      .slice(0, 6);
  }, [consulta, productosActuales]);

  const seleccionarProducto = (producto: ProductoIndice) => {
    setConsulta(producto.n);
    setEnfocado(false);
    setIndiceSugerencia(-1);
    window.location.href = rutaInterna(producto.r);
  };

  const sugerenciasAbiertas = enfocado && consulta.trim().length > 0;
  const sugerenciaActiva =
    indiceSugerencia >= 0 && indiceSugerencia < sugerencias.length
      ? indiceSugerencia
      : -1;

  return (
    <div className="relative w-full">
      <form
        role="search"
        onSubmit={(evento) => {
          /* Enter o la lupa abren la sugerencia activa o, si no hay, la primera. */
          evento.preventDefault();
          const elegida = sugerencias[sugerenciaActiva >= 0 ? sugerenciaActiva : 0];
          if (elegida) seleccionarProducto(elegida);
          else setEnfocado(true);
        }}
        className="group/search flex h-10 overflow-hidden"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 bg-surface-primary px-3 group-focus-within/search:border-b-2 group-focus-within/search:border-border-focus has-[input:focus-visible]:shadow-[inset_0_0_0_2px_var(--color-border-focus)]">
          <label className="sr-only" htmlFor={`${idBase}-navbar`}>Buscar productos</label>
          <input
            id={`${idBase}-navbar`}
            type="text"
            role="combobox"
            value={consulta}
            onChange={(evento) => {
              setConsulta(evento.target.value);
              setIndiceSugerencia(-1);
            }}
            onFocus={() => {
              pedirIndice();
              setEnfocado(true);
            }}
            onPointerEnter={pedirIndice}
            onBlur={() =>
              window.setTimeout(() => {
                setEnfocado(false);
                setIndiceSugerencia(-1);
              }, 120)
            }
            onKeyDown={(evento) => {
              if (evento.key === 'ArrowDown' && sugerencias.length) {
                evento.preventDefault();
                setEnfocado(true);
                setIndiceSugerencia((indice) => (indice + 1) % sugerencias.length);
              } else if (evento.key === 'ArrowUp' && sugerencias.length) {
                evento.preventDefault();
                setEnfocado(true);
                setIndiceSugerencia((indice) =>
                  indice <= 0 ? sugerencias.length - 1 : indice - 1,
                );
              } else if (evento.key === 'Escape') {
                setEnfocado(false);
                setIndiceSugerencia(-1);
              }
            }}
            placeholder="Buscar productos o SKU"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={sugerenciasAbiertas}
            aria-controls={sugerenciasAbiertas ? `${idBase}-sugerencias` : undefined}
            aria-activedescendant={
              sugerenciaActiva >= 0 ? `${idBase}-sugerencia-${sugerenciaActiva}` : undefined
            }
            className="h-full min-w-0 flex-1 bg-transparent type-body-s text-text-primary outline-none placeholder:text-text-muted focus-visible:outline-none"
          />
          {consulta ? (
            <Button
              variant="unstyled"
              size="none"
              icon="x"
              iconClass="size-4"
              aria-label="Borrar búsqueda"
              onClick={() => {
                setConsulta('');
                setIndiceSugerencia(-1);
              }}
              className="shrink-0 text-text-muted hover:text-text-primary"
            />
          ) : null}
        </div>
        <Button
          type="submit"
          variant="unstyled"
          size="none"
          icon="search"
          iconClass="size-4"
          aria-label="Buscar en el catálogo"
          className="h-full w-10 shrink-0 bg-accent-primary text-text-on-accent hover:bg-accent-hover active:bg-accent-active"
        />
      </form>

      {sugerenciasAbiertas ? (
        <ul
          id={`${idBase}-sugerencias`}
          role="listbox"
          aria-label="Productos sugeridos"
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-80 lg:left-auto lg:w-[26rem] overflow-y-auto border border-border-default bg-surface-elevated py-2 text-text-primary shadow-menu"
        >
          {sugerencias.length ? (
            sugerencias.map((producto, indice) => (
              <li key={producto.r} role="presentation">
                <button
                  type="button"
                  id={`${idBase}-sugerencia-${indice}`}
                  role="option"
                  aria-selected={indice === sugerenciaActiva}
                  tabIndex={-1}
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => seleccionarProducto(producto)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-secondary focus:outline-none aria-selected:bg-surface-secondary"
                >
                  <Icon name="search" className="size-4 shrink-0 text-text-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate type-label text-text-primary">{producto.n}</span>
                    {producto.s || producto.c ? (
                      <span className="block truncate type-caption text-text-muted">
                        {[producto.c, producto.s ? `SKU ${producto.s}` : null]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 type-body-s text-text-muted">
              {!listo ? 'Cargando productos…' : 'Sin resultados. Prueba con otra palabra o con la clave del producto.'}
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
