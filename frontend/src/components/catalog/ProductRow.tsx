import { useState } from 'react';
import Button from '../ui/Button';
import type { Producto } from '../../lib/types';

interface ProductRowProps {
  producto: Producto;
  onView: (producto: Producto) => void;
}

/**
 * Figma: Product Row.
 * Fila blanca (padding 16/24/16/16, gap 24): Thumbnail 72 px · Info
 * (Overline · Heading/H4 · Body/Body-S) · Button[Primary, S] "Ver producto".
 */
export default function ProductRow({ producto, onView }: ProductRowProps) {
  const [imgError, setImgError] = useState(false);
  const sku = producto.SKU != null ? String(producto.SKU) : '';
  const meta = [producto.Categoria, sku ? `SKU ${sku}` : ''].filter(Boolean).join(' · ');
  const specs = producto.DescripcionCorta?.trim() ?? '';

  return (
    <article className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 bg-surface-primary py-4 pl-4 pr-6 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:gap-x-6">
      <div className="media-steel flex size-14 shrink-0 items-center justify-center overflow-hidden sm:size-18">
        {producto.Imagen && !imgError ? (
          <img
            src={producto.Imagen}
            alt=""
            width="72"
            height="72"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="size-full object-contain mix-blend-multiply"
          />
        ) : null}
      </div>

      <div className="min-w-0 space-y-1">
        {meta ? <p className="truncate type-overline text-text-muted">{meta}</p> : null}
        <h3 className="truncate type-h4 text-text-primary lowercase first-letter:uppercase">{producto.Nombre}</h3>
        {specs ? <p className="truncate type-body-s text-text-secondary">{specs}</p> : null}
      </div>

      <Button
        onClick={() => onView(producto)}
        variant="primary"
        size="sm"
        icon="arrow-right"
        iconPosition="right"
        label="Ver producto"
        className="col-span-2 w-fit sm:col-span-1"
      />
    </article>
  );
}
