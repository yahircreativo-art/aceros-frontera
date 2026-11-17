import { useEffect, useState } from 'react';
import {
  esBanner,
  filtrarPromociones,
  proximaFechaCambio,
  type Promocion,
} from '../../lib/destacados';
import { rutaInterna } from '../../lib/asset-url';
import { rutaCategoria } from '../../lib/categorias';
import { obtenerDestacadosSupabase } from '../../lib/supabase-destacados';

interface PromocionesDestacadasProps {
  promociones: Promocion[];
  supabaseUrl?: string;
  supabaseKey?: string;
  supabaseTabla?: string;
  supabaseBucket?: string;
  categorias: string[];
}

/** Cada cuánto pasa a la siguiente publicidad. */
const MS_POR_PUBLICIDAD = 3000;

/** Duración de la transición entre publicidades (debe coincidir con el CSS). */
const MS_TRANSICION = 500;

export default function PromocionesDestacadas({
  promociones,
  supabaseUrl,
  supabaseKey,
  supabaseTabla,
  supabaseBucket,
  categorias,
}: PromocionesDestacadasProps) {
  // Solo lo marcado con `Banner = TRUE` va al carrusel principal.
  const soloBanner = (lista: Promocion[]) => filtrarPromociones(lista).filter(esBanner);

  const [actuales, setActuales] = useState<Promocion[]>(() => soloBanner(promociones));
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  // Apagada mientras se salta de la última publicidad a la primera sin animar.
  const [animar, setAnimar] = useState(true);
  useEffect(() => {
    let cancelado = false;

    const aplicar = (lista: Promocion[]) => {
      if (!cancelado) setActuales(soloBanner(lista));
    };

    aplicar(promociones);

    if (supabaseUrl && supabaseKey && supabaseTabla) {
      obtenerDestacadosSupabase({
        url: supabaseUrl,
        clavePublica: supabaseKey,
        tabla: supabaseTabla,
        bucket: supabaseBucket,
      })
        .then(aplicar)
        .catch((error: unknown) => {
          if (!cancelado) {
            console.error('[catálogo] No se pudieron actualizar las publicidades destacadas.', error);
          }
        });
    }

    return () => {
      cancelado = true;
    };
    // `promociones` solo se lee al montar: no debe reejecutar el efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseUrl, supabaseKey, supabaseTabla, supabaseBucket]);

  // El índice debe seguir siendo válido si cambia la lista de publicidades.
  useEffect(() => {
    setIndice((valor) => (valor < actuales.length ? valor : 0));
  }, [actuales.length]);

  // Retira una promoción cuando alcanza su fecha de cierre, incluso si la
  // página permanece abierta sin volver a consultar Supabase.
  useEffect(() => {
    const cambio = proximaFechaCambio(actuales);
    if (cambio === null) return;

    const maximoTemporizador = 2_147_483_647;
    const temporizador = window.setTimeout(
      () => setActuales((lista) => soloBanner(lista)),
      Math.min(Math.max(cambio - Date.now(), 0), maximoTemporizador),
    );

    return () => window.clearTimeout(temporizador);
  }, [actuales]);

  // Avanza sola cada 3 segundos; se detiene al pasar el mouse o al enfocar.
  useEffect(() => {
    if (actuales.length < 2 || pausado) return;

    const temporizador = window.setInterval(() => {
      setIndice((valor) => valor + 1);
    }, MS_POR_PUBLICIDAD);

    return () => window.clearInterval(temporizador);
  }, [actuales.length, pausado]);

  // Al llegar a la copia de la primera publicidad, se salta a la original sin
  // animación: así el carrusel vuelve al inicio sin rebobinar la fila entera.
  useEffect(() => {
    if (actuales.length < 2 || indice !== actuales.length) return;

    const temporizador = window.setTimeout(() => {
      setAnimar(false);
      setIndice(0);
    }, MS_TRANSICION);

    return () => window.clearTimeout(temporizador);
  }, [indice, actuales.length]);

  // Reactiva la animación una vez pintado el salto. Se usa un temporizador y
  // no `requestAnimationFrame` porque este último no corre con la pestaña en
  // segundo plano y la animación quedaría apagada.
  useEffect(() => {
    if (animar) return;

    const temporizador = window.setTimeout(() => setAnimar(true), 100);

    return () => window.clearTimeout(temporizador);
  }, [animar]);

  if (!actuales.length) return null;

  // Se duplica la primera publicidad al final para que el bucle no se note.
  const diapositivas: Promocion[] =
    actuales.length > 1 ? [...actuales, actuales[0]] : actuales;

  return (
    <div
      role="region"
      aria-label="Publicidades destacadas"
      aria-roledescription="carrusel"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className="relative"
    >
      {/* `isolate` deja el fundido dentro de este bloque: así la tarjeta de
          categorías que se monta encima no necesita ningún z-index. */}
      <div
        className="relative isolate h-[min(50vw,32.5rem)] w-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_35%,var(--color-brand-600)_0%,var(--color-brand-900)_55%,var(--color-brand-950)_100%)]"
      >
        <div
          className="flex h-full ease-out"
          style={{
            transform: `translateX(-${indice * 100}%)`,
            transition: animar ? `transform ${MS_TRANSICION}ms` : 'none',
          }}
        >
          {diapositivas.map((promocion, posicion) => {
            const activa = posicion === indice;

            return (
              <div
                key={`${promocion.id}-${posicion}`}
                className="relative flex h-full w-full shrink-0 items-center justify-center"
                aria-hidden={activa ? undefined : true}
              >
                {/* Publicidad completa, sin recortes. */}
                <img
                  src={promocion.imagen}
                  alt={promocion.nombre || 'Publicidad destacada'}
                  loading={activa ? 'eager' : 'lazy'}
                  fetchPriority={activa ? 'high' : 'auto'}
                  decoding="async"
                  onError={() =>
                    setActuales((lista) => lista.filter((item) => item.id !== promocion.id))
                  }
                  className="h-full w-full object-contain"
                />

                <a
                  href={rutaInterna(
                    promocion.categoria
                      ? `${rutaCategoria(promocion.categoria, categorias)}#catalogo`
                      : '/catalogo#catalogo',
                  )}
                  aria-label={
                    promocion.categoria
                      ? `Ver productos de la categoría ${promocion.categoria}`
                      : 'Ver todo el catálogo'
                  }
                  tabIndex={activa ? undefined : -1}
                  className="absolute inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent-400"
                />
              </div>
            );
          })}
        </div>

        {/* Único fundido del banner: blanco sólido en la base (donde arranca la
            tarjeta de categorías) y cada vez más suave hacia arriba. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
        />

      </div>
    </div>
  );
}
