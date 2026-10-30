import Icon from '../ui/Icon';

interface StarRatingProps {
  rating: number;
}

const ESTRELLAS = Array.from({ length: 5 }, (_, indice) => indice);

export default function StarRating({ rating }: StarRatingProps) {
  const porcentaje = Math.max(0, Math.min(100, (rating / 5) * 100));

  return (
    <span
      className="relative inline-flex shrink-0"
      role="img"
      aria-label={`${rating.toFixed(1)} de 5 estrellas`}
    >
      <span className="flex gap-0.5 text-ink-200">
        {ESTRELLAS.map((estrella) => (
          <Icon key={estrella} name="star" className="size-3.5 shrink-0" />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-accent-500"
        style={{ width: `${porcentaje}%` }}
        aria-hidden="true"
      >
        {ESTRELLAS.map((estrella) => (
          <Icon key={estrella} name="star" className="size-3.5 shrink-0" />
        ))}
      </span>
    </span>
  );
}
