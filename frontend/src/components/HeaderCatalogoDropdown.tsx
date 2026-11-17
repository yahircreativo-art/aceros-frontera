import { useEffect, useRef, useState } from 'react';
import { rutaCategoria } from '../lib/categorias';
import { rutaInterna } from '../lib/asset-url';

interface HeaderCatalogoDropdownProps {
  categorias: ReadonlyArray<string>;
}

export default function HeaderCatalogoDropdown({ categorias }: HeaderCatalogoDropdownProps) {
  const [abierto, setAbierto] = useState(false);
  const menúRef = useRef<HTMLElement | null>(null);
  const cierreProgramado = useRef<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const cancelarCierre = () => {
    if (cierreProgramado.current !== null) {
      window.clearTimeout(cierreProgramado.current);
      cierreProgramado.current = null;
    }
  };

  const abrir = () => {
    cancelarCierre();
    setAbierto(true);
  };

  const cerrar = () => {
    cancelarCierre();
    setAbierto(false);
  };

  // Pequeña demora para poder pasar del botón al menú sin que se cierre.
  const programarCierre = () => {
    cancelarCierre();
    cierreProgramado.current = window.setTimeout(() => setAbierto(false), 180);
  };

  useEffect(() => {
    const fueraDelMenú = (evento: MouseEvent) => {
      const menú = menúRef.current;
      if (!menú) return;

      const dentro =
        menú.contains(evento.target as Node) ||
        (evento.target as HTMLElement).closest('[data-catalogo-trigger]') != null;

      if (!dentro) cerrar();
    };

    const tecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') cerrar();
    };

    document.addEventListener('mousedown', fueraDelMenú, true);
    document.addEventListener('keydown', tecla);

    return () => {
      document.removeEventListener('mousedown', fueraDelMenú, true);
      document.removeEventListener('keydown', tecla);
    };
  }, []);

  useEffect(() => () => cancelarCierre(), []);

  // Centrar el menú debajo del botón en pantallas anchas; en móvil ocupa el ancho visible.
  // En tablets y desktop el menú queda centrado con un ancho máximo debajo del trigger.
  useEffect(() => {
    const menú = menúRef.current;
    const trigger = triggerRef.current;

    if (!menú || !trigger) return;

    const actualizarPosición = () => {
      if (!abierto) return;

      const rect = trigger.getBoundingClientRect();

      const esMovil = window.matchMedia('(max-width: 767px)').matches;

      if (esMovil) {
        // En móvil ocupa todo el ancho, sin margen lateral.
        menú.style.marginInline = '0';
        menú.style.left = '0';
        menú.style.right = '0';
        menú.style.width = '100vw';
        menú.style.maxWidth = 'none';
      } else {
        // En tablets y escritorio el menú toma el ancho de su contenido, con un tope máximo.
        menú.style.marginInline = '0';
        menú.style.right = 'auto';
        menú.style.width = 'max-content';
        menú.style.maxWidth = `${Math.min(360, window.innerWidth - 16)}px`;

        // Se mide ya con el ancho ajustado al contenido (no al viewport).
        const menúAncho = menú.offsetWidth;

        const desplazamientoX = Math.max(0, (rect.width - menúAncho) / 2);
        const izquierda = Math.min(
          Math.max(8, rect.left + desplazamientoX),
          Math.max(8, window.innerWidth - menúAncho - 8),
        );

        menú.style.left = `${izquierda}px`;
      }

      // Pequeño offset vertical para que el menú quede visible y no pegado al borde del botón.
      menú.style.top = `${rect.bottom + 10}px`;
    };

    // Primero permitir que el menú se renderice para poder medir su ancho.
    requestAnimationFrame(actualizarPosición);

    window.addEventListener('resize', actualizarPosición);
    window.addEventListener('scroll', actualizarPosición, true);

    return () => {
      window.removeEventListener('resize', actualizarPosición);
      window.removeEventListener('scroll', actualizarPosición, true);
    };
  }, [abierto]);

  const categoriasOrdenadas = [...categorias].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );

  return (
    <div className="relative inline-flex">
      {/* Al hacer clic despliega las categorías sin salir de la página. */}
      <button
        ref={triggerRef}
        type="button"
        data-catalogo-trigger
        aria-expanded={abierto}
        aria-controls={abierto ? 'catalogo-dropdown' : undefined}
        aria-haspopup="menu"
        onFocus={abrir}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter' || evento.key === ' ') {
            evento.preventDefault();
            setAbierto((abiertoActual) => (abiertoActual ? false : true));
          }
        }}
        onClick={() => setAbierto((abiertoActual) => (abiertoActual ? false : true))}
        className="relative cursor-pointer pr-4 type-label text-text-primary transition-colors hover:text-text-brand"
      >
        Catálogo
        <svg
          aria-hidden="true"
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`absolute right-0 top-1/2 -translate-y-1/2 ${abierto ? 'rotate-180' : ''}`}
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {abierto && (
        <div
          id="catalogo-dropdown"
          ref={menúRef}
          role="menu"
          aria-label="Categorías del catálogo"
          className="fixed left-0 top-0 z-[9999] w-full border border-border-default bg-surface-elevated shadow-menu sm:w-max sm:max-w-[360px]"
        >
          <ul className="py-2" role="list">
            <li>
              <a
                href={rutaInterna('/catalogo')}
                onClick={() => setAbierto(false)}
                className="block w-full border-b border-border-subtle px-4 py-2.5 text-left type-label text-text-brand transition-colors hover:bg-surface-secondary"
              >
                Todos los productos
              </a>
            </li>
            {categoriasOrdenadas.length > 0 ? (
              categoriasOrdenadas.map((categoria) => (
                <li key={categoria}>
                  <a
                    href={rutaInterna(rutaCategoria(categoria, categorias))}
                    onClick={() => setAbierto(false)}
                    className="block px-4 py-2 text-left type-body-s text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
                  >
                    {categoria}
                  </a>
                </li>
              ))
            ) : (
              <li className="mx-3 mb-1 text-xs text-ink-500">No hay categorías disponibles</li>
            )}
          </ul>

          <div className="border-t border-border-subtle px-4 py-2.5 type-caption text-text-muted">
            <a
              href={rutaInterna('/catalogo')}
              onClick={() => setAbierto(false)}
              className="block text-text-brand underline hover:text-brand-hover"
            >
              Ver todo el catálogo
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
