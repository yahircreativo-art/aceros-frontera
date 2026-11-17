import { useState } from 'react';
import Button from '../ui/Button';
import { whatsappUrl } from '../../lib/seo';
import type { Producto } from '../../lib/types';

interface ProductCardProps {
  producto: Producto;
  /** En el catálogo abre la ficha en la misma página. */
  onView?: (producto: Producto) => void;
  /** Fuera del catálogo (portada) la tarjeta enlaza a la ficha. */
  href?: string;
}

/**
 * Figma: Product Card.
 * Media de 200 px sobre fondo metálico · Content (padding 24, gap 12):
 * Meta (Body/Overline, text/muted) · Title (Heading/H4) · Specs (Body/Body-S)
 * · Actions: Button[Secondary, M] "Cotizar" + Button[Tertiary, M] "Ver producto".
 */
export default function ProductCard({ producto, onView, href }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const sku = producto.SKU != null ? String(producto.SKU) : '';
  const nombre = producto.Nombre ?? '';
  const categoria = producto.Categoria ?? '';
  const meta = [categoria, sku ? `SKU ${sku}` : ''].filter(Boolean).join(' · ');
  const specs = producto.DescripcionCorta?.trim() ?? '';

  return (
    <article className="@container group relative flex h-full flex-col bg-surface-primary">
      {onView ? (
        <Button
          onClick={() => onView(producto)}
          aria-label={`Ver detalles de ${nombre || 'producto'}`}
          variant="unstyled"
          size="none"
          className="absolute inset-0 z-10 cursor-pointer"
        />
      ) : (
        <a
          href={href ?? '/catalogo'}
          aria-label={`Ver detalles de ${nombre || 'producto'}`}
          className="absolute inset-0 z-10"
        />
      )}

      <div className="media-steel relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden p-3 @[16rem]:aspect-auto @[16rem]:h-[12.5rem] @[16rem]:p-4">
        {producto.Imagen && !imgError ? (
          <img
            src={producto.Imagen}
            alt=""
            width="800"
            height="600"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="size-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="type-overline text-text-muted">Aceros Frontera</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 @[12rem]:p-4 @[16rem]:gap-3 @[16rem]:p-6">
        {meta ? <p className="truncate type-overline text-text-muted">{meta}</p> : null}

        <h3 className="font-display text-lg leading-tight font-semibold text-text-primary lowercase first-letter:uppercase @[16rem]:type-h4">
          <span className="line-clamp-2">{nombre}</span>
        </h3>

        {specs ? (
          <p className="line-clamp-2 type-body-s text-text-secondary @max-[12rem]:hidden">
            {specs}
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <Button
            href={whatsappUrl(`Hola, quiero cotizar: ${nombre}${sku ? ` (SKU ${sku})` : ''}.`)}
            target="_blank"
            variant="secondary"
            size="md"
            icon="whatsapp"
            iconPosition="right"
            label="Cotizar"
            fullWidth
            className="relative z-20 !px-3 @[12rem]:!px-6"
          />
          <Button
            {...(onView ? { onClick: () => onView(producto) } : { href: href ?? '/catalogo' })}
            variant="tertiary"
            size="md"
            icon="arrow-right"
            iconPosition="right"
            label="Ver producto"
            fullWidth
            tabIndex={-1}
            aria-hidden="true"
            className="relative z-20 @max-[14rem]:hidden"
          />
        </div>
      </div>
    </article>
  );
}
