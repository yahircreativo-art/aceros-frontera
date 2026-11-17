import { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { normalizar } from '../../lib/format';
import type { Producto } from '../../lib/types';

interface HeaderSearchProps {
  productos: Producto[];
}

/**
 * Figma: Search Bar [Type=Header] + Search Dropdown / Search Suggestion.
 * Campo blanco con borde inferior (border/field → border/focus de 2 px al
 * enfocar), botón de búsqueda amarillo de 48 px y esquinas de 4 px.
 */
export default function HeaderSearch({ productos }: HeaderSearchProps) {
  const [productosActuales, setProductosActuales] = useState(productos);
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

    const actualizarProductos = (evento: Event) => {
      setProductosActuales((evento as CustomEvent<Producto[]>).detail);
    };

    const detectarRegreso = (evento: MouseEvent) => {
      if ((evento.target as Element).closest('a[href="#inicio"]')) {
        window.dispatchEvent(new Event('catalog-reset'));
      }
    };

    const reiniciarAlRegresar = () => window.dispatchEvent(new Event('catalog-reset'));

    window.addEventListener('catalog-search', sincronizarBusqueda);
    window.addEventListener('catalog-products-updated', actualizarProductos);
    window.addEventListener('catalog-reset', reiniciarBusqueda);
    document.addEventListener('click', detectarRegreso);
    window.addEventListener('popstate', reiniciarAlRegresar);
    return () => {
      window.removeEventListener('catalog-search', sincronizarBusqueda);
      window.removeEventListener('catalog-products-updated', actualizarProductos);
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
          [producto.Nombre, producto.SKU, producto.Categoria].filter(Boolean).join(' '),
        );
        return terminos.every((termino) => texto.includes(termino));
      })
      .slice(0, 6);
  }, [consulta, productosActuales]);

  const seleccionarProducto = (producto: Producto) => {
    setConsulta(producto.Nombre ?? '');
    setEnfocado(false);
    setIndiceSugerencia(-1);
    window.dispatchEvent(new CustomEvent('catalog-product-detail', { detail: producto.SKU ?? '' }));
  };

  const sugerenciasAbiertas = enfocado && consulta.trim().length > 0;
  const sugerenciaActiva =
    indiceSugerencia >= 0 && indiceSugerencia < sugerencias.length
      ? indiceSugerencia
      : -1;

  return (
    <div className="relative order-3 w-full md:order-none md:min-w-0 md:flex-1">
      <form
        role="search"
        onSubmit={(evento) => {
          /* El buscador no toca el catálogo: solo muestra sus sugerencias. */
          evento.preventDefault();
          setEnfocado(false);
        }}
        className="group/search flex h-12 overflow-hidden rounded-sm"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 border-b border-border-field bg-surface-primary px-4 group-focus-within/search:border-b-2 group-focus-within/search:border-border-focus">
          <label className="sr-only" htmlFor="buscar-navbar">Buscar productos</label>
          <input
            id="buscar-navbar"
            type="text"
            role="combobox"
            value={consulta}
            onChange={(evento) => {
              setConsulta(evento.target.value);
              setIndiceSugerencia(-1);
            }}
            onFocus={() => setEnfocado(true)}
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
              } else if (evento.key === 'Enter' && sugerenciaActiva >= 0) {
                evento.preventDefault();
                seleccionarProducto(sugerencias[sugerenciaActiva]);
              } else if (evento.key === 'Escape') {
                setEnfocado(false);
                setIndiceSugerencia(-1);
              }
            }}
            placeholder="Buscar productos o SKU"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={sugerenciasAbiertas}
            aria-controls={sugerenciasAbiertas ? 'sugerencias-productos' : undefined}
            aria-activedescendant={
              sugerenciaActiva >= 0 ? `sugerencia-producto-${sugerenciaActiva}` : undefined
            }
            className="h-full min-w-0 flex-1 bg-transparent type-body-m text-text-primary outline-none placeholder:text-text-muted focus-visible:outline-none"
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
          iconClass="size-5"
          aria-label="Buscar en el catálogo"
          className="h-full w-12 shrink-0 bg-accent-primary text-text-on-accent hover:bg-accent-hover active:bg-accent-active"
        />
      </form>

      {sugerenciasAbiertas ? (
        <ul
          id="sugerencias-productos"
          role="listbox"
          aria-label="Productos sugeridos"
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-80 overflow-y-auto border border-border-default bg-surface-elevated py-2 text-text-primary shadow-menu"
        >
          {sugerencias.length ? (
            sugerencias.map((producto, indice) => (
              <li key={producto.ID ?? producto.SKU} role="presentation">
                <button
                  type="button"
                  id={`sugerencia-producto-${indice}`}
                  role="option"
                  aria-selected={indice === sugerenciaActiva}
                  tabIndex={-1}
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => seleccionarProducto(producto)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-secondary focus:outline-none aria-selected:bg-surface-secondary"
                >
                  <Icon name="search" className="size-4 shrink-0 text-text-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate type-label text-text-primary">{producto.Nombre}</span>
                    {producto.SKU || producto.Categoria ? (
                      <span className="block truncate type-caption text-text-muted">
                        {[producto.Categoria, producto.SKU ? `SKU ${producto.SKU}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 type-body-s text-text-muted">Sin sugerencias para tu búsqueda.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
