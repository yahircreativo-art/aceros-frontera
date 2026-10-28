import { useEffect, useMemo, useState } from 'react';
import Icon from '../ui/Icon';
import { normalizar } from '../../lib/format';
import type { Producto } from '../../lib/types';

interface HeaderSearchProps {
  productos: Producto[];
}

export default function HeaderSearch({ productos }: HeaderSearchProps) {
  const [consulta, setConsulta] = useState('');
  const [enfocado, setEnfocado] = useState(false);

  useEffect(() => {
    const sincronizarBusqueda = (evento: Event) => {
      setConsulta((evento as CustomEvent<string>).detail);
    };

    const reiniciarBusqueda = () => {
      setConsulta('');
      setEnfocado(false);
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

    return productos
      .filter((producto) => {
        const texto = normalizar(
          [producto.nombre, producto.marca, producto.sku, producto.categoria, producto.etiquetas.join(' ')].filter(Boolean).join(' '),
        );
        return terminos.every((termino) => texto.includes(termino));
      })
      .slice(0, 6);
  }, [consulta, productos]);

  const publicarBusqueda = (valor: string, desplazar = false) => {
    window.dispatchEvent(new CustomEvent('catalog-search', { detail: valor }));
    if (desplazar) {
      document.getElementById('catalogo')?.scrollIntoView();
    }
  };

  const seleccionarProducto = (producto: Producto) => {
    setConsulta(producto.nombre);
    setEnfocado(false);
    publicarBusqueda(producto.nombre);
    window.dispatchEvent(new CustomEvent('catalog-product-detail', { detail: producto.slug }));
  };

  return (
    <div className="relative order-3 w-full md:order-none md:ml-3 md:min-w-0 md:flex-1 md:max-w-[38rem]">
      <form
        role="search"
        onSubmit={(evento) => {
          evento.preventDefault();
          setEnfocado(false);
          publicarBusqueda(consulta, true);
        }}
        className="flex h-11 overflow-hidden rounded-field bg-white ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-accent-400"
      >
        <label className="sr-only" htmlFor="buscar-navbar">Buscar productos</label>
        <input
          id="buscar-navbar"
          type="search"
          value={consulta}
          onChange={(evento) => {
            const valor = evento.target.value;
            setConsulta(valor);
            publicarBusqueda(valor);
          }}
          onFocus={() => setEnfocado(true)}
          onBlur={() => window.setTimeout(() => setEnfocado(false), 120)}
          placeholder="Buscar productos, marcas o SKU"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={enfocado && consulta.trim().length > 0}
          aria-controls="sugerencias-productos"
          className="h-full min-w-0 flex-1 bg-white px-3 text-sm text-ink-900 outline-none placeholder:text-ink-400"
        />
        <button
          type="submit"
          aria-label="Buscar en el catálogo"
          className="grid w-12 shrink-0 place-items-center bg-accent-400 text-brand-950 transition-colors hover:bg-accent-300"
        >
          <Icon name="search" className="size-5" />
        </button>
      </form>

      {enfocado && consulta.trim() ? (
        <ul
          id="sugerencias-productos"
          role="listbox"
          aria-label="Productos sugeridos"
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-field border border-line bg-white py-1 text-ink-900 shadow-lift"
        >
          {sugerencias.length ? (
            sugerencias.map((producto) => (
              <li key={producto.slug} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => seleccionarProducto(producto)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink-50 focus:bg-ink-50 focus:outline-none"
                >
                  <Icon name="search" className="size-4 shrink-0 text-ink-400" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{producto.nombre}</span>
                  <span className="hidden shrink-0 text-xs text-ink-500 sm:inline">
                    {[producto.marca, producto.sku].filter(Boolean).join(' · ') || producto.categoria}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-ink-500">Sin sugerencias. Presiona Enter para buscar.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}