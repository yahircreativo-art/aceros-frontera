/**
 * Botón del Design System (Figma: componente "Button" e "Icon Button").
 * Variantes Primary / Secondary / Tertiary / Dark / Link, tamaños S · M · L,
 * esquina inferior derecha recortada (chaflán de 6 · 8 · 10 px) y estados
 * hover / pressed / focus / disabled ligados a los tokens semánticos.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'dark'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'tab'
  | 'unstyled';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'none';
export type IconPosition = 'left' | 'right';

interface ButtonClassesOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

const BASE =
  'inline-flex items-center justify-center gap-3 whitespace-nowrap transition-colors disabled:cursor-not-allowed aria-disabled:cursor-not-allowed';

/* Las variantes rellenas pintan su fondo con --btn-bg (lo usa btn-chamfer o bg-(--btn-bg)). */
const DESHABILITADO_RELLENO =
  'disabled:[--btn-bg:var(--color-surface-disabled)] disabled:text-text-disabled aria-disabled:[--btn-bg:var(--color-surface-disabled)] aria-disabled:text-text-disabled';

const VARIANTES: Record<ButtonVariant, string> = {
  primary: `[--btn-bg:var(--color-brand-primary)] text-text-on-brand hover:[--btn-bg:var(--color-brand-hover)] active:[--btn-bg:var(--color-brand-active)] ${DESHABILITADO_RELLENO}`,
  secondary: `[--btn-bg:var(--color-accent-primary)] text-text-on-accent hover:[--btn-bg:var(--color-accent-hover)] active:[--btn-bg:var(--color-accent-active)] ${DESHABILITADO_RELLENO}`,
  tertiary: `[--btn-bg:var(--color-surface-control)] text-text-primary hover:[--btn-bg:var(--color-surface-control-hover)] active:[--btn-bg:var(--color-surface-control-active)] ${DESHABILITADO_RELLENO}`,
  dark: `[--btn-bg:var(--color-surface-inverse)] text-text-inverse hover:[--btn-bg:var(--color-surface-inverse-raised)] active:[--btn-bg:var(--color-surface-inverse-active)] ${DESHABILITADO_RELLENO}`,
  /* Figma "Page Item" (default): superficie blanca con borde suave. */
  outline:
    '[--btn-bg:var(--color-surface-primary)] border border-border-default text-text-primary hover:border-border-strong hover:text-text-brand disabled:text-text-disabled',
  ghost: 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary',
  link: 'type-button-m text-text-brand hover:text-brand-hover active:text-brand-active disabled:text-text-disabled',
  /* Figma "Tab": activa con subrayado verde de 4 px. */
  tab: 'type-subtitle border-b-4 border-transparent text-text-secondary hover:text-text-primary aria-pressed:border-brand-primary aria-pressed:text-text-primary',
  unstyled: '',
};

const TAMANOS: Record<ButtonSize, string> = {
  sm: 'btn-chamfer [--chamfer:6px] min-h-8 px-4 py-2 type-button-s',
  md: 'btn-chamfer [--chamfer:8px] min-h-11 px-6 py-3 type-button-m',
  lg: 'btn-chamfer [--chamfer:10px] min-h-13 px-8 py-4 type-button-l',
  /* Figma "Page Item" / "Icon Button": cuadrado sin chaflán. */
  icon: 'size-10 p-0 bg-(--btn-bg) type-label',
  none: '',
};

const TAMANO_ICONO: Record<ButtonSize, string> = {
  sm: 'size-4',
  md: 'size-4',
  lg: 'size-5',
  icon: 'size-5',
  none: 'size-4',
};

/** Une las clases del botón según variante y tamaño. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: ButtonClassesOptions = {}): string {
  /* link y tab no llevan caja: se ignora el relleno/chaflán del tamaño. */
  const tamano = variant === 'link' || variant === 'tab' ? '' : TAMANOS[size];

  return [BASE, VARIANTES[variant], tamano, fullWidth ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ');
}

/** Tamaño por defecto del icono para cada tamaño de botón. */
export function iconSizeFor(size: ButtonSize = 'md'): string {
  return TAMANO_ICONO[size];
}
