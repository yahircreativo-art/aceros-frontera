import Icon from '../ui/Icon';
import { calcularDescuento, formatCLP, precioNeto } from '../../lib/format';
import type { Producto } from '../../lib/types';

interface ProductCardProps {
  producto: Producto;
  whatsapp: string;
  onView: (producto: Producto) => void;
}

export default function ProductCard({ producto, whatsapp, onView }: ProductCardProps) {
  // Disponibilidad, descuento y enlaces de cotización para este producto.
  const descuento = producto.precio ? calcularDescuento(producto.precio, producto.precioAnterior) : null;
  const disponible = (producto.stock ?? 0) > 0;

  const referencia = producto.sku ? ` (SKU ${producto.sku})` : '';
  const mensajeCotizar = `Hola, quiero cotizar: ${producto.nombre}${referencia}${producto.precio ? ` por ${formatCLP(producto.precio)}` : ''}.`;
  const mensajeMayor = `Hola, necesito precio mayorista de: ${producto.nombre}${referencia}.`;

  const urlCotizar = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeCotizar)}`;
  const urlMayor = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeMayor)}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      {/* La tarjeta abre la ficha; los enlaces de acción quedan por encima de esta capa. */}
      <button
        type="button"
        onClick={() => onView(producto)}
        aria-label={`Ver detalles de ${producto.nombre}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      />
      {/* Imagen del producto e indicadores de stock, oferta y despacho. */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        <img
          src={producto.imagen}
          alt={producto.nombre}
          width="800"
          height="600"
          loading="lazy"
          decoding="async"
          className="size-full object-contain transition duration-300 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-x-3 top-3 flex flex-col items-start gap-1.5 md:flex-row md:items-start md:justify-between">
          <span
            className={`inline-flex max-w-full items-center gap-1 rounded px-2 py-1 text-2xs font-bold uppercase leading-tight tracking-wide text-white ${
              disponible ? 'bg-brand-600' : 'bg-ink-500'
            }`}
          >
            {disponible ? 'En stock' : producto.stock === 0 ? 'Sobre pedido' : 'Consultar disponibilidad'}
          </span>

          <div className="flex flex-col items-start gap-1.5 md:items-end">
            {descuento ? (
              <span className="rounded bg-accent-400 px-2 py-1 text-2xs font-extrabold text-brand-950">
                -{descuento}% OFF
              </span>
            ) : null}
            {producto.envioGratis ? (
              <span className="rounded bg-white/95 px-2 py-1 text-2xs font-semibold text-ink-700 shadow-sm">
                Envío gratis
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Identificación, precio y accesos directos a cotización. */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-400">
          <span className="truncate">{producto.marca ?? producto.categoria}</span>
          {producto.sku ? <span className="shrink-0">SKU: {producto.sku}</span> : null}
        </div>

        <h3 className="mt-2 font-display text-[15px] font-bold leading-snug text-ink-900">
          <span className="line-clamp-2">{producto.nombre}</span>
        </h3>

        <div className="mt-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-display text-[22px] font-extrabold leading-none text-ink-900">
              {producto.precio ? formatCLP(producto.precio) : 'Consultar precio'}
            </span>
            {producto.precio && producto.precioAnterior ? (
              <span className="text-xs text-ink-400 line-through">
                {formatCLP(producto.precioAnterior)}
              </span>
            ) : null}
          </div>
          {producto.precio ? (
            <p className="mt-1.5 text-2xs text-ink-500">
              Contado: {formatCLP(precioNeto(producto.precio))} + IVA
            </p>
          ) : null}
        </div>

        <div className="relative z-20 mt-auto flex flex-col gap-2 pt-4 lg:flex-row">
          <a
            href={urlCotizar}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Cotizar ${producto.nombre} por WhatsApp`}
            className="pointer-events-auto inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-field bg-accent-400 px-2 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-accent-500 md:flex-1"
          >
            <Icon name="cart-plus" className="size-3.5" />
            Cotizar
          </a>
          <a
            href={urlMayor}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Pedir precio mayorista de ${producto.nombre}`}
            className="pointer-events-auto inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-field border border-line bg-white px-2 py-2.5 text-xs font-semibold text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50 md:flex-1"
          >
            <Icon name="building" className="size-3.5" />
            Por mayor
          </a>
        </div>
      </div>
    </article>
  );
}
