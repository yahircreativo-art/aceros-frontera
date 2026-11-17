import { useState } from 'react';
import Icon from '../ui/Icon';
import type { Producto } from '../../lib/types';

interface ProductCardProps {
  producto: Producto;
  whatsapp: string;
  onView: (producto: Producto) => void;
}

export default function ProductCard({ producto, whatsapp, onView }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const claveDisplay = producto.clave ?? producto.sku;
  const referencia = claveDisplay ? ` (Clave: ${claveDisplay})` : '';
  const mensajeCotizar = `Hola, quiero cotizar el producto: ${producto.nombre}${referencia}.`;
  const urlCotizar = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeCotizar)}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      {/* Botón que cubre la tarjeta para abrir el detalle */}
      <button
        type="button"
        onClick={() => onView(producto)}
        aria-label={`Ver detalles de ${producto.nombre}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      />

      {/* Imagen del producto */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-50/60 p-3 flex items-center justify-center">
        {producto.imagen && !imgError ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            width="800"
            height="600"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="size-full object-contain transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-center text-ink-300 p-4">
            <Icon name="tag" className="size-8 text-brand-600/30" />
            <span className="text-3xs font-bold uppercase tracking-wider text-ink-400">Aceros Frontera</span>
          </div>
        )}

        {/* Badge de Categoría */}
        {producto.categoria ? (
          <div className="absolute left-3 top-3 z-20">
            <span className="inline-flex items-center rounded bg-brand-600/90 backdrop-blur-xs px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-white shadow-xs">
              {producto.categoria}
            </span>
          </div>
        ) : null}
      </div>

      {/* Información del producto: Clave, Nombre y Acción */}
      <div className="flex flex-1 flex-col p-4">
        {claveDisplay ? (
          <p className="text-2xs font-mono font-semibold uppercase tracking-wider text-ink-400">
            Clave: <span className="font-bold text-ink-600">{claveDisplay}</span>
          </p>
        ) : null}

        <h3 className="mt-1.5 font-display text-sm sm:text-[15px] font-bold leading-snug text-ink-900 transition-colors group-hover:text-brand-700">
          <span className="line-clamp-2">{producto.nombre}</span>
        </h3>

        {/* Acción directa: Cotizar */}
        <div className="relative z-20 mt-auto pt-4">
          <a
            href={urlCotizar}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Cotizar ${producto.nombre} por WhatsApp`}
            className="pointer-events-auto inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-field bg-accent-400 px-3 py-2 text-xs font-bold text-ink-950 transition-colors hover:bg-accent-500 shadow-xs"
          >
            <Icon name="whatsapp" className="size-4" />
            Cotizar por WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
