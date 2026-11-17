import { useState } from 'react';
import Icon from '../ui/Icon';
import type { Producto } from '../../lib/types';

interface ProductRowProps {
  producto: Producto;
  onView: (producto: Producto) => void;
}

export default function ProductRow({ producto, onView }: ProductRowProps) {
  const [imgError, setImgError] = useState(false);
  const claveDisplay = producto.clave ?? producto.sku;

  return (
    <article className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-card border border-line bg-white p-3 shadow-card sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:gap-4 sm:p-4 hover:shadow-lift transition-shadow">
      <div className="size-14 sm:size-16 rounded-field bg-ink-50/60 flex items-center justify-center overflow-hidden shrink-0">
        {producto.imagen && !imgError ? (
          <img
            src={producto.imagen}
            alt=""
            width="72"
            height="72"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="size-full object-contain"
          />
        ) : (
          <Icon name="tag" className="size-6 text-ink-300" />
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-2xs font-semibold uppercase text-brand-700 tracking-wider">
          {producto.categoria}
          {claveDisplay ? (
            <span className="font-mono text-ink-400 font-normal ml-2">
              · Clave: <span className="font-bold text-ink-600">{claveDisplay}</span>
            </span>
          ) : null}
        </p>
        <h3 className="mt-0.5 truncate font-display text-sm font-bold text-ink-900 sm:text-base">
          {producto.nombre}
        </h3>
      </div>

      <button
        type="button"
        onClick={() => onView(producto)}
        className="inline-flex w-fit items-center gap-1.5 rounded-field bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700 sm:px-4 sm:py-2.5 sm:text-sm"
      >
        <Icon name="arrow-right" className="size-4" />
        Ver detalles
      </button>
    </article>
  );
}
