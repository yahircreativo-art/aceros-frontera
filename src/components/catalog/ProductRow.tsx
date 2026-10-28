import Icon from '../ui/Icon';
import { formatCLP } from '../../lib/format';
import type { Producto } from '../../lib/types';

interface ProductRowProps {
  producto: Producto;
  onView: (producto: Producto) => void;
}

export default function ProductRow({ producto, onView }: ProductRowProps) {
  return (
    <article className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-card border border-line bg-white p-3 shadow-card sm:grid-cols-[4.5rem_minmax(0,1fr)_auto_auto] sm:gap-4 sm:p-4">
      <img
        src={producto.imagen}
        alt=""
        width="72"
        height="72"
        loading="lazy"
        decoding="async"
        className="size-14 rounded-field bg-ink-50 object-cover sm:size-16"
      />
      <div className="min-w-0">
        <p className="truncate text-2xs font-semibold uppercase text-ink-500">
          {producto.marca ?? producto.categoria}{producto.sku ? <><span className="px-1 text-ink-300">·</span> SKU {producto.sku}</> : null}
        </p>
        <h3 className="mt-1 truncate font-display text-sm font-bold text-ink-900 sm:text-base">
          {producto.nombre}
        </h3>
        <p className="mt-0.5 truncate text-xs text-ink-500">{producto.categoria}</p>
      </div>
      <div className="col-start-2 row-start-2 sm:col-auto sm:row-auto sm:text-right">
        <p className="font-display text-base font-extrabold leading-tight text-ink-900">
          {producto.precio ? formatCLP(producto.precio) : 'Consultar precio'}
        </p>
        <p className={`mt-0.5 text-2xs font-semibold ${producto.stock && producto.stock > 0 ? 'text-brand-700' : 'text-ink-500'}`}>
          {producto.stock ? 'En stock' : producto.stock === 0 ? 'Sobre pedido' : 'Consultar disponibilidad'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onView(producto)}
        className="col-start-2 row-start-3 inline-flex w-fit items-center gap-1.5 rounded-field bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700 sm:col-auto sm:row-auto sm:px-4 sm:py-2.5 sm:text-sm"
      >
        <Icon name="arrow-right" className="size-4" />
        Ver producto
      </button>
    </article>
  );
}